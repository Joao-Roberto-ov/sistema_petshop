from fastapi import HTTPException
from psycopg2 import IntegrityError
from seguranca import cria_hash_senha, verifica_senha, cria_token_de_acesso
from repositories.cliente_repository import RepositorioCliente
from modelos import (ClienteCadastro, ClienteLogin, ClienteUpdate, 
                     PasswordResetRequest, PasswordResetConfirm, ForgotPasswordRequest) 
from services.email_service import EmailService
import random
import string
from datetime import datetime, timedelta, timezone

class ServicosCliente:

    def __init__(self):
        self.repo = RepositorioCliente()
        self.email_service = EmailService()

    def signup(self, cliente_dados: ClienteCadastro):
        try:
            senha_hash = cria_hash_senha(cliente_dados.senha)
            endereco = cliente_dados.endereco if cliente_dados.endereco else 'Não informado'
            cpf = cliente_dados.cpf if cliente_dados.cpf else None
            self.repo.cadastrar_cliente(cliente_dados.nome, cliente_dados.email, senha_hash, cliente_dados.telefone, endereco, cpf)
        except IntegrityError as e:
            error_message = str(e).lower()
            if "email" in error_message: raise HTTPException(status_code=400, detail="O e-mail fornecido já está cadastrado.")
            elif "cpf" in error_message: raise HTTPException(status_code=400, detail="O CPF fornecido já está cadastrado.")
            else: raise HTTPException(status_code=400, detail="Erro de integridade dos dados.")

    def login(self, dados_login_clientes: ClienteLogin):
        resultado = self.repo.buscar_pelo_email(dados_login_clientes.email)
        if not resultado: raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")
        user_id, senha_hashed_do_banco = resultado
        if not verifica_senha(dados_login_clientes.senha, senha_hashed_do_banco): raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")
        dados_usuario = self.buscar_pelo_id(user_id)
        if not dados_usuario: raise HTTPException(status_code=404, detail="Usuário não encontrado após verificação.")
        token = cria_token_de_acesso(data={"sub": str(user_id)})
        return {"access_token": token, "token_type": "bearer", "user": dados_usuario}

    def buscar_pelo_id(self, user_id: int):
        user_data_tuple = self.repo.procurar_pelo_id(user_id)
        if not user_data_tuple: return None
        return {"id": user_data_tuple[0], "nome": user_data_tuple[1], "email": user_data_tuple[2], "telefone": user_data_tuple[3], "endereco": user_data_tuple[4] or "Não informado", "cpf": user_data_tuple[5]}

    def solicitar_alteracao_senha(self, user_id: int, request_data: PasswordResetRequest):
        user_db = self.repo.buscar_pelo_id_com_senha(user_id)
        if not user_db: raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        
        user_email = user_db[2]
        senha_hashed_do_banco = user_db[4]

        # Verificação 1: Senha atual incorreta
        if not verifica_senha(request_data.senha_atual, senha_hashed_do_banco):
            raise HTTPException(status_code=401, detail="A senha atual está incorreta.")

        # Verificação 2: Nova senha não pode ser igual à atual
        if verifica_senha(request_data.nova_senha, senha_hashed_do_banco):
            raise HTTPException(status_code=400, detail="A nova senha não pode ser igual à senha atual.")

        codigo = ''.join(random.choices(string.digits, k=6))
        expiracao = datetime.now(timezone.utc) + timedelta(minutes=2) # Aumentado para 2 minutos

        self.repo.salvar_codigo_reset(user_id, codigo, expiracao)
        self.email_service.enviar_codigo_reset(user_email, codigo)
        
        return {"message": "Código de verificação enviado para o seu e-mail. Ele expira em 2 minutos."}

    def confirmar_alteracao_senha(self, user_id: int, confirm_data: PasswordResetConfirm):
        resultado_busca = self.repo.buscar_codigo_reset(user_id, confirm_data.codigo_verificacao)
        if not resultado_busca: raise HTTPException(status_code=400, detail="Código de verificação inválido.")
        
        _, expiracao_salva = resultado_busca
        if datetime.now(timezone.utc) > expiracao_salva:
            raise HTTPException(status_code=400, detail="Código de verificação expirado. Por favor, solicite um novo.")

        nova_senha_hash = cria_hash_senha(confirm_data.nova_senha)
        self.repo.atualizar_cliente(user_id, {'senha': nova_senha_hash})
        self.repo.deletar_codigo_reset(user_id, confirm_data.codigo_verificacao)

        user_email = self.buscar_pelo_id(user_id)['email']
        self.email_service.notificar_alteracao_perfil(user_email, [{"campo": "Senha", "antigo": "********", "novo": "********"}])

        return {"message": "Senha alterada com sucesso!"}

    def atualizar_perfil(self, user_id: int, dados_update: ClienteUpdate):
        dados_atuais_dict = self.buscar_pelo_id(user_id)
        if not dados_atuais_dict: raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        
        campos_para_atualizar = {}
        campos_modificados = []

        if dados_update.telefone is not None and dados_update.telefone != dados_atuais_dict['telefone']:
            campos_para_atualizar['telefone'] = dados_update.telefone
            campos_modificados.append({"campo": "Telefone", "antigo": dados_atuais_dict['telefone'], "novo": dados_update.telefone})
        
        if dados_update.endereco is not None and dados_update.endereco != dados_atuais_dict['endereco']:
            campos_para_atualizar['endereco'] = dados_update.endereco
            campos_modificados.append({"campo": "Endereço", "antigo": dados_atuais_dict['endereco'], "novo": dados_update.endereco})

        if dados_update.cpf is not None and dados_update.cpf != dados_atuais_dict['cpf']:
            campos_para_atualizar['cpf'] = dados_update.cpf
            campos_modificados.append({"campo": "CPF", "antigo": dados_atuais_dict['cpf'] or "Não informado", "novo": dados_update.cpf})

        # Verificação de dados duplicados
        if not campos_para_atualizar:
            raise HTTPException(status_code=400, detail="Nenhuma informação foi alterada. Forneça um novo valor para atualizar.")

        try:
            cliente_atualizado = self.repo.atualizar_cliente(user_id, campos_para_atualizar)
            if campos_modificados:
                user_email = cliente_atualizado['email']
                self.email_service.notificar_alteracao_perfil(user_email, campos_modificados)
            return cliente_atualizado
        except IntegrityError: raise HTTPException(status_code=400, detail="O CPF informado já está em uso por outra conta.")
        except Exception as e: raise HTTPException(status_code=500, detail=f"Erro ao atualizar o perfil: {e}")

    # NOVO MÉTODO: Fluxo de "Esqueci a Senha"
    def esqueci_minha_senha(self, request_data: ForgotPasswordRequest):
        """
        Inicia o fluxo de recuperação de senha para um usuário que não está logado.
        """
        user_db = self.repo.buscar_cliente_pelo_email(request_data.email)
        if not user_db:
            # Por segurança, não informamos se o e-mail existe ou não.
            raise HTTPException(status_code=200, detail="Se um usuário com este e-mail existir, um link de redefinição será enviado.")

        user_id, _, user_email = user_db
        
        # Usa o mesmo mecanismo de código, mas poderia usar um token JWT mais longo
        codigo = ''.join(random.choices(string.digits, k=6))
        expiracao = datetime.now(timezone.utc) + timedelta(minutes=15) # Duração maior

        self.repo.salvar_codigo_reset(user_id, codigo, expiracao)
        # Um e-mail diferente seria enviado aqui, com um link
        self.email_service.enviar_link_redefinicao(user_email, codigo) # Supondo que o email_service tenha este método

        return {"message": "Se um usuário com este e-mail existir, um link de redefinição será enviado."}
