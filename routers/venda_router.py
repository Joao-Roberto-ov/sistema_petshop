from fastapi import APIRouter, Depends, HTTPException
from modelos import CriarVenda, AtualizarStatusVenda
from services.venda_service import ServicosVenda
from fastapi.responses import StreamingResponse
from seguranca import pegar_id_do_usuario_logado
from typing import Optional
from datetime import date
import io
from fastapi.responses import StreamingResponse
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime

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
        cliente_id: Optional[int] = None,
):
    """
    (Req 5) Retorna uma lista com todas as vendas,
    permitindo filtro por status, funcionário e período.
    """
    return servico.listar_vendas_filtradas(
        filtro_status=status,
        filtro_funcionario=funcionario_id,
        filtro_data_inicio=data_inicio,
        filtro_data_fim=data_fim,
        filtro_cliente_id=cliente_id
    )


@router.get("/relatorio/servicos-mais-solicitados", response_model=list,
            summary="Relatório de Serviços Mais Solicitados (Gestor)")
def relatorio_servicos_mais_solicitados(
        data_inicio: date,
        data_fim: date,
        filtro_status: Optional[str] = None,
        usuario_id: int = Depends(pegar_id_do_usuario_logado)
):
    return servico.obter_relatorio_servicos_mais_solicitados(data_inicio, data_fim, filtro_status)


@router.get("/relatorio/servicos-mais-solicitados/csv",
            summary="Exportar Relatório de Serviços Mais Solicitados para CSV")
def exportar_relatorio_servicos_csv(
        data_inicio: date,
        data_fim: date,
        filtro_status: Optional[str] = None,
        usuario_id: int = Depends(pegar_id_do_usuario_logado)
):
    try:
        csv_content = servico.gerar_csv_relatorio_servicos(data_inicio, data_fim, filtro_status)

        # Configuração da resposta para download de arquivo CSV
        response = StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=relatorio_servicos_{data_inicio}_{data_fim}_{filtro_status or 'todos'}.csv"
            }
        )
        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar CSV: {str(e)}")


@router.get("/relatorio/servicos-mais-solicitados/pdf",
            summary="Exportar Relatório de Serviços Mais Solicitados para PDF")
def exportar_relatorio_servicos_pdf(
        data_inicio: date,
        data_fim: date,
        filtro_status: Optional[str] = None,
        usuario_id: int = Depends(pegar_id_do_usuario_logado)
):
    try:
        pdf_data = servico.gerar_pdf_relatorio_servicos(data_inicio, data_fim, filtro_status)

        response = StreamingResponse(
            iter([pdf_data]),
            media_type="application/pdf"
        )
        response.headers[
            "Content-Disposition"] = f"attachment; filename=relatorio_servicos_{data_inicio}_{data_fim}_{filtro_status or 'todos'}.pdf"
        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")


@router.get("/relatorio/produtos-mais-vendidos", response_model=list,
            summary="Relatório de Produtos Mais Vendidos (Gestor)")
def relatorio_produtos_mais_vendidos(
        data_inicio: date,
        data_fim: date,
        usuario_id: int = Depends(pegar_id_do_usuario_logado)
):
    return servico.obter_relatorio_produtos_mais_vendidos(data_inicio, data_fim)


@router.get("/relatorio/produtos-mais-vendidos/csv", summary="Exportar Relatório de Produtos Mais Vendidos para CSV")
def exportar_relatorio_produtos_csv(
        data_inicio: date,
        data_fim: date,
        usuario_id: int = Depends(pegar_id_do_usuario_logado)
):
    try:
        csv_content = servico.gerar_csv_relatorio_produtos(data_inicio, data_fim)

        response = StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=relatorio_produtos_{data_inicio}_{data_fim}.csv"
            }
        )
        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar CSV: {str(e)}")


@router.get("/relatorio/produtos-mais-vendidos/pdf", summary="Exportar Relatório de Produtos Mais Vendidos para PDF")
def exportar_relatorio_produtos_pdf(
        data_inicio: date,
        data_fim: date,
        usuario_id: int = Depends(pegar_id_do_usuario_logado)
):
    try:
        pdf_data = servico.gerar_pdf_relatorio_produtos(data_inicio, data_fim)

        response = StreamingResponse(
            iter([pdf_data]),
            media_type="application/pdf"
        )
        response.headers[
            "Content-Disposition"] = f"attachment; filename=relatorio_produtos_{data_inicio}_{data_fim}.pdf"
        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")


@router.get("/{venda_id}/recibo", summary="Gerar recibo em PDF de uma venda")
def gerar_recibo_pdf(venda_id: int):
    venda = servico.buscar_venda_por_id(venda_id)
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada.")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elementos = []

    titulo = Paragraph("<b>RECIBO DE PAGAMENTO</b>", styles["Title"])
    elementos.append(titulo)

    info_cliente = f"""
    <b>Cliente:</b> {venda['cliente_nome']}<br/>
    <b>Venda ID:</b> {venda['id']}<br/>
    <b>Data:</b> {venda['criado_em']}<br/>
    <b>Status:</b> {venda['status_pagamento']}<br/>
    """
    elementos.append(Paragraph(info_cliente, styles["Normal"]))

    elementos.append(Paragraph("<br/><b>Itens da Venda:</b>", styles["Heading3"]))

    tabela_data = [["Item", "Qtd", "Preço Unit.", "Subtotal"]]

    total = 0
    for item in venda["itens"]:
        nome = item["nome"]
        qtd = item["quantidade"]
        preco = float(item["preco_unitario"])
        subtotal = qtd * preco
        total += subtotal

        tabela_data.append([
            nome,
            qtd,
            f"R$ {preco:.2f}",
            f"R$ {subtotal:.2f}"
        ])

    tabela = Table(tabela_data, colWidths=[220, 50, 100, 100])
    tabela.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ("FONT", (0, 0), (-1, -1), "Helvetica", 10),
        ("ALIGN", (1, 1), (-1, -1), "CENTER"),
    ]))

    elementos.append(tabela)
    elementos.append(Paragraph("<br/>", styles["Normal"]))

    elementos.append(
        Paragraph(f"<b>Total Pago: R$ {total:.2f}</b>", styles["Heading2"])
    )

    elementos.append(
        Paragraph(f"<b>Forma de Pagamento:</b> {venda.get('forma_pagamento', 'Não informado')}",
                  styles["Normal"])
    )

    doc.build(elementos)

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=recibo_venda_{venda_id}.pdf"})

@router.post("/{venda_id}/recibo/enviar-email", summary="Enviar recibo da venda por e-mail")
def enviar_recibo_por_email(venda_id: int):
    try:
        resultado = servico.enviar_recibo_por_email(venda_id)

        if resultado.get("sucesso"):
            return {"mensagem": f"Recibo da venda {venda_id} enviado com sucesso para o cliente.",
                    "email_enviado": resultado.get("email_cliente")}

        raise HTTPException(status_code=400, detail=resultado.get("erro", "Não foi possível enviar o e-mail."))

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao tentar enviar o e-mail: {str(e)}")