from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime

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
    is_ativo: bool = True

    @validator('cpf', pre=True, always=True)
    def validar_e_limpar_cpf(cls, validador: str) -> Optional[str]:
        if not validador: return None
        cpf_numeros = "".join(filter(str.isdigit, validador))
        if len(cpf_numeros) != 11:
            raise ValueError('O CPF deve conter 11 dígitos numéricos.')
        return cpf_numeros

class ClienteCadastroPorFuncionario(BaseModel):
    nome: str
    email: EmailStr
    telefone: str
    cpf: Optional[str] = None
    endereco: Optional[str] = None
    is_ativo: bool = True

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

class ClienteEdicaoPorFuncionario(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None


class TokenRedefinicaoSenha(BaseModel):
    email: EmailStr
    token: str
    expiracao: datetime

class RedefinirSenhaRequest(BaseModel):
    token: str
    nova_senha: str

class FuncionarioCadastroPorAdmin(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    telefone: str
    cargo_id: int
    cpf: str
    endereco: str
    isAtivo: bool = True

    @validator("cpf", pre=True, always=True)
    def validar_e_limpar_cpf(cls, validador: str) -> Optional[str]:
        if not validador: return None
        cpf_numeros = "".join(filter(str.isdigit, validador))
        if len(cpf_numeros) != 11:
            raise ValueError("O CPF deve conter 11 dígitos numéricos.")
        return cpf_numeros


class ProdutoCadastro(BaseModel):
    barcode: str
    nome: str
    preco_venda: float
    estoque: int
    marca: Optional[str] = None
    categoria: Optional[str] = None
    descricao: Optional[str] = None
    url_imagem: Optional[str] = None