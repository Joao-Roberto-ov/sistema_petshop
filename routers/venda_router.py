from fastapi import APIRouter
from modelos import CriarVenda
from services.venda_service import ServicosVenda

router = APIRouter(prefix="/vendas", tags=["Vendas"])
servico = ServicosVenda()

@router.post("/", response_model=dict)
def registrar_venda(dados_venda: CriarVenda):
    return servico.registrar_venda(dados_venda)
