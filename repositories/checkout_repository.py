from typing import List, Dict
from datetime import datetime
from bancoDeDados import conectar
import os


class CheckoutRepository:
    def __init__(self):
        self.conn = conectar()
        self.cursor = self.conn.cursor()

    def criar_venda(self, cliente_id: int, forma_pagamento: str, total: float, status: str) -> int:
        query = """
            INSERT INTO vendas (cliente_id, forma_pagamento, total, status_pagamento, criado_em)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id;
        """
        self.cursor.execute(query, (cliente_id, forma_pagamento, total, status, datetime.now()))
        venda_id = self.cursor.fetchone()[0]
        self.conn.commit()
        return venda_id

    def adicionar_itens_venda(self, venda_id: int, itens: List[Dict]):
        for item in itens:
            query = """
                INSERT INTO ItensVenda (venda_id, tipo, id_item, nome, quantidade, preco_unitario)
                VALUES (%s, %s, %s, %s, %s, %s);
            """
            self.cursor.execute(query, (
                venda_id, item['tipo'], item['id_item'], item['nome'],
                item['quantidade'], item['preco_unitario']
            ))
        self.conn.commit()

    def atualizar_status_pagamento(self, venda_id: int, status: str):
        self.cursor.execute(
            "UPDATE vendas SET status_pagamento = %s WHERE id = %s;",
            (status, venda_id)
        )
        self.conn.commit()

    def atualizar_estoque(self, itens: List[Dict]):
        for item in itens:
            if item["tipo"] == "produto":
                self.cursor.execute(
                    "UPDATE produtos_cadastrados SET estoque = estoque - %s WHERE id = %s;",
                    (item["quantidade"], item["id_item"])
                )
        self.conn.commit()
