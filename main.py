from typing import Optional
import psycopg2
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, validator
from passlib.context import CryptContext
from bancoDeDados import conectar, encerra_conexao

#hashing de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ClienteCadastro(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    telefone: str
    nome_pet: Optional[str] = None
    cpf: Optional[str] = None
    endereco: Optional[str] = None

    @validator('cpf')
    def validar_e_limpar_cpf(cls, validador: str) -> Optional[str]:

        if validador is None:
            return None
        cpf_numeros = "".join(filter(str.isdigit, validador))

        if len(cpf_numeros) != 11:
            raise ValueError('O CPF deve conter 11 dígitos numéricos.')
        return cpf_numeros
app = FastAPI()
# ---------------------------------------------------------------------------------------------------------------------
@app.get("/", response_class = RedirectResponse, include_in_schema = False)
async def raiz():
    return "/docs"

# ---------------------------------------------------------------------------------------------------------------------
@app.post("/signup", status_code = 201) #se der certo, aparece 201 galera
async def signup(cliente: ClienteCadastro):

    senha_hashed = pwd_context.hash(cliente.senha)
    conn = None

    try:
        conn = conectar()
        if not conn:
            raise HTTPException(status_code=500, detail = "Não foi possível conectar ao banco de dados.")

        cursor = conn.cursor()

        nome_pet_corrigido = cliente.nome_pet if cliente.nome_pet else 'Não informado'
        endereco_corrigido = cliente.endereco if cliente.endereco else 'Não informado'
        cpf_verificado = cliente.cpf if cliente.cpf else None

        sql = "INSERT INTO clientes(nome, email, senha, telefone, nome_pet, endereco, cpf) VALUES(%s, %s, %s, %s, %s, %s, %s)"
        cursor.execute(sql,(cliente.nome,cliente.email, senha_hashed, cliente.telefone,nome_pet_corrigido,endereco_corrigido,cpf_verificado))

        conn.commit()
        cursor.close()
        conn.close()

        return {"Aviso": f"Cliente '{cliente.nome}' cadastrado com sucesso!"}

    except psycopg2.IntegrityError:
        #esse erro ocorre se a gente tentar inserir um email que já existe por causa do UNIQUE da coluna
        raise HTTPException(status_code = 400, detail=f"O e-mail {cliente.email} fornecido já está cadastrado.")

    except Exception as e:
        #para qualquer outro erro inesperado nos processos
        print(f"Erro inesperado: {e}")
        raise HTTPException(status_code = 500, detail="Ocorreu um erro interno ao processar o cadastro.")

    finally:
        #garante que a conexao seja encerrada, mesmo se der problema
        if conn:
            encerra_conexao(conn)

# ---------------------------------------------------------------------------------------------------------------------
@app.post("/login")
async def signin():
    #a logica de login é basicamente comparar a senha enviada com o hash salvo no banco e redirecionar o user para a tela inicial ou de perfil familia
    return {"message": "Login (a ser implementado)"}