import secrets
from modelos import UsuarioLogin, RedefinirSenhaRequest
from fastapi import HTTPException
from psycopg2 import IntegrityError
from seguranca import cria_hash_senha, verifica_senha, cria_token_de_acesso
from repositories.cliente_repository import RepositorioCliente
from modelos import (ClienteCadastro, ClienteUpdate,
                     PasswordResetRequest, PasswordResetConfirm, ForgotPasswordRequest)
from services.email_service import EmailService
import random
import string
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ServicosCliente:
    def __init__(self):
        self.repo = RepositorioCliente()
        self.email_service = EmailService()

    def gerar_senha_temporaria(self):
        chars = string.ascii_letters + string.digits + "!@#$%"
        return "".join(secrets.choice(chars) for _ in range(8))

    def cadastrar_por_funcionario(self, dados_cliente):
        try:
            senha_temp = self.gerar_senha_temporaria()
            senha_hash = cria_hash_senha(senha_temp)

            endereco = dados_cliente.endereco if dados_cliente.endereco else 'Não informado'
            cpf = dados_cliente.cpf if dados_cliente.cpf else None

            self.repo.cadastrar_cliente(
                dados_cliente.nome,
                dados_cliente.email,
                senha_hash,
                dados_cliente.telefone,
                endereco,
                cpf
            )

            return {"senha_temporaria": senha_temp}

        except IntegrityError as e:
            error_message = str(e).lower()

            if "email" in error_message:
                raise HTTPException(status_code=400, detail="O e-mail fornecido já está cadastrado.")
            elif "cpf" in error_message:
                raise HTTPException(status_code=400, detail="O CPF fornecido já está cadastrado.")
            else:
                raise HTTPException(status_code=400, detail="Erro de integridade dos dados.")

    def signup(self, cliente_dados):
        try:
            senha_hash = cria_hash_senha(cliente_dados.senha)
            endereco = cliente_dados.endereco if cliente_dados.endereco else 'Não informado'
            cpf = cliente_dados.cpf if cliente_dados.cpf else None

            self.repo.cadastrar_cliente(cliente_dados.nome, cliente_dados.email, senha_hash, cliente_dados.telefone, endereco, cpf)

        except IntegrityError as e:
            error_message = str(e).lower()

            if "email" in error_message:
                raise HTTPException(status_code=400, detail="O e-mail fornecido já está cadastrado.")

            elif "cpf" in error_message:
                raise HTTPException(status_code=400, detail="O CPF fornecido já está cadastrado.")

            else:
                raise HTTPException(status_code=400, detail="Erro de integridade dos dados.")

    def login(self, dados_login_clientes: UsuarioLogin):
        try:
            print("=== ServicosCliente.login() iniciado ===")
            print(f"Buscando cliente com email: {dados_login_clientes.email}")

            resultado = self.repo.buscar_pelo_email(dados_login_clientes.email)
            print(f"Resultado da busca por email: {resultado}")

            if not resultado:
                print("=== CLIENTE NÃO ENCONTRADO ===")
                raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

            user_id, senha_hashed_do_banco, is_ativo = resultado

            if not is_ativo:
                print("=== CONTA DESATIVADA ===")
                raise HTTPException(status_code=403, detail="Sua conta está desativada. Por favor, entre em contato com o suporte.")
            print(f"Cliente encontrado - ID: {user_id}")
            print(f"Senha hash do banco: {senha_hashed_do_banco[:20]}...")

            print("Verificando senha...")
            if not verifica_senha(dados_login_clientes.senha, senha_hashed_do_banco):
                print("=== SENHA INCORRETA ===")
                raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

            print("Buscando dados completos do cliente...")
            dados_usuario = self.buscar_pelo_id(user_id)
            print(f"Dados do cliente: {dados_usuario}")

            if not dados_usuario:
                print("=== DADOS DO CLIENTE NÃO ENCONTRADOS ===")
                raise HTTPException(status_code=404, detail="Usuário não encontrado após verificação.")



            print("Criando token JWT...")
            token = cria_token_de_acesso(data={"sub": str(user_id), "tipo": "cliente"})
            print("=== TOKEN CRIADO COM SUCESSO ===")

            return {
                "access_token": token,
                "token_type": "bearer",
                "user": dados_usuario
            }

        except HTTPException:
            print("=== HTTPException relançada ===")
            raise  # Re-raise HTTPExceptions
        except Exception as e:
            print(f"=== ERRO CRÍTICO NO LOGIN: {str(e)} ===")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Erro interno no login: {str(e)}")

    def buscar_todos(self):
        try:
            print("=== ServicosCliente.buscar_todos() chamado ===")
            clientes = self.repo.buscar_todos()
            print(f"=== Repositório retornou: {len(clientes)} clientes ===")
            print(f"=== Tipo dos dados: {type(clientes)} ===")
            if clientes:
                print(f"=== Primeiro cliente: {clientes[0]} ===")
            return clientes
        except Exception as e:
            print(f"=== ERRO em ServicosCliente.buscar_todos: {str(e)} ===")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Erro interno ao buscar clientes: {str(e)}")

    def buscar_pelo_id(self, user_id: int):
        user_data = self.repo.procurar_pelo_id(user_id)
        if not user_data:
            return None

        return {
            "id": user_data[0],
            "nome": user_data[1],
            "email": user_data[2],
            "telefone": user_data[3],
            "endereco": user_data[4] if len(user_data) > 4 and user_data[4] else 'Não informado',
            "cpf": user_data[5] if len(user_data) > 5 and user_data[5] else None,
            "is_ativo": user_data[6] if len(user_data) > 6 else True  #retorna o valor real de is_ativo, ou true como padrão
        }


    def editar_cliente(
            self,
            id: int,
            nome: str,
            email: str,
            telefone: str,
            endereco: str,
            cpf: str | None = None,
            funcionario_id: int | None = None
    ):
        #busca os dados atuais para o historico
        cliente_atual = self.repo.procurar_pelo_id(id)
        if not cliente_atual:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")

        # verrificar se tem email duplicado (excluindo o proprio cliente)
        cliente_email = self.repo.buscar_pelo_email(email)
        if cliente_email and cliente_email[0] != id:
            raise HTTPException(status_code=400, detail="Já existe um cliente com este email.")

        #verifica se existe um CPF duplicado (excluindo o do cliente logado)
        if cpf:
            cliente_cpf = self.repo.buscar_pelo_cpf(cpf)
            if cliente_cpf and cliente_cpf[0] != id:
                raise HTTPException(status_code=400, detail="Já existe um cliente com este CPF.")

        campos_modificados = []

        if cliente_atual[1] != nome:
            campos_modificados.append(("nome", cliente_atual[1], nome))
        if cliente_atual[2] != email:
            campos_modificados.append(("email", cliente_atual[2], email))
        if cliente_atual[3] != telefone:
            campos_modificados.append(("telefone", cliente_atual[3], telefone))
        if cliente_atual[4] != endereco:
            campos_modificados.append(("endereco", cliente_atual[4], endereco))
        if len(cliente_atual) > 5 and cliente_atual[5] != cpf:
            campos_modificados.append(("cpf", cliente_atual[5], cpf))

        #atualiza o cliente
        self.repo.editar_cliente(id, nome, email, telefone, endereco, cpf)

        #registra histórico
        for campo, antigo, novo in campos_modificados:
            self.repo.registrar_historico(
                cliente_id=id,
                funcionario_id=funcionario_id,
                campo=campo,
                valor_antigo=antigo,
                valor_novo=novo
            )

        return {"mensagem": f"Cliente '{nome}' atualizado com sucesso."}

    def solicitar_alteracao_senha(self, user_id: int, request_data: PasswordResetRequest):
        user_db = self.repo.buscar_pelo_id_com_senha(user_id)
        if not user_db:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        user_email = user_db[2]
        senha_hashed_do_banco = user_db[4]

        # Verificação 1: Senha atual incorreta
        if not verifica_senha(request_data.senha_atual, senha_hashed_do_banco):
            raise HTTPException(status_code=401, detail="A senha atual está incorreta.")

        # Verificação 2: Nova senha não pode ser igual à atual
        if verifica_senha(request_data.nova_senha, senha_hashed_do_banco):
            raise HTTPException(status_code=400, detail="A nova senha não pode ser igual à senha atual.")

        codigo = ''.join(random.choices(string.digits, k=6))
        expiracao = datetime.now(timezone.utc) + timedelta(minutes=2)  # Aumentado para 2 minutos

        self.repo.salvar_codigo_reset(user_id, codigo, expiracao)
        self.email_service.enviar_codigo_reset(user_email, codigo)

        return {"message": "Código de verificação enviado para o seu e-mail. Ele expira em 2 minutos."}

    def confirmar_alteracao_senha(self, user_id: int, confirm_data: PasswordResetConfirm):
        resultado_busca = self.repo.buscar_codigo_reset(user_id, confirm_data.codigo_verificacao)
        if not resultado_busca:
            raise HTTPException(status_code=400, detail="Código de verificação inválido.")

        _, expiracao_salva = resultado_busca
        if datetime.now(timezone.utc) > expiracao_salva:
            raise HTTPException(status_code=400, detail="Código de verificação expirado. Por favor, solicite um novo.")

        nova_senha_hash = cria_hash_senha(confirm_data.nova_senha)
        self.repo.atualizar_cliente(user_id, {'senha': nova_senha_hash})
        self.repo.deletar_codigo_reset(user_id, confirm_data.codigo_verificacao)

        user_email = self.buscar_pelo_id(user_id)['email']
        self.email_service.notificar_alteracao_perfil(user_email,
                                                      [{"campo": "Senha", "antigo": "********", "novo": "********"}])

        return {"message": "Senha alterada com sucesso!"}

    def atualizar_perfil(self, user_id: int, dados_update: ClienteUpdate):
        try:
            dados_atuais_dict = self.buscar_pelo_id(user_id)
            if not dados_atuais_dict:
                raise HTTPException(status_code=404, detail="Usuário não encontrado.")

            campos_para_atualizar = {}
            campos_modificados = []

            if dados_update.telefone is not None and dados_update.telefone != dados_atuais_dict.get('telefone'):
                campos_para_atualizar['telefone'] = dados_update.telefone
                campos_modificados.append(
                    {"campo": "Telefone", "antigo": dados_atuais_dict.get('telefone', 'Não informado'), "novo": dados_update.telefone})

            if dados_update.endereco is not None and dados_update.endereco != dados_atuais_dict.get('endereco'):
                campos_para_atualizar['endereco'] = dados_update.endereco
                campos_modificados.append(
                    {"campo": "Endereço", "antigo": dados_atuais_dict.get('endereco', 'Não informado'), "novo": dados_update.endereco})

            if dados_update.cpf is not None and dados_update.cpf != dados_atuais_dict.get('cpf'):
                campos_para_atualizar['cpf'] = dados_update.cpf
                campos_modificados.append(
                    {"campo": "CPF", "antigo": dados_atuais_dict.get('cpf') or "Não informado", "novo": dados_update.cpf})

            #verificação de dados duplicados
            if not campos_para_atualizar:
                raise HTTPException(status_code=400,
                                    detail="Nenhuma informação foi alterada. Forneça um novo valor para atualizar.")

            try:
                cliente_atualizado = self.repo.atualizar_cliente(user_id, campos_para_atualizar)
                if campos_modificados and cliente_atualizado:
                    user_email = cliente_atualizado['email']
                    self.email_service.notificar_alteracao_perfil(user_email, campos_modificados)
                return cliente_atualizado
            except IntegrityError:
                raise HTTPException(status_code=400, detail="O CPF informado já está em uso por outra conta.")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro ao atualizar o perfil: {str(e)}")
        
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

    #metodo do fluxo de "Esqueci a Senha"
    def esqueci_minha_senha(self, request_data: ForgotPasswordRequest):
        """
        Inicia o fluxo de recuperação de senha para um usuário que não está logado.
        """
        try:
            user_db = self.repo.buscar_cliente_pelo_email(request_data.email)
            if not user_db:
                #mensagem generica para evitar enumeraçao dos users
                print(f"Tentativa de redefinição de senha para e-mail não cadastrado: {request_data.email}")
                return {"message": "Se um usuário com este e-mail existir, um link de redefinição será enviado."}

            user_id, _, user_email = user_db
            token = secrets.token_urlsafe(32) # Gera um token seguro
            expiracao = datetime.now(timezone.utc) + timedelta(minutes=15) # AC4: Token expira em 15 minutos

            #armazena o token no banco de dados associado ao cliente
            self.repo.salvar_token_redefinicao(user_id, token, expiracao)

            # AC1: envia o e-mail com o link de redefinição
            # AC2: email não revela a senha atual
            # AC4: link deve ser de uso unico e com prazo de expiraçao
            # AC5: link deve direcionar para a pagina de redefiniçao de senha
            link_redefinicao = f"http://petlifes-env.us-east-2.elasticbeanstalk.com/reset-password?token={token}&email={user_email}"
            self.email_service.enviar_link_redefinicao(user_email, link_redefinicao)
            return {"message": "Se um usuário com este e-mail existir, um link de redefinição será enviado."}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

    def redefinir_senha_publica(self, request_data: RedefinirSenhaRequest):

        #gbusca o token e o email associado no banco de dados
        token_info = self.repo.buscar_token_redefinicao(request_data.token)

        if not token_info:
            raise HTTPException(status_code=400, detail="Token inválido ou expirado.")

        user_id, email_associado, expiracao_token = token_info

        if datetime.now(timezone.utc) > expiracao_token:
            self.repo.invalidar_token_redefinicao(request_data.token) #invalida o token expirado
            raise HTTPException(status_code=400, detail="Token inválido ou expirado.")

        # Hash da nova senha antes de salvar
        senha_hashed = cria_hash_senha(request_data.nova_senha)
        self.repo.atualizar_cliente(user_id, {'senha': senha_hashed})
        self.repo.invalidar_token_redefinicao(request_data.token) #invalida o token apos o uso

        return {"message": "Senha redefinida com sucesso!"}

    def desativar_cliente(self, cliente_id: int, is_ativo: bool):
        try:
            print(f"=== DESATIVAR CLIENTE ===")
            print(f"Cliente ID: {cliente_id}")
            print(f"Novo status: {is_ativo}")

            cliente_existente = self.repo.procurar_pelo_id(cliente_id)
            print(f"Cliente encontrado: {cliente_existente}")

            if not cliente_existente:
                print(f"Cliente {cliente_id} não encontrado")
                raise HTTPException(status_code=404, detail="Cliente não encontrado.")

            print(f"Cliente encontrado: {cliente_existente[1]} (ID: {cliente_existente[0]})")

            # TESTE: Verificar se o método existe
            print(f"Métodos disponíveis no repo: {[method for method in dir(self.repo) if not method.startswith('_')]}")

            self.repo.atualizar_status_cliente(cliente_id, is_ativo)
            print(f"Status do cliente atualizado para: {'Ativo' if is_ativo else 'Inativo'}")

            return {"message": f"Cliente {'ativado' if is_ativo else 'desativado'} com sucesso."}

        except HTTPException:
            raise
        except Exception as e:
            print(f"Erro ao alterar status do cliente: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Erro ao alterar status do cliente: {str(e)}")