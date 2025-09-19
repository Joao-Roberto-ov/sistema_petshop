from fastapi import HTTPException
from psycopg2 import IntegrityError
from seguranca import cria_hash_senha, verifica_senha, cria_token_de_acesso
from repositories.funcionario_repository import RepositorioFuncionario

class ServicosFuncionario:
    def __init__(self):
        self.repo = RepositorioFuncionario()

    def login(self, dados_login):
        """
        Login de funcionário
        """
        resultado = self.repo.buscar_pelo_email(dados_login.email)

        if not resultado:
            raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

        user_id, senha_hashed_do_banco = resultado

        if not verifica_senha(dados_login.senha, senha_hashed_do_banco):
            raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

        dados_usuario = self.buscar_pelo_id(user_id)

        if not dados_usuario["is_ativo"]:
            raise HTTPException(status_code=403, detail="Funcionário inativo")

        token = cria_token_de_acesso(data={
            "sub": str(user_id),
            "role": dados_usuario["cargo"]
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": dados_usuario
        }

    def buscar_pelo_id(self, user_id: int):
        """
        Retorna dados completos do funcionário
        """
        user_data = self.repo.procurar_pelo_id(user_id)
        if not user_data:
            return None

        return {
            "id": user_data["id"],
            "nome": user_data["nome"],
            "email": user_data["email"],
            "telefone": user_data["telefone"],
            "endereco": user_data["endereco"] if user_data["endereco"] else "Nao informado",
            "cpf": user_data["cpf"],
            "cargo_id": user_data["cargo_id"],
            "cargo": user_data["cargo"],
            "is_ativo": user_data["is_ativo"]
        }
