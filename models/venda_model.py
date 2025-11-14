from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class VendaModel(BaseModel):
    id: int
    funcionario_id: int | None = None
    cliente_id: int | None = None
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

class CriarItemVenda(BaseModel):
    tipo: str # 'produto' ou 'servico'
    id_item: int
    nome: str
    quantidade: int
    preco_unitario: float
    info_agendamento: Optional[InfoAgendamento] = None

class CriarVenda(BaseModel):
    cliente_id: int
    forma_pagamento: str
    itens: List[CriarItemVenda]

class AtualizarStatusVenda(BaseModel):
    status: str # Deve ser "Pago" ou "Cancelado"