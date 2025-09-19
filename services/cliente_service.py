import secrets
import string

from fastapi import HTTPException
from psycopg2 import IntegrityError
from seguranca import cria_hash_senha, verifica_senha, cria_token_de_acesso
from repositories.cliente_repository import RepositorioCliente
from datetime import datetime

class ServicosCliente:
    def __init__(self):
        self.repo = RepositorioCliente()

    def gerar_senha_temporaria(self):
        chars = string.ascii_letters + string.digits + "!@#$%"
        return ''.join(secrets.choice(chars) for _ in range(8))

    def cadastrar_por_funcionario(self, dados_cliente):
        try:
            # Gerar senha temporária e hash
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

            # Retornar senha temporária para o gestor exibir
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

    def login(self, dados_login_clientes):
        resultado = self.repo.buscar_pelo_email(dados_login_clientes.email)

        if not resultado:
            raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

        user_id, senha_hashed_do_banco = resultado

        if not verifica_senha(dados_login_clientes.senha, senha_hashed_do_banco):
            raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

        dados_usuario = self.buscar_pelo_id(user_id)

        if not dados_usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado após verificação.")

        token = cria_token_de_acesso(data={"sub": str(user_id)})

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": dados_usuario
        }

    def buscar_todos(self):
        return self.repo.buscar_todos()

    def buscar_pelo_id(self, user_id: int):
        user_data = self.repo.procurar_pelo_id(user_id)
        if not user_data:
            return None

        return {
            "id": user_data[0],
            "nome": user_data[1],
            "email": user_data[2],
            "telefone": user_data[3],
            "endereco": user_data[4] if user_data[4] else "Não informado"
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
        # Buscar dados atuais para histórico
        cliente_atual = self.repo.procurar_pelo_id(id)
        if not cliente_atual:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")

        # Verificar email duplicado
        cliente_email = self.repo.buscar_pelo_email(email)
        if cliente_email and cliente_email[0] != id:
            raise HTTPException(status_code=400, detail="Já existe um cliente com este email.")

        # Verificar CPF duplicado
        if cpf:
            cliente_cpf = self.repo.procurar_por_cpf(cpf)
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
        if (len(cliente_atual) > 5 and cliente_atual[5] != cpf):
            campos_modificados.append(("cpf", cliente_atual[5], cpf))

        # Atualizar cliente
        self.repo.editar_cliente(id, nome, email, telefone, endereco, cpf)

        # Registrar histórico
        for campo, antigo, novo in campos_modificados:
            self.repo.registrar_historico(
                cliente_id=id,
                funcionario_id=funcionario_id,
                campo=campo,
                valor_antigo=antigo,
                valor_novo=novo
            )

        return {"mensagem": f"Cliente '{nome}' atualizado com sucesso."}