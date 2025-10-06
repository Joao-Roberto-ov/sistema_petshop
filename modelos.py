from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, Literal
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

class FuncionarioCadastro(BaseModel):
    nome: str = Field(..., min_length=1, description="Nome completo é obrigatório")
    cargo_id: int = Field(..., description="ID do cargo é obrigatório")
    cargo_funcao: str = Field(..., min_length=1, description="Nome do cargo (ex: Gestor, Veterinário)")
    email: EmailStr
    telefone: str = Field(..., min_length=1, description="Telefone é obrigatório")
    cpf: Optional[str] = None
    endereco: Optional[str] = None
    horario_inicio: str = Field(..., description="Horário de início no formato HH:MM")
    horario_fim: str = Field(..., description="Horário de fim no formato HH:MM")
    dias_trabalho: str = Field(..., min_length=1, description="Dias da semana separados por vírgula (ex: Segunda,Terça,Quarta)")
    senha: str = Field(..., min_length=6, description="Senha deve ter pelo menos 6 caracteres")
    is_ativo: bool = True

    @validator('nome')
    def validar_nome(cls, v):
        if not v or not v.strip():
            raise ValueError('Nome não pode ficar em branco')
        return v.strip()



    @validator('telefone')
    def validar_telefone(cls, v):
        if not v or not v.strip():
            raise ValueError('Telefone não pode ficar em branco')
        return v.strip()

    @validator('cpf', pre=True, always=True)
    def validar_e_limpar_cpf(cls, validador: str) -> Optional[str]:
        if not validador: 
            return None
        cpf_numeros = "".join(filter(str.isdigit, validador))
        if len(cpf_numeros) != 11:
            raise ValueError('O CPF deve conter 11 dígitos numéricos.')
        return cpf_numeros

    @validator('horario_inicio', 'horario_fim')
    def validar_horario(cls, v):
        import re
        if not v or not v.strip():
            raise ValueError('Horário é obrigatório')
        # Aceita formato HH:MM ou HH:MM:SS
        if re.match(r'^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$', v):
            # Normaliza para HH:MM removendo segundos se existirem
            return v[:5] if len(v) > 5 else v
        raise ValueError('Horário deve estar no formato HH:MM ou HH:MM:SS (ex: 08:00)')

    @validator('dias_trabalho')
    def validar_dias_trabalho(cls, v):
        if not v or not v.strip():
            raise ValueError('Dias de trabalho são obrigatórios')
        dias_validos = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
        dias = [dia.strip() for dia in v.split(',')]
        for dia in dias:
            if dia not in dias_validos:
                raise ValueError(f'Dia inválido: {dia}. Dias válidos: {", ".join(dias_validos)}')
        return v

class FuncionarioUpdate(BaseModel):
    nome: Optional[str] = None
    cargo_id: Optional[int] = Field(None, ge=1, le=4, description="ID do cargo deve ser 1 (Gestor), 2 (Funcionário), 3 (Veterinário) ou 4 (Atendente)")
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    cpf: Optional[str] = None
    endereco: Optional[str] = None
    horario_inicio: Optional[str] = None
    horario_fim: Optional[str] = None
    dias_trabalho: Optional[str] = None
    is_ativo: Optional[bool] = None

    @validator('cpf', pre=True, always=True)
    def validar_e_limpar_cpf(cls, validador: str) -> Optional[str]:
        if not validador: 
            return None
        cpf_numeros = "".join(filter(str.isdigit, validador))
        if len(cpf_numeros) != 11:
            raise ValueError('O CPF deve conter 11 dígitos numéricos.')
        return cpf_numeros

    @validator('horario_inicio', 'horario_fim')
    def validar_horario(cls, v):
        if v is None:
            return v
        import re
        # Aceita formato HH:MM ou HH:MM:SS
        if re.match(r'^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$', v):
            # Normaliza para HH:MM removendo segundos se existirem
            return v[:5] if len(v) > 5 else v
        raise ValueError('Horário deve estar no formato HH:MM ou HH:MM:SS (ex: 08:00)')

    @validator('dias_trabalho')
    def validar_dias_trabalho(cls, v):
        if v is None:
            return v
        dias_validos = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
        dias = [dia.strip() for dia in v.split(',')]
        for dia in dias:
            if dia not in dias_validos:
                raise ValueError(f'Dia inválido: {dia}. Dias válidos: {", ".join(dias_validos)}')
        return v


class ProdutoCadastro(BaseModel):
    barcode: str
    nome: str
    preco_venda: float
    estoque: int
    animais_alvo: Literal['Cães', 'Gatos', 'Todos'] = 'Todos'
    marca: Optional[str] = None
    categoria: Optional[str] = None
    descricao: Optional[str] = None
    url_imagem: Optional[str] = None

class ServicoModel(BaseModel):
    nome: str
    descricao: Optional[str] = None
    duracao: int = Field(..., gt=0, description="Duração padrão em minutos")
    preco: float = Field(..., gt=0, description="Preço do serviço em reais")
    criador_id: Optional[int] = None
