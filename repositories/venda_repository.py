from bancoDeDados import conectar, encerra_conexao
from datetime import date, datetime
from typing import List
import json


class RepositorioVenda:
    # Removemos o __init__ com self.conn global para evitar desconexões

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
                               INSERT INTO ItensVenda (venda_id, tipo, id_item, nome, quantidade, preco_unitario,
                                                       info_agendamento)
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
            if conn: conn.rollback()
            raise e
        finally:
            if conn: encerra_conexao(conn)

    def get_venda_by_id(self, venda_id):
        conn = conectar()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                           SELECT v.id,
                                  v.funcionario_id,
                                  v.cliente_id,
                                  v.total,
                                  v.forma_pagamento,
                                  v.status_pagamento,
                                  v.criado_em,
                                  c.nome as cliente_nome,
                                  f.nome as funcionario_nome
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
            if conn: encerra_conexao(conn)

    def buscar_itens_da_venda(self, venda_id):
        conn = conectar()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT tipo, id_item, quantidade, info_agendamento, nome FROM ItensVenda WHERE venda_id = %s",
                (venda_id,))
            return cursor.fetchall()
        finally:
            if conn: encerra_conexao(conn)

    def atualizar_status_e_processar(self, venda_id, novo_status, itens_venda, cliente_id, funcionario_id):
        conn = conectar()
        try:
            cursor = conn.cursor()

            # 1. Atualiza status
            cursor.execute("UPDATE Vendas SET status_pagamento = %s WHERE id = %s", (novo_status, venda_id))

            # 2. Se PAGO, processa estoque/agenda
            if novo_status == "Pago":
                for tipo, id_item, qtd, info_json, nome_item in itens_venda:
                    if tipo == "produto":
                        cursor.execute(
                            "UPDATE produtos_cadastrados SET estoque = estoque - %s WHERE id = %s RETURNING estoque",
                            (qtd, id_item)
                        )
                        res = cursor.fetchone()
                        if not res or res[0] < 0:
                            conn.rollback()
                            raise Exception(f"Estoque insuficiente para '{nome_item}' (ID {id_item}).")

                    if tipo == "servico" and info_json:
                        info = json.loads(info_json)
                        data_hora_inicio = info['data_hora']

                        # Busca duracao
                        cursor.execute("SELECT duracao FROM catalogo_servicos WHERE id = %s", (id_item,))
                        duracao_res = cursor.fetchone()
                        duracao = duracao_res[0] if duracao_res else 60

                        # Cria agendamento
                        cursor.execute("""
                                       INSERT INTO Agendamentos (cliente_id, pet_id, servico_id, funcionario_id,
                                                                 data_hora_inicio, data_hora_fim, status, observacoes)
                                       VALUES (%s, %s, %s, %s, %s::timestamp,
                                               %s::timestamp + make_interval(mins => %s), 'Agendado', %s)
                                       """, (
                                           cliente_id,
                                           info['pet_id'],
                                           id_item,
                                           funcionario_id,
                                           data_hora_inicio,
                                           data_hora_inicio,
                                           duracao,
                                           info.get('observacoes', 'Agendado via Venda Balcão')
                                       ))

            conn.commit()
            return True
        except Exception as e:
            if conn: conn.rollback()
            raise e
        finally:
            if conn: encerra_conexao(conn)

    def get_all_vendas(self, filtro_status=None, filtro_funcionario=None, filtro_data_inicio=None,
                       filtro_data_fim=None):
        conn = conectar()
        try:
            cursor = conn.cursor()

            query = """
                    SELECT v.id, \
                           v.total, \
                           v.forma_pagamento, \
                           v.status_pagamento, \
                           v.criado_em,
                           c.id, \
                           c.nome, \
                           f.id, \
                           f.nome
                    FROM Vendas v
                             LEFT JOIN Clientes c ON v.cliente_id = c.id
                             LEFT JOIN Funcionarios f ON v.funcionario_id = f.id
                    WHERE 1 = 1 \
                    """
            params = []

            # ILIKE para ignorar maiúsculas/minúsculas no status
            if filtro_status:
                query += " AND v.status_pagamento ILIKE %s"
                params.append(filtro_status)

            if filtro_funcionario:
                query += " AND v.funcionario_id = %s"
                params.append(filtro_funcionario)

            if filtro_data_inicio and filtro_data_fim:
                query += " AND v.criado_em BETWEEN %s::date AND (%s::date + '1 day'::interval)"
                params.append(filtro_data_inicio)
                params.append(filtro_data_fim)

            query += " ORDER BY v.criado_em DESC"

            cursor.execute(query, tuple(params))
            vendas = cursor.fetchall()

            return [
                {
                    "id": v[0], "total": v[1], "forma_pagamento": v[2], "status_pagamento": v[3],
                    "criado_em": v[4], "cliente_id": v[5], "cliente_nome": v[6],
                    "funcionario_id": v[7], "funcionario_nome": v[8]
                } for v in vendas
            ]
        finally:
            if conn: encerra_conexao(conn)