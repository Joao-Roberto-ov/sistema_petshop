from fastapi import APIRouter, Depends
from modelos import CriarVenda, AtualizarStatusVenda
from services.venda_service import ServicosVenda
from seguranca import pegar_id_do_usuario_logado
from typing import Optional
from datetime import date

router = APIRouter(prefix="/api/vendas", tags=["Vendas"])
servico = ServicosVenda()


@router.post("/", response_model=dict, summary="Registrar uma nova venda (Pendente)")
def registrar_venda(
    dados_venda: CriarVenda,
    # Pega o ID do funcionário/atendente logado
    funcionario_id: int = Depends(pegar_id_do_usuario_logado)
):
    """
    Registra uma nova venda. (Req 1) O status será sempre 'Pendente'
    (Req 2) Se houver serviços, 'info_agendamento' deve ser enviado nos itens.
    (Req 3) A baixa de estoque/criação de agendamento SÓ ocorre ao mudar status para 'Pago'.
    """
    return servico.registrar_venda(dados_venda, funcionario_id)


@router.put("/{venda_id}/status", response_model=dict, summary="Atualizar status de uma venda Pendente")
def atualizar_status_venda(
    venda_id: int,
    dados: AtualizarStatusVenda,
):
    """
    (Req 6) Atualiza o status de uma venda de 'Pendente' para 'Pago' ou 'Cancelado'.
    (Req 3) Se mudar para 'Pago', o backend processa o estoque e cria os agendamentos.
    (Req 6) Não permite reverter de 'Pago' ou 'Cancelado' para 'Pendente'.
    """
    return servico.atualizar_status(venda_id, dados.status)


@router.get("/{venda_id}", response_model=dict, summary="Buscar venda por ID")
def buscar_venda(
    venda_id: int,
):
    """
    Retorna os detalhes de uma venda específica pelo ID.
    """
    return servico.buscar_venda_por_id(venda_id)


@router.get("/", response_model=list, summary="Listar todas as vendas (com filtros)")
def listar_vendas(
    status: Optional[str] = None,
    funcionario_id: Optional[int] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
):
    """
    (Req 5) Retorna uma lista com todas as vendas,
    permitindo filtro por status, funcionário e período.
    """
    return servico.listar_vendas_filtradas(
        filtro_status=status,
        filtro_funcionario=funcionario_id,
        filtro_data_inicio=data_inicio,
        filtro_data_fim=data_fim
    )