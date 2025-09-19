from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime


class ClienteLogin(BaseModel):
    email: EmailStr
    senha: str


class ClienteCadastro(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    telefone: str
    cpf: Optional[str] = None
    endereco: Optional[str] = None

    @validator('cpf', pre=True, always=True)
    def validar_e_limpar_cpf(cls, validador: str) -> Optional[str]:
        if not validador: return None
        cpf_numeros = "".join(filter(str.isdigit, validador))
        if len(cpf_numeros) != 11:
            raise ValueError('O CPF deve conter 11 dígitos numéricos.')
        return cpf_numeros


class ClienteUpdate(BaseModel):
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    cpf: Optional[str] = None
    nova_senha: Optional[str] = None
    codigo_verificacao: Optional[str] = None

    @validator('cpf', pre=True, always=True)
    def validar_e_limpar_cpf(cls, validador: str) -> Optional[str]:
        if not validador: return None
        cpf_numeros = "".join(filter(str.isdigit, validador))
        if len(cpf_numeros) != 11:
            raise ValueError('O CPF deve conter 11 dígitos numéricos.')
        return cpf_numeros


class PetCadastro(BaseModel):
    nome: str
    tipo: str
    raca: str
    idade: int
    peso: Optional[float] = None


class Pet(PetCadastro):
    id: int
    cliente_id: int


class PetUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[str] = None
    raca: Optional[str] = None
    idade: Optional[int] = None
    peso: Optional[float] = None


class HistoricoItem(BaseModel):
    servico_realizado: str
    funcionario: str
    data_hora: datetime
    valor: float


class PetHistoryResponse(BaseModel):
    consultas: list[HistoricoItem]
    servicos: list[HistoricoItem]

class PasswordResetRequest(BaseModel):
    senha_atual: str
    nova_senha: str

class PasswordResetConfirm(BaseModel):
    nova_senha: str
    codigo_verificacao: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr