from pydantic import BaseModel
from datetime import datetime
from typing import List

class VendaModel(BaseModel):
    id: int
    funcionario_id: int | None = None
    cliente_id: int | None = None
    total: float
    forma_pagamento: str
    status_pagamento: str
    criado_em: datetime

class CriarItemVenda(BaseModel):
    tipo: str
    id_item: int
    nome: str
    quantidade: int
    preco_unitario: float

class CriarVenda(BaseModel):
    cliente_id: int
    forma_pagamento: str
    status_pagamento: str = "pendente"
    itens: List[CriarItemVenda]