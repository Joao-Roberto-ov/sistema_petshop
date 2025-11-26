from fastapi import APIRouter, Depends, HTTPException  
from modelos import CriarVenda, AtualizarStatusVenda
from services.venda_service import ServicosVenda
from fastapi.responses import StreamingResponse  
from seguranca import pegar_id_do_usuario_logado
from typing import Optional
from datetime import date
import io

router = APIRouter(prefix="/api/vendas", tags=["Vendas"])
servico = ServicosVenda()

import sqlite3

def conectar():
    """
    Placeholder synchronous SQLite in-memory connection for local debugging.
    Replace with your actual database connection function that returns a DB connection object.
    """
    conn = sqlite3.connect(":memory:", detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row
    return conn

def encerra_conexao(conn):
    """
    Close the provided DB connection, ignoring errors.
    """
    try:
        conn.close()
    except Exception:
        pass


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


@router.get("/relatorio/servicos-mais-solicitados", response_model=list, summary="Relatório de Serviços Mais Solicitados (Gestor)")
def relatorio_servicos_mais_solicitados(
    data_inicio: date,
    data_fim: date,
    filtro_status: Optional[str] = None, 
    # Apenas gestores/admins podem acessar este relatório
    usuario_id: int = Depends(pegar_id_do_usuario_logado)
):
    """
    Gera um relatório dos serviços mais solicitados em um período.
    AC1: O relatório deve listar os serviços realizados em um período selecionado.
    AC3: O relatório deve exibir informações essenciais de cada serviço: nome do serviço, quantidade de execuções e receita gerada.
    """
    return servico.obter_relatorio_servicos_mais_solicitados(data_inicio, data_fim, filtro_status)

@router.get("/relatorio/servicos-mais-solicitados/csv", summary="Exportar Relatório de Serviços Mais Solicitados para CSV")
def exportar_relatorio_servicos_csv(
    data_inicio: date,
    data_fim: date,
    filtro_status: Optional[str] = None,  
    usuario_id: int = Depends(pegar_id_do_usuario_logado)
):
    """
    AC4: Exporta o relatório de serviços mais solicitados para o formato CSV.
    """
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

@router.get("/relatorio/servicos-mais-solicitados/pdf", summary="Exportar Relatório de Serviços Mais Solicitados para PDF")
def exportar_relatorio_servicos_pdf(
    data_inicio: date,
    data_fim: date,
    filtro_status: Optional[str] = None, 
    usuario_id: int = Depends(pegar_id_do_usuario_logado)
):
    """
    AC4: Exporta o relatório de serviços mais solicitados para o formato PDF.
    """
    try:
        pdf_data = servico.gerar_pdf_relatorio_servicos(data_inicio, data_fim, filtro_status)

        # Configuração da resposta para download de arquivo PDF
        response = StreamingResponse(
            iter([pdf_data]),
            media_type="application/pdf"
        )
        response.headers["Content-Disposition"] = f"attachment; filename=relatorio_servicos_{data_inicio}_{data_fim}_{filtro_status or 'todos'}.pdf"
        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")


@router.get("/relatorio/produtos-mais-vendidos", response_model=list, summary="Relatório de Produtos Mais Vendidos (Gestor)")
def relatorio_produtos_mais_vendidos(
    data_inicio: date,
    data_fim: date,
    # Apenas gestores/admins podem acessar este relatório
    usuario_id: int = Depends(pegar_id_do_usuario_logado) 
):
    """
    Gera um relatório dos produtos mais vendidos em um período.
    AC1: O relatório deve listar os produtos vendidos em um período selecionado.
    AC2: O relatório deve mostrar informações essenciais de cada produto: nome, categoria, quantidade vendida e receita gerada.
    """
    return servico.obter_relatorio_produtos_mais_vendidos(data_inicio, data_fim)


@router.get("/relatorio/produtos-mais-vendidos/csv", summary="Exportar Relatório de Produtos Mais Vendidos para CSV")
def exportar_relatorio_produtos_csv(
    data_inicio: date,
    data_fim: date,
    usuario_id: int = Depends(pegar_id_do_usuario_logado)
):
    """
    Exporta o relatório de produtos mais vendidos para o formato CSV.
    """
    try:
        csv_content = servico.gerar_csv_relatorio_produtos(data_inicio, data_fim)
        
        # Configuração da resposta para download de arquivo CSV
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
    """
    Exporta o relatório de produtos mais vendidos para o formato PDF.
    """
    try:
        pdf_data = servico.gerar_pdf_relatorio_produtos(data_inicio, data_fim)
        
        # Configuração da resposta para download de arquivo PDF
        response = StreamingResponse(
            iter([pdf_data]),
            media_type="application/pdf"
        )
        response.headers["Content-Disposition"] = f"attachment; filename=relatorio_produtos_{data_inicio}_{data_fim}.pdf"
        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")


@router.get("/debug/vendas-periodo", summary="Debug - Ver vendas do período")
def debug_vendas_periodo(
    data_inicio: date,
    data_fim: date
):
    """
    Rota de debug para verificar vendas no período.
    """
    conn = conectar()
    try:
        cursor = conn.cursor()
        
        # Ver todas as vendas do período
        cursor.execute("""
            SELECT 
                v.id, 
                v.criado_em, 
                v.status_pagamento, 
                v.total,
                c.nome as cliente_nome,
                COUNT(iv.id) as total_itens
            FROM Vendas v
            LEFT JOIN Clientes c ON v.cliente_id = c.id
            LEFT JOIN ItensVenda iv ON v.id = iv.venda_id
            WHERE DATE(v.criado_em) BETWEEN %s AND %s
            GROUP BY v.id, v.criado_em, v.status_pagamento, v.total, c.nome
            ORDER BY v.criado_em DESC
        """, (data_inicio, data_fim))
        
        vendas = cursor.fetchall()
        
        resultado = []
        for venda in vendas:
            # Buscar itens desta venda
            cursor.execute("""
                SELECT tipo, nome, quantidade, preco_unitario 
                FROM ItensVenda 
                WHERE venda_id = %s
            """, (venda[0],))
            
            itens = cursor.fetchall()
            
            resultado.append({
                "id": venda[0],
                "criado_em": venda[1],
                "status_pagamento": venda[2],
                "total": venda[3],
                "cliente_nome": venda[4],
                "total_itens": venda[5],
                "itens": [
                    {
                        "tipo": item[0],
                        "nome": item[1],
                        "quantidade": item[2],
                        "preco_unitario": item[3]
                    } for item in itens
                ]
            })
        
        return {
            "periodo": f"{data_inicio} a {data_fim}",
            "total_vendas": len(vendas),
            "vendas": resultado
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no debug: {e}")
    finally:
        if conn: encerra_conexao(conn)


@router.get("/teste-simples", summary="Teste simples do relatório")
def teste_simples_relatorio():
    """
    Rota de teste simples para verificar se o relatório funciona.
    """
    try:
        from datetime import date
        data_inicio = date(2025, 10, 31)
        data_fim = date(2025, 11, 29)
        
        resultado = servico.obter_relatorio_produtos_mais_vendidos(data_inicio, data_fim)
        return {
            "mensagem": "Teste realizado com sucesso",
            "total_produtos": len(resultado),
            "produtos": resultado
        }
    except Exception as e:
        return {
            "erro": str(e),
            "traceback": "Verifique os logs do servidor"
        }
@router.get("/debug/status-vendas", summary="Debug - Ver status das vendas por data")
def debug_status_vendas(
    data_inicio: date,
    data_fim: date
):
    """
    Rota de debug para verificar o status das vendas em um período.
    """
    try:
        resultado = servico.repo.verificar_status_vendas_por_data(data_inicio, data_fim)
        return {
            "periodo": f"{data_inicio} a {data_fim}",
            "total_vendas": len(resultado),
            "vendas": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no debug: {e}")
    
@router.get("/debug/vendas-hoje", summary="Debug - Ver vendas de hoje")
def debug_vendas_hoje():
    """
    Rota de debug para verificar vendas do dia atual.
    """
    from datetime import datetime, date
    
    hoje = date.today()
    print(f"🔍 [DEBUG HOJE] Buscando vendas do dia: {hoje}")
    
    conn = conectar()
    try:
        cursor = conn.cursor()
        
        # Ver todas as vendas de hoje
        cursor.execute("""
            SELECT 
                v.id, 
                v.criado_em, 
                v.status_pagamento, 
                v.total,
                c.nome as cliente_nome,
                COUNT(iv.id) as total_itens
            FROM Vendas v
            LEFT JOIN Clientes c ON v.cliente_id = c.id
            LEFT JOIN ItensVenda iv ON v.id = iv.venda_id
            WHERE DATE(v.criado_em) = %s
            GROUP BY v.id, v.criado_em, v.status_pagamento, v.total, c.nome
            ORDER BY v.criado_em DESC
        """, (hoje,))
        
        vendas = cursor.fetchall()
        
        resultado = []
        for venda in vendas:
            cursor.execute("""
                SELECT tipo, nome, quantidade, preco_unitario 
                FROM ItensVenda 
                WHERE venda_id = %s
            """, (venda[0],))
            
            itens = cursor.fetchall()
            
            resultado.append({
                "id": venda[0],
                "criado_em": venda[1],
                "status_pagamento": venda[2],
                "total": venda[3],
                "cliente_nome": venda[4],
                "total_itens": venda[5],
                "itens": [
                    {
                        "tipo": item[0],
                        "nome": item[1],
                        "quantidade": item[2],
                        "preco_unitario": item[3]
                    } for item in itens
                ]
            })
        
        print(f"🔍 [DEBUG HOJE] Vendas encontradas hoje: {len(vendas)}")
        for venda in vendas:
            print(f"   📦 Venda {venda[0]}: {venda[1]} - Status: {venda[2]} - Total: R$ {venda[3]:.2f}")
        
        return {
            "data_hoje": str(hoje),
            "total_vendas": len(vendas),
            "vendas": resultado
        }
        
    except Exception as e:
        print(f"❌ [DEBUG HOJE] Erro: {e}")
        raise HTTPException(status_code=500, detail=f"Erro no debug: {e}")
    finally:
        if conn: encerra_conexao(conn)