from fastapi import HTTPException
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

        # Busca a lista de produtos UMA VEZ fora do loop
        produtos_cadastrados = self.prod_repo.buscar_todos_produtos_cadastrados()

        for item in itens:
            if item["tipo"] == "produto":
                # Procura o produto na lista já buscada
                produto = next((p for p in produtos_cadastrados if p["id"] == item["id_item"]), None)
                if not produto:
                    raise ValueError(f"Produto com ID {item['id_item']} não encontrado.")

                preco_unitario = float(produto["preco_venda"])
                # *** CORREÇÃO: Captura o estoque do banco ***
                estoque_atual = int(produto["estoque"])
            else:
                # para serviços, pode manter o preço enviado ou buscar de outro repositório
                preco_unitario = float(item.get("preco_unitario", 0))
                estoque_atual = 999  # Assume que serviços têm estoque "infinito"

            quantidade = int(item.get("quantidade", 0))
            total += preco_unitario * quantidade

            itens_com_precos.append({
                "tipo": item["tipo"],
                "id_item": item["id_item"],
                "nome": item["nome"],
                "quantidade": quantidade,
                "preco_unitario": preco_unitario,
                # *** CORREÇÃO: Adiciona o estoque atual ao item ***
                "estoque_db": estoque_atual
            })

        return total, itens_com_precos

    def processar_pagamento(self, forma_pagamento: str, total: float) -> bool:
        # simulação de gateway
        return forma_pagamento.lower() in ["pix", "cartao"]

    def finalizar_compra(self, dados: CheckoutRequest) -> CheckoutResponse:
        # recalcula total e atualiza os itens com preços reais e estoque
        total, itens_com_precos = self.calcular_total(dados.itens)

        # *** INÍCIO DA VALIDAÇÃO DE ESTOQUE (REQ 1) ***
        for item in itens_com_precos:
            if item["tipo"] == "produto":
                if item["quantidade"] > item["estoque_db"]:
                    # Impede a compra se a quantidade for maior que o estoque
                    raise HTTPException(
                        status_code=400,
                        detail=f"Estoque insuficiente para '{item['nome']}'. Pedido: {item['quantidade']}, Disponível: {item['estoque_db']}"
                    )
        # *** FIM DA VALIDAÇÃO DE ESTOQUE ***

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