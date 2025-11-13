from fastapi import APIRouter, HTTPException, Query
from modelos import CriarVenda
from services.venda_service import ServicosVenda
from datetime import date

router = APIRouter(prefix="/api/vendas", tags=["Vendas"])
servico = ServicosVenda()


@router.post("/", response_model=dict, summary="Registrar uma nova venda")
def registrar_venda(dados_venda: CriarVenda):
    """
    Registra uma nova venda com os itens, cliente, funcionário e forma de pagamento.
    """
    return servico.registrar_venda(dados_venda)


@router.get("/{venda_id}", response_model=dict, summary="Buscar venda por ID")
def buscar_venda(venda_id: int):
    """
    Retorna os detalhes de uma venda específica pelo ID.
    """
    venda = servico.buscar_venda_por_id(venda_id)
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada.")
    return venda


@router.get("/", response_model=list, summary="Listar todas as vendas")
def listar_vendas():
    """
    Retorna uma lista com todas as vendas registradas.
    """
    return servico.listar_vendas()


@router.put("/{venda_id}", response_model=dict, summary="Atualizar venda existente")
def atualizar_venda(venda_id: int, forma_pagamento: str = None, total: float = None):
    """
    Atualiza os dados de uma venda (forma de pagamento ou total).
    """
    return servico.atualizar_venda(venda_id, forma_pagamento, total)


@router.delete("/{venda_id}", response_model=dict, summary="Excluir venda")
def deletar_venda(venda_id: int):
    """
    Remove uma venda e todos os itens vinculados.
    """
    return servico.deletar_venda(venda_id)

@router.get("", status_code=200)
def listar_vendas_periodo(
    data_inicio: date | None = Query(None),
    data_fim: date | None = Query(None)
):
    """
    Lista todas as vendas, ou filtra por período (data_inicio e data_fim)
    """
    if data_inicio and data_fim:
        return servico.listar_por_periodo(data_inicio, data_fim)
    return servico.listar_vendas()