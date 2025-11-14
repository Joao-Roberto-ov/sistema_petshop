from bancoDeDados import conectar, encerra_conexao
from datetime import date, datetime
from models.venda_model import VendaModel
from typing import List
import json


class RepositorioVenda:
    def __init__(self):
        self.conn = conectar()

    def registrar_venda(self, funcionario_id, dados_venda, total):
        try:
            with self.conn.cursor() as curs:
                # 1. Insere a Venda (Req 1: Sempre como Pendente)
                curs.execute("""
                             INSERT INTO Vendas (funcionario_id, cliente_id, total, forma_pagamento, status_pagamento)
                             VALUES (%s, %s, %s, %s, 'Pendente')
                             RETURNING id, criado_em;
                             """, (
                                 funcionario_id,
                                 dados_venda.cliente_id,
                                 total,
                                 dados_venda.forma_pagamento
                             ))
                venda_id, criado_em = curs.fetchone()

                # 2. Insere os Itens da Venda (Req 2: com info_agendamento)
                for item in dados_venda.itens:
                    info_json = None
                    if item.info_agendamento:
                        # Converte o objeto Pydantic para string JSON
                        info_json = item.info_agendamento.model_dump_json()

                    curs.execute("""
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
                                     info_json  # Salva o JSON como texto
                                 ))

                # 3. (Req 3: Baixa de estoque REMOVIDA daqui)

                self.conn.commit()

                return {
                    "id_venda": venda_id,
                    "total": total,
                    "criado_em": criado_em,
                    "status": "Pendente"  # Retorna o status criado
                }

        except Exception as e:
            self.conn.rollback()
            raise e

    def get_venda_by_id(self, venda_id):
        # ... (Mantido igual ao arquivo original, busca venda e itens)
        try:
            with self.conn.cursor() as cur:
                cur.execute("""
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
                venda = cur.fetchone()

                if not venda:
                    return None

                cur.execute("""
                            SELECT id, tipo, id_item, nome, quantidade, preco_unitario, info_agendamento
                            FROM ItensVenda
                            WHERE venda_id = %s;
                            """, (venda_id,))
                itens = cur.fetchall()

                return {
                    "id": venda[0], "funcionario_id": venda[1], "cliente_id": venda[2],
                    "total": venda[3], "forma_pagamento": venda[4], "status_pagamento": venda[5],
                    "criado_em": venda[6], "cliente_nome": venda[7], "funcionario_nome": venda[8],
                    "itens": [
                        {
                            "id": i[0], "tipo": i[1], "id_item": i[2], "nome": i[3],
                            "quantidade": i[4], "preco_unitario": i[5],
                            "info_agendamento": i[6]  # Retorna a string JSON
                        }
                        for i in itens
                    ]
                }
        except Exception as e:
            raise e

    def buscar_itens_da_venda(self, venda_id):
        """Busca itens para processar estoque e agendamento"""
        try:
            with self.conn.cursor() as cur:
                cur.execute(
                    "SELECT tipo, id_item, quantidade, info_agendamento, nome FROM ItensVenda WHERE venda_id = %s",
                    (venda_id,))
                return cur.fetchall()
        except Exception as e:
            raise e

    def atualizar_status_e_processar(self, venda_id, novo_status, itens_venda, cliente_id, funcionario_id):
        """
        (Req 3)
        Atualiza o status E, SE for 'Pago', processa o estoque e os agendamentos
        dentro de uma transação única.
        """
        try:
            with self.conn.cursor() as curs:
                # 1. Atualiza status da Venda
                curs.execute("UPDATE Vendas SET status_pagamento = %s WHERE id = %s", (novo_status, venda_id))

                # 2. Se a Venda foi PAGA, processa os itens
                if novo_status == "Pago":
                    for tipo, id_item, qtd, info_json, nome_item in itens_venda:

                        # Processar Produto: Baixa Estoque
                        if tipo == "produto":
                            curs.execute(
                                "UPDATE produtos_cadastrados SET estoque = estoque - %s WHERE id = %s RETURNING estoque",
                                (qtd, id_item)
                            )
                            res = curs.fetchone()
                            # Se o estoque ficar negativo, cancela a transação
                            if not res or res[0] < 0:
                                self.conn.rollback()  # Desfaz a atualização de status
                                raise Exception(
                                    f"Estoque insuficiente para o produto '{nome_item}' (ID {id_item}) ao confirmar pagamento.")

                        # Processar Serviço: Criar Agendamento
                        if tipo == "servico" and info_json:
                            info = json.loads(info_json)
                            data_hora_inicio = info['data_hora']

                            curs.execute("SELECT duracao FROM catalogo_servicos WHERE id = %s", (id_item,))
                            duracao_res = curs.fetchone()
                            duracao = duracao_res[0] if duracao_res else 60  # Padrão 60 min se não achar

                            # Insere na tabela Agendamentos
                            # NOTA: Esta query simples NÃO verifica conflitos de horário.
                            # A lógica de verificação de conflito está no 'agendamento_service'
                            # Para 100% de segurança, o 'agendamento_service' deveria ser chamado aqui.
                            curs.execute("""
                                         INSERT INTO Agendamentos (cliente_id, pet_id, servico_id, funcionario_id,
                                                                   data_hora_inicio, data_hora_fim, status, observacoes)
                                         VALUES (%s, %s, %s, %s, %s::timestamp,
                                                 %s::timestamp + make_interval(mins => %s), 'Agendado', %s)
                                         """, (
                                             cliente_id,
                                             info['pet_id'],
                                             id_item,
                                             funcionario_id,  # Atendente que registrou a venda
                                             data_hora_inicio,
                                             data_hora_inicio,
                                             duracao,
                                             info.get('observacoes', 'Agendado via Venda Balcão')
                                         ))

                # 3. Confirma a transação
                self.conn.commit()
                return True
        except Exception as e:
            self.conn.rollback()  # Desfaz tudo se der erro
            raise e

    def get_all_vendas(self, filtro_status=None, filtro_funcionario=None, filtro_data_inicio=None,
                       filtro_data_fim=None):
        """ (Req 5) Query flexível para os dashboards de Atendente e Gestor """
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
        if filtro_status:
            query += " AND v.status_pagamento = %s"
            params.append(filtro_status)
        if filtro_funcionario:
            query += " AND v.funcionario_id = %s"
            params.append(filtro_funcionario)
        if filtro_data_inicio and filtro_data_fim:
            # Garante que as datas cubram o dia completo
            query += " AND v.criado_em BETWEEN %s::date AND (%s::date + '1 day'::interval)"
            params.append(filtro_data_inicio)
            params.append(filtro_data_fim)

        query += " ORDER BY v.criado_em DESC"

        try:
            with self.conn.cursor() as cur:
                cur.execute(query, tuple(params))
                vendas = cur.fetchall()
                return [
                    {
                        "id": v[0], "total": v[1], "forma_pagamento": v[2], "status_pagamento": v[3],
                        "criado_em": v[4], "cliente_id": v[5], "cliente_nome": v[6],
                        "funcionario_id": v[7], "funcionario_nome": v[8]
                    } for v in vendas
                ]
        except Exception as e:
            raise e

    def close(self):
        encerra_conexao(self.conn)