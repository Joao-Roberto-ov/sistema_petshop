from pydantic import BaseModel
from datetime import date

class DespesaModel(BaseModel):
    id: int | None = None
    descricao: str
    valor: float
    data: date
