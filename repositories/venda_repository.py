from bancoDeDados import conectar, encerra_conexao

class RepositorioVenda:
    def __init__(self):
        self.conn = conectar()

    def registrar_venda(self, funcionario_id, dados_venda, total):
        try:
            with self.conn.cursor() as curs:
                curs.execute("""
                    INSERT INTO Vendas (funcionario_id, cliente_id, total, forma_pagamento, status_pagamento)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, criado_em;
                """, (
                    funcionario_id,
                    dados_venda.cliente_id,
                    total,
                    dados_venda.forma_pagamento,
                    dados_venda.status_pagamento
                ))
                venda_id, criado_em = curs.fetchone()

                for item in dados_venda.itens:
                    curs.execute("""
                        INSERT INTO ItensVenda (venda_id, tipo, id_item, nome, quantidade, preco_unitario)
                        VALUES (%s, %s, %s, %s, %s, %s);
                    """, (
                        venda_id,
                        item.tipo,
                        item.id_item,
                        item.nome,
                        item.quantidade,
                        item.preco_unitario
                    ))

                self.conn.commit()

                return {
                    "id_venda": venda_id,
                    "total": total,
                    "criado_em": criado_em
                }

        except Exception as e:
            self.conn.rollback()
            raise e

    def get_venda_by_id(self, venda_id):
        try:
            with self.conn.cursor() as cur:
                cur.execute("""
                    SELECT id, funcionario_id, cliente_id, total, forma_pagamento, status_pagamento, criado_em
                    FROM Vendas
                    WHERE id = %s;
                """, (venda_id,))
                venda = cur.fetchone()

                if not venda:
                    return None

                cur.execute("""
                    SELECT id, tipo, id_item, nome, quantidade, preco_unitario
                    FROM ItensVenda
                    WHERE venda_id = %s;
                """, (venda_id,))
                itens = cur.fetchall()

                return {
                    "id": venda[0],
                    "funcionario_id": venda[1],
                    "cliente_id": venda[2],
                    "total": venda[3],
                    "forma_pagamento": venda[4],
                    "status_pagamento": venda[5],
                    "criado_em": venda[6],
                    "itens": [
                        {
                            "id": i[0],
                            "tipo": i[1],
                            "id_item": i[2],
                            "nome": i[3],
                            "quantidade": i[4],
                            "preco_unitario": i[5],
                        }
                        for i in itens
                    ]
                }
        except Exception as e:
            raise e

    def get_all_vendas(self):
        try:
            with self.conn.cursor() as cur:
                cur.execute("""
                    SELECT id, funcionario_id, cliente_id, total, forma_pagamento, status_pagamento, criado_em
                    FROM Vendas
                    ORDER BY criado_em DESC;
                """)
                vendas = cur.fetchall()

                return [
                    {
                        "id": v[0],
                        "funcionario_id": v[1],
                        "cliente_id": v[2],
                        "total": v[3],
                        "forma_pagamento": v[4],
                        "status_pagamento": v[5],
                        "criado_em": v[6]
                    }
                    for v in vendas
                ]
        except Exception as e:
            raise e

    def update_venda(self, venda_id, forma_pagamento=None, total=None, status_pagamento=None):
        campos = []
        valores = []

        if forma_pagamento:
            campos.append("forma_pagamento = %s")
            valores.append(forma_pagamento)
        if total is not None:
            campos.append("total = %s")
            valores.append(total)
        if status_pagamento:
            campos.append("status_pagamento = %s")
            valores.append(status_pagamento)

        if not campos:
            return False  # Nada a atualizar

        valores.append(venda_id)
        query = f"UPDATE Vendas SET {', '.join(campos)} WHERE id = %s;"

        try:
            with self.conn.cursor() as cur:
                cur.execute(query, tuple(valores))
                self.conn.commit()
                return cur.rowcount > 0
        except Exception as e:
            self.conn.rollback()
            raise e

    def delete_venda(self, venda_id):
        try:
            with self.conn.cursor() as cur:
                # Exclui itens e venda (ON DELETE CASCADE já cobre, mas é seguro garantir)
                cur.execute("DELETE FROM ItensVenda WHERE venda_id = %s;", (venda_id,))
                cur.execute("DELETE FROM Vendas WHERE id = %s;", (venda_id,))
                self.conn.commit()
                return cur.rowcount > 0
        except Exception as e:
            self.conn.rollback()
            raise e

    def close(self):
        encerra_conexao(self.conn)
