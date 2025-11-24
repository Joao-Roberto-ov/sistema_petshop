from pydantic import BaseModel

class EstoqueMinimoConfig(BaseModel):
    produto_id: int
    estoque_minimo: int
