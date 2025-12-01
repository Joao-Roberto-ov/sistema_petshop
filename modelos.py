from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Literal, List
from datetime import datetime, date
import json
import re


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
        if not validador:
            return None
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
        if not validador:
            return None
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
        if not validador:
            return None
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
        if not validador:
            return None
        cpf_numeros = "".join(filter(str.isdigit, validador))
        if len(cpf_numeros) != 11:
            raise ValueError('O CPF deve conter 11 dígitos numéricos.')
        return cpf_numeros


class PetCadastroBase(BaseModel):
    nome: str
    tipo: str
    raca: str
    idade: int
    peso: Optional[float] = None
    sexo_biologico: Optional[Literal["Macho", "Fêmea", "Não Informado"]] = "Não Informado"
    observacoes: Optional[str] = None


class Pet(PetCadastroBase):
    id: int
    cliente_id: int


class PetCadastro(PetCadastroBase):
    pass


class PetCadastroFuncionario(PetCadastroBase):
    cliente_id: int


class PetUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[str] = None
    raca: Optional[str] = None
    idade: Optional[int] = None
    peso: Optional[float] = None
    sexo_biologico: Optional[Literal["Macho", "Fêmea", "Não Informado"]] = None
    observacoes: Optional[str] = None


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
        if not validador:
            return None
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
    especialidades: Optional[List[int]] = Field(None, description="Lista de IDs de serviços de especialidade (apenas para cargo_id 2)")

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
    especialidades: Optional[List[int]] = Field(None, description="Lista de IDs de serviços de especialidade")

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


class PetTransferencia(BaseModel):
    """Modelo para a transferência de um pet para um novo cliente."""
    pet_id: int = Field(..., description="ID do pet a ser transferido.")
    novo_cliente_id: int = Field(..., description="ID do cliente que receberá a posse do pet.")


class ClienteBusca(BaseModel):
    """Modelo para a busca de clientes por nome ou CPF."""
    termo_busca: str = Field(..., description="Nome ou CPF do cliente a ser buscado.")


class ClienteBuscaResponse(BaseModel):
    """Modelo para a resposta da busca de clientes."""
    id: int
    nome: str
    email: EmailStr
    telefone: str
    cpf: Optional[str] = None
    is_ativo: bool


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


class ItemEstoqueUpdate(BaseModel):
    produto_id: int
    quantidade_adicionar: int = Field(..., gt=0, description="A quantidade a ser adicionada deve ser maior que zero")


class LoteEstoqueUpdate(BaseModel):
    itens: List[ItemEstoqueUpdate]


class ServicoModel(BaseModel):
    nome: str
    descricao: Optional[str] = None
    duracao: int = Field(..., gt=0, description="Duração padrão em minutos")
    preco: float = Field(..., gt=0, description="Preço do serviço em reais")
    criador_id: Optional[int] = None


class VendaModel(BaseModel):
    id: int
    funcionario_id: Optional[int] = None
    cliente_id: Optional[int] = None
    total: float
    forma_pagamento: str
    status_pagamento: str
    criado_em: datetime
    funcionario_nome: Optional[str] = None
    cliente_nome: Optional[str] = None


class InfoAgendamento(BaseModel):
    pet_id: int
    data_hora: str
    observacoes: Optional[str] = None

    def model_dump_json(self) -> str:
        """Serializa para JSON string"""
        return json.dumps({
            "pet_id": self.pet_id,
            "data_hora": self.data_hora,
            "observacoes": self.observacoes
        })


class CriarItemVenda(BaseModel):
    tipo: str
    id_item: int
    nome: str
    quantidade: int
    preco_unitario: float
    info_agendamento: Optional[InfoAgendamento] = None


class CriarVenda(BaseModel):
    cliente_id: Optional[int] = None
    forma_pagamento: str
    itens: List[CriarItemVenda]


class AtualizarStatusVenda(BaseModel):
    status: str  # "Pago" ou "Cancelado"


class AgendamentoBase(BaseModel):
    cliente_id: int
    pet_id: int
    servico_id: int
    data_hora_inicio: datetime
    observacoes: Optional[str] = None
    funcionario_id: Optional[int] = Field(None, description="ID opcional do funcionário preferido/especialista")


class AgendamentoCreate(AgendamentoBase):
    pass


class Agendamento(AgendamentoBase):
    id: int
    data_hora_fim: datetime
    funcionario_id: Optional[int] = None
    status: str
    criado_em: datetime

    class Config:
        from_attributes = True


class HorarioDisponivel(BaseModel):
    inicio: datetime
    fim: datetime


class DisponibilidadeResponse(BaseModel):
    data: date
    horarios: list[HorarioDisponivel]


class VacinaBase(BaseModel):
    nome_vacina: str
    data_aplicacao: date
    data_proxima_dose: Optional[date] = None
    pet_id: int
    funcionario_id: Optional[int] = None


class VacinaCreate(VacinaBase):
    pass


class VacinaResponse(VacinaBase):
    id: int
    funcionario_nome: Optional[str] = None

    class Config:
        from_attributes = True


class HistoricoMedico(BaseModel):
    pet_id: int
    tipo_servico: str
    data_hora: datetime
    resumo: str
    detalhes: Optional[str] = None
    funcionario_id: Optional[int] = None
    valor: Optional[float] = None

class HistoricoMedicoResponse(HistoricoMedico):
    id: int
    funcionario_nome: Optional[str] = None

    class Config:
        from_attributes = True

class ObservacaoBase(BaseModel):
    pet_id: int
    titulo: Optional[str] = "Observação"
    descricao: str
    funcionario_id: Optional[int] = None

class ObservacaoCreate(ObservacaoBase):
    pass

class ObservacaoResponse(ObservacaoBase):
    id: int
    data_criacao: datetime
    funcionario_nome: Optional[str] = None

    class Config:
        from_attributes = True

class AgendamentoReagendar(BaseModel):
    nova_data_hora_inicio: datetime

class NotificacaoModel(BaseModel):
    id: int
    mensagem: str
    lida: bool
    criado_em: datetime
    tipo: str