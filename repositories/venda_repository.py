from bancoDeDados import conectar, encerra_conexao
from datetime import date
import json


class RepositorioVenda:

    def registrar_venda(self, funcionario_id, dados_venda, total):
        conn = conectar()
        try:
            cursor = conn.cursor()

            # 1. Insere a Venda
            cursor.execute("""
                INSERT INTO Vendas (funcionario_id, cliente_id, total, forma_pagamento, status_pagamento)
                VALUES (%s, %s, %s, %s, 'Pendente')
                RETURNING id, criado_em;
            """, (
                funcionario_id,
                dados_venda.cliente_id,
                total,
                dados_venda.forma_pagamento
            ))
            venda_id, criado_em = cursor.fetchone()

            # 2. Insere os Itens
            for item in dados_venda.itens:
                info_json = None
                if item.info_agendamento:
                    info_json = item.info_agendamento.model_dump_json()

                cursor.execute("""
                    INSERT INTO ItensVenda 
                    (venda_id, tipo, id_item, nome, quantidade, preco_unitario, info_agendamento)
                    VALUES (%s, %s, %s, %s, %s, %s, %s);
                """, (
                    venda_id,
                    item.tipo,
                    item.id_item,
                    item.nome,
                    item.quantidade,
                    item.preco_unitario,
                    info_json
                ))

            conn.commit()

            return {
                "id_venda": venda_id,
                "total": total,
                "criado_em": criado_em,
                "status": "Pendente"
            }

        except Exception as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                encerra_conexao(conn)

    def get_venda_by_id(self, venda_id):
        conn = conectar()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    v.id, v.funcionario_id, v.cliente_id, v.total,
                    v.forma_pagamento, v.status_pagamento, v.criado_em,
                    c.nome AS cliente_nome,
                    f.nome AS funcionario_nome
                FROM Vendas v
                LEFT JOIN Clientes c ON v.cliente_id = c.id
                LEFT JOIN Funcionarios f ON v.funcionario_id = f.id
                WHERE v.id = %s;
            """, (venda_id,))
            venda = cursor.fetchone()

            if not venda:
                return None

            cursor.execute("""
                SELECT id, tipo, id_item, nome, quantidade, preco_unitario, info_agendamento
                FROM ItensVenda
                WHERE venda_id = %s;
            """, (venda_id,))
            itens = cursor.fetchall()

            return {
                "id": venda[0], "funcionario_id": venda[1], "cliente_id": venda[2],
                "total": venda[3], "forma_pagamento": venda[4], "status_pagamento": venda[5],
                "criado_em": venda[6], "cliente_nome": venda[7], "funcionario_nome": venda[8],
                "itens": [
                    {
                        "id": i[0], "tipo": i[1], "id_item": i[2], "nome": i[3],
                        "quantidade": i[4], "preco_unitario": i[5],
                        "info_agendamento": i[6]
                    }
                    for i in itens
                ]
            }
        finally:
            if conn:
                encerra_conexao(conn)

    def buscar_itens_da_venda(self, venda_id):
        conn = conectar()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT tipo, id_item, quantidade, info_agendamento, nome
                FROM ItensVenda
                WHERE venda_id = %s
            """, (venda_id,))
            return cursor.fetchall()
        finally:
            if conn:
                encerra_conexao(conn)

    def atualizar_status_e_processar(self, venda_id, novo_status, itens_venda, cliente_id, funcionario_id):
        conn = conectar()
        try:
            cursor = conn.cursor()

            cursor.execute("UPDATE Vendas SET status_pagamento = %s WHERE id = %s",
                           (novo_status, venda_id))

            if novo_status == "Pago":
                for tipo, id_item, qtd, info_json, nome_item in itens_venda:

                    # PRODUTOS
                    if tipo == "produto":
                        cursor.execute("""
                            UPDATE produtos_cadastrados 
                            SET estoque = estoque - %s 
                            WHERE id = %s 
                            RETURNING estoque
                        """, (qtd, id_item))
                        res = cursor.fetchone()
                        if not res or res[0] < 0:
                            conn.rollback()
                            raise Exception(f"Estoque insuficiente para '{nome_item}' (ID {id_item}).")

                    # SERVIÇOS
                    if tipo == "servico" and info_json:
                        info = json.loads(info_json)
                        pet_id = info.get("pet_id")
                        servico_id = id_item
                        data_hora_inicio = info.get('data_hora')
                        data_hora_inicio = info['data_hora']

                        cursor.execute("SELECT duracao FROM catalogo_servicos WHERE id = %s", (id_item,))
                        duracao_res = cursor.fetchone()
                        duracao = duracao_res[0] if duracao_res else 60

                        # Loop para criar um agendamento para cada quantidade do serviço
                        for _ in range(qtd):
                            cursor.execute("""
                                INSERT INTO Agendamentos (
                                    cliente_id, pet_id, servico_id, funcionario_id,
                                    data_hora_inicio, data_hora_fim, status, observacoes
                                )
                                VALUES (
                                    %s, %s, %s, %s, 
                                    %s::timestamp,
                                    %s::timestamp + make_interval(mins => %s),
                                    'Agendado',
                                    %s
                                )
                            """, (
                                cliente_id,
                                pet_id,
                                servico_id,
                                funcionario_id,
                                data_hora_inicio,
                                data_hora_inicio,
                                duracao,
                                info.get("observacoes", "Agendado via Venda Balcão")
                            ))

            conn.commit()
            return True

        except Exception as e:
            if conn:
                conn.rollback()
            raise e

        finally:
            if conn:
                encerra_conexao(conn)

    def verificar_status_vendas_por_data(self, data_inicio: date, data_fim: date):
        conn = conectar()
        try:
            cursor = conn.cursor()

            query = """
                SELECT 
                    id, criado_em, status_pagamento, total, cliente_id, funcionario_id
                FROM Vendas
                WHERE DATE(criado_em) BETWEEN %s AND %s
                ORDER BY criado_em DESC
            """
            cursor.execute(query, (data_inicio, data_fim))
            vendas = cursor.fetchall()

            print(f"🔍 [DEBUG STATUS] Vendas: {len(vendas)}")

            return [
                {
                    "id": v[0],
                    "criado_em": v[1],
                    "status_pagamento": v[2],
                    "total": v[3],
                    "cliente_id": v[4],
                    "funcionario_id": v[5]
                }
                for v in vendas
            ]

        finally:
            if conn:
                encerra_conexao(conn)

    def get_relatorio_produtos_mais_vendidos(self, data_inicio: date, data_fim: date, filtro_status: str = None):
        conn = conectar()
        try:
            cursor = conn.cursor()

            query = """
                SELECT 
                    p.nome AS nome_produto,
                    p.categoria,
                    SUM(iv.quantidade) AS quantidade_vendida,
                    SUM(iv.quantidade * iv.preco_unitario) AS receita_gerada,
                    COUNT(DISTINCT v.id) AS total_pedidos,
                    STRING_AGG(DISTINCT v.status_pagamento, ', ') AS status_pagamentos
                FROM ItensVenda iv
                JOIN Vendas v ON iv.venda_id = v.id
                JOIN produtos_cadastrados p ON iv.id_item = p.id
                WHERE iv.tipo = 'produto'
                AND v.criado_em::date BETWEEN %s AND %s
            """

            params = [data_inicio, data_fim]

            # Filtro opcional por status
            if filtro_status and filtro_status.lower() != 'todos':
                if filtro_status.lower() == 'pago':
                    query += " AND v.status_pagamento = 'Pago'"
                elif filtro_status.lower() == 'pendente':
                    query += " AND v.status_pagamento = 'Pendente'"

            query += " GROUP BY p.nome, p.categoria ORDER BY quantidade_vendida DESC"

            cursor.execute(query, tuple(params))
            resultado = cursor.fetchall()

            print(f"✅ [REPO] Relatório produtos - Período: {data_inicio} a {data_fim}")
            print(f"✅ [REPO] Filtro: {filtro_status or 'Todos'}, Total produtos: {len(resultado)}")

            # Log detalhado
            total_pedidos = sum([r[4] for r in resultado])
            print(f"✅ [REPO] Total de pedidos no período: {total_pedidos}")

            for i, r in enumerate(resultado[:10]):
                print(f"   {i+1}. 📦 {r[0]} - Qtd: {r[2]} - Pedidos: {r[4]}")

            return [
                {
                    "nome_produto": r[0],
                    "categoria": r[1],
                    "quantidade_vendida": r[2],
                    "receita_gerada": float(r[3]) if r[3] else 0.0,
                    "total_pedidos": r[4],
                    "status_pagamentos": r[5]
                }
                for r in resultado
            ]

        except Exception as e:
            print(f"❌ [REPO] Erro ao gerar relatório de produtos: {str(e)}")
            return []
        finally:
            if conn:
                encerra_conexao(conn)
            
    def get_relatorio_servicos_mais_solicitados(self, data_inicio: date, data_fim: date, filtro_status: str = None):
        conn = conectar()
        try:
            cursor = conn.cursor()

            # Query para serviços agendados (diferentes status)
            query = """
                SELECT
                    s.nome AS nome_servico,
                    COUNT(*) AS quantidade_execucoes,
                    SUM(s.preco) AS receita_gerada,
                    a.status
                FROM Agendamentos a
                JOIN catalogo_servicos s ON a.servico_id = s.id
                WHERE a.data_hora_inicio::date BETWEEN %s AND %s
            """

            params = [data_inicio, data_fim]

            # Aplicar filtro de status se especificado
            if filtro_status and filtro_status.lower() != 'todos':
                if filtro_status.lower() == 'agendados':
                    query += " AND a.status = 'Agendado'"
                elif filtro_status.lower() == 'com ausencia' or filtro_status.lower() == 'c/ ausência':
                    query += " AND a.status = 'C/ Ausência'"
                elif filtro_status.lower() == 'cancelados':
                    query += " AND a.status = 'Cancelado'"
                else:
                    # Se for um status específico, usa diretamente
                    query += " AND a.status = %s"
                    params.append(filtro_status)

            query += " GROUP BY s.nome, a.status ORDER BY quantidade_execucoes DESC"

            cursor.execute(query, tuple(params))
            resultado = cursor.fetchall()

            print(f"🔍 [REPO] Relatório serviços - Status: {filtro_status}, Resultados: {len(resultado)}")

            return [
                {
                    "nome_servico": r[0],
                    "quantidade_execucoes": r[1],
                    "receita_gerada": float(r[2]) if r[2] else 0.0,
                    "status": r[3]
                }
                for r in resultado
            ]

        finally:
            if conn:
                encerra_conexao(conn)

    def get_all_vendas(self, filtro_status=None, filtro_funcionario=None,
                    filtro_data_inicio=None, filtro_data_fim=None, filtro_cliente_id=None):

        conn = conectar()
        try:
            cursor = conn.cursor()

            query = """
                SELECT 
                    v.id,
                    v.total,
                    v.forma_pagamento,
                    v.status_pagamento,
                    v.criado_em,
                    c.id,
                    c.nome,
                    f.id,
                    f.nome,
                    COALESCE(
                        STRING_AGG(CONCAT(iv.quantidade, 'x ', iv.nome), ', '),
                        'Sem itens'
                    ) AS lista_itens
                FROM Vendas v
                LEFT JOIN Clientes c ON v.cliente_id = c.id
                LEFT JOIN Funcionarios f ON v.funcionario_id = f.id
                LEFT JOIN ItensVenda iv ON v.id = iv.venda_id
                WHERE 1 = 1
            """

            params = []

            if filtro_status:
                query += " AND v.status_pagamento ILIKE %s"
                params.append(filtro_status)

            if filtro_funcionario:
                query += " AND v.funcionario_id = %s"
                params.append(filtro_funcionario)

            if filtro_cliente_id:
                query += " AND v.cliente_id = %s"
                params.append(filtro_cliente_id)

            if filtro_data_inicio and filtro_data_fim:
                query += " AND v.criado_em BETWEEN %s::date AND (%s::date + '1 day'::interval)"
                params.append(filtro_data_inicio)
                params.append(filtro_data_fim)

            query += """
                GROUP BY 
                    v.id, v.total, v.forma_pagamento, v.status_pagamento, v.criado_em,
                    c.id, c.nome, f.id, f.nome
                ORDER BY v.criado_em DESC
            """

            cursor.execute(query, tuple(params))
            vendas = cursor.fetchall()

            return [
                {
                    "id": v[0], "total": v[1], "forma_pagamento": v[2],
                    "status_pagamento": v[3], "criado_em": v[4],
                    "cliente_id": v[5], "cliente_nome": v[6],
                    "funcionario_id": v[7], "funcionario_nome": v[8],
                    "itens": v[9]
                }
                for v in vendas
            ]

        finally:
            if conn:
                encerra_conexao(conn)