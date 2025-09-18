from fastapi import HTTPException
from psycopg2 import IntegrityError
from seguranca import cria_hash_senha, verifica_senha, cria_token_de_acesso
from repositories.cliente_repository import RepositorioCliente

class ServicosCliente:
    def __init__(self):
        self.repo = RepositorioCliente()

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

        token = cria_token_de_acesso(data={"sub": str(user_id)})
        return {"access_token": token, "token_type": "bearer"}

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