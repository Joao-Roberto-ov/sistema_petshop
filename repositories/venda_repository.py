from bancoDeDados import conectar, encerra_conexao

class RepositorioVenda:
    def __init__(self):
        self.conn = conectar()

    def registrar_venda(self, funcionario_id, cliente_id, itens, forma_pagamento, total):
        with self.conn.cursor() as cur:
            cur.execute("""
            INSERT INTO Vendas (funcionario_id, cliente_id, total, forma_pagamento)
            VALUES (%s, %s, %s, %s) RETURNING id;
            """, (funcionario_id, cliente_id, total, forma_pagamento))
            venda_id = cur.fetchone()[0]

            for item in itens:
                cur.execute("""
                INSERT INTO ItensVenda (venda_id, tipo, id_item, nome, quantidade, preco_unitario)
                VALUES (%s, %s, %s, %s, %s, %s);
                """, (venda_id, item.tipo, item.id_item, item.nome, item.quantidade, item.preco_unitario))

            self.conn.commit()
            return venda_id
