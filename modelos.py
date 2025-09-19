from pydantic import BaseModel, EmailStr, validator
from typing import Optional

class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str

class ClienteCadastro(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    telefone: str
    cpf: Optional[str] = None
    endereco: Optional[str] = None

class ClienteCadastroPorFuncionario(BaseModel):
    nome: str
    email: EmailStr
    telefone: str
    cpf: Optional[str] = None
    endereco: Optional[str] = None

class FuncionarioModel(BaseModel):
    nome: str
    telefone: str
    cargo_id: int
    cpf: str
    endereco: str
    email: EmailStr
    isAtivo: bool



    @validator('cpf', pre=True, always=True)
    def validar_e_limpar_cpf(cls, validador: str) -> Optional[str]:
        if validador is None or validador == "":
            return None
        cpf_numeros = "".join(filter(str.isdigit, validador))
        if len(cpf_numeros) != 11:
            raise ValueError('O CPF deve conter 11 dígitos numéricos.')
        return cpf_numeros

    @validator('endereco', pre=True, always=True)
    def validar_endereco(cls, endereco: str) -> Optional[str]:
        if endereco is None or endereco == "":
            return None
        return endereco

class PetCadastro(BaseModel):
    nome: str
    tipo: str
    raca: str
    idade: int
    peso: float

class Pet(PetCadastro):
    id: int
    cliente_id: int
