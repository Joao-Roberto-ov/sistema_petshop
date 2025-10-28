from repositories.checkout_repository import CheckoutRepository
from repositories.produto_repository import RepositorioProduto
from models.checkout_model import CheckoutRequest, CheckoutResponse
from datetime import datetime

class CheckoutService:
    def __init__(self):
        self.repo = CheckoutRepository()
        self.prod_repo = RepositorioProduto()  # para buscar preços reais

    def calcular_total(self, itens):
        total = 0
        itens_com_precos = []

        for item in itens:
            if item["tipo"] == "produto":
                produto = self.prod_repo.buscar_todos_produtos_cadastrados()
                # procurar produto pelo id enviado
                produto = next((p for p in produto if p["id"] == item["id_item"]), None)
                if not produto:
                    raise ValueError(f"Produto com ID {item['id_item']} não encontrado.")
                preco_unitario = float(produto["preco_venda"])
            else:
                # para serviços, pode manter o preço enviado ou buscar de outro repositório
                preco_unitario = float(item.get("preco_unitario", 0))
            
            quantidade = int(item.get("quantidade", 0))
            total += preco_unitario * quantidade

            itens_com_precos.append({
                "tipo": item["tipo"],
                "id_item": item["id_item"],
                "nome": item["nome"],
                "quantidade": quantidade,
                "preco_unitario": preco_unitario
            })

        return total, itens_com_precos

    def processar_pagamento(self, forma_pagamento: str, total: float) -> bool:
        # simulação de gateway
        return forma_pagamento.lower() in ["pix", "cartao"]

    def finalizar_compra(self, dados: CheckoutRequest) -> CheckoutResponse:
        # recalcula total e atualiza os itens com preços reais
        total, itens_com_precos = self.calcular_total(dados.itens)

        venda_id = self.repo.criar_venda(
            cliente_id=dados.cliente_id,
            forma_pagamento=dados.forma_pagamento,
            total=total,
            status="pendente"
        )

        self.repo.adicionar_itens_venda(venda_id, itens_com_precos)

        pagamento_aprovado = self.processar_pagamento(dados.forma_pagamento, total)
        status_final = "pago" if pagamento_aprovado else "falhou"

        if pagamento_aprovado:
            self.repo.atualizar_status_pagamento(venda_id, "pago")
            self.repo.atualizar_estoque(itens_com_precos)

        return CheckoutResponse(
            id_venda=venda_id,
            status_pagamento=status_final,
            total=total,
            criado_em=datetime.now(),
            mensagem="Compra finalizada com sucesso!" if pagamento_aprovado else "Falha no pagamento."
        )
