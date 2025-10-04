from fastapi import HTTPException
from repositories.venda_repository import RepositorioVenda

class ServicosVenda:
    def __init__(self):
        self.repo = RepositorioVenda()

    def registrar_venda(self, dados_venda):
        if not dados_venda.itens:
            raise HTTPException(status_code=400, detail="Nenhum item na venda.")

        total = sum(item.preco_unitario * item.quantidade for item in dados_venda.itens)
        venda_id = self.repo.registrar_venda(
            dados_venda.funcionario_id,
            dados_venda.cliente_id,
            dados_venda.itens,
            dados_venda.forma_pagamento,
            total
        )

        return {
            "id": venda_id,
            "total": total,
            "forma_pagamento": dados_venda.forma_pagamento,
            "status_pagamento": "pendente"
        }
