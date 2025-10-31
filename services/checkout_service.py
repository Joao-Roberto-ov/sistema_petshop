# joao-roberto-ov/sistema_petshop/sistema_petshop-US-28/services/checkout_service.py

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
        # 1. Calcula o total e pega os preços (o estoque aqui pode estar ligeiramente desatualizado)
        total, itens_com_precos = self.calcular_total(dados.itens)

        # *** INÍCIO DA CORREÇÃO (VALIDAÇÃO DE ESTOQUE EM TEMPO REAL) ***
        # 2. Busca o estoque MAIS RECENTE antes de validar
        produtos_cadastrados_atuais = self.prod_repo.buscar_todos_produtos_cadastrados()

        for item in itens_com_precos:
            if item["tipo"] == "produto":
                # Procura o produto na lista ATUALIZADA
                produto_atual = next((p for p in produtos_cadastrados_atuais if p["id"] == item["id_item"]), None)

                estoque_real = 0
                if produto_atual:
                    estoque_real = int(produto_atual["estoque"])
                else:
                    # Se o produto sumiu, é um erro
                    raise HTTPException(status_code=404, detail=f"Produto '{item['nome']}' não foi encontrado.")

                # 3. Valida a quantidade do pedido contra o estoque REAL
                if item["quantidade"] > estoque_real:
                    # 4. Lança o erro com o estoque REAL (e não o estoque_db antigo)
                    raise HTTPException(
                        status_code=400,
                        detail=f"Estoque insuficiente para '{item['nome']}'. Pedido: {item['quantidade']}, Disponível: {estoque_real}"
                    )
        # *** FIM DA CORREÇÃO ***

        # 5. Se a validação passou, continua o processo
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
            # A atualização de estoque (UPDATE ... SET estoque = estoque - X)
            # é atômica no banco, então a race condition é evitada aqui.
            self.repo.atualizar_estoque(itens_com_precos)

        return CheckoutResponse(
            id_venda=venda_id,
            status_pagamento=status_final,
            total=total,
            criado_em=datetime.now(),
            mensagem="Compra finalizada com sucesso!" if pagamento_aprovado else "Falha no pagamento."
        )