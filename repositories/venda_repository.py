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

    # --- INÍCIO DA MODIFICAÇÃO ---
    def get_all_vendas(self):
        try:
            with self.conn.cursor() as cur:
                # Query atualizada para buscar nomes de cliente e funcionário
                cur.execute("""
                    SELECT 
                        v.id,
                        v.total,
                        v.forma_pagamento,
                        v.status_pagamento,
                        v.criado_em,
                        c.id as cliente_id,
                        c.nome as cliente_nome,
                        f.id as funcionario_id,
                        f.nome as funcionario_nome
                    FROM Vendas v
                    LEFT JOIN Clientes c ON v.cliente_id = c.id
                    LEFT JOIN Funcionarios f ON v.funcionario_id = f.id
                    ORDER BY v.criado_em DESC;
                """)
                vendas = cur.fetchall()

                return [
                    {
                        "id": v[0],
                        "total": v[1],
                        "forma_pagamento": v[2],
                        "status_pagamento": v[3],
                        "criado_em": v[4],
                        "cliente_id": v[5],
                        "cliente_nome": v[6] or 'Cliente (Checkout)', # Fallback para vendas de checkout
                        "funcionario_id": v[7],
                        "funcionario_nome": v[8] or 'N/A (Checkout)' # Fallback para vendas de checkout
                    }
                    for v in vendas
                ]
        except Exception as e:
            raise e
    # --- FIM DA MODIFICAÇÃO ---

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
            return False

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
                cur.execute("DELETE FROM ItensVenda WHERE venda_id = %s;", (venda_id,))
                cur.execute("DELETE FROM Vendas WHERE id = %s;", (venda_id,))
                self.conn.commit()
                return cur.rowcount > 0
        except Exception as e:
            self.conn.rollback()
            raise e

    def close(self):
        encerra_conexao(self.conn)