from fastapi import APIRouter, HTTPException
from modelos import CriarVenda
from services.venda_service import ServicosVenda

router = APIRouter(prefix="/api/vendas", tags=["Vendas"])
servico = ServicosVenda()


# 🔹 Criar uma nova venda
@router.post("/", response_model=dict, summary="Registrar uma nova venda")
def registrar_venda(dados_venda: CriarVenda):
    """
    Registra uma nova venda com os itens, cliente, funcionário e forma de pagamento.
    """
    return servico.registrar_venda(dados_venda)


# 🔹 Buscar venda por ID
@router.get("/{venda_id}", response_model=dict, summary="Buscar venda por ID")
def buscar_venda(venda_id: int):
    """
    Retorna os detalhes de uma venda específica pelo ID.
    """
    venda = servico.buscar_venda_por_id(venda_id)
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada.")
    return venda


# 🔹 Listar todas as vendas
@router.get("/", response_model=list, summary="Listar todas as vendas")
def listar_vendas():
    """
    Retorna uma lista com todas as vendas registradas.
    """
    return servico.listar_vendas()


# 🔹 Atualizar uma venda
@router.put("/{venda_id}", response_model=dict, summary="Atualizar venda existente")
def atualizar_venda(venda_id: int, forma_pagamento: str = None, total: float = None):
    """
    Atualiza os dados de uma venda (forma de pagamento ou total).
    """
    return servico.atualizar_venda(venda_id, forma_pagamento, total)


# 🔹 Excluir uma venda
@router.delete("/{venda_id}", response_model=dict, summary="Excluir venda")
def deletar_venda(venda_id: int):
    """
    Remove uma venda e todos os itens vinculados.
    """
    return servico.deletar_venda(venda_id)