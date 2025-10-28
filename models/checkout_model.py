from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class EnderecoEntrega(BaseModel):
    rua: str
    numero: str
    bairro: str
    cidade: str
    estado: str
    cep: str

class CheckoutRequest(BaseModel):
    cliente_id: int
    forma_pagamento: str = Field(..., description="cartao ou pix")
    endereco_entrega: Optional[EnderecoEntrega] = None
    retirada_na_loja: bool = False
    itens: List[dict]  # mesmo formato de CriarItemVenda

class CheckoutResponse(BaseModel):
    id_venda: int
    status_pagamento: str
    total: float
    criado_em: datetime
    mensagem: str
