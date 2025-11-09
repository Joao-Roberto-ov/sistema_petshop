from fastapi import HTTPException
from repositories.venda_repository import RepositorioVenda
from repositories.produto_repository import RepositorioProduto
from datetime import date

# --- FIM DA MODIFICAÇÃO ---

class ServicosVenda:
    def __init__(self):
        self.repo = RepositorioVenda()
        self.prod_repo = RepositorioProduto()

    def registrar_venda(self, dados_venda, funcionario_id: int):
        if not dados_venda.itens or len(dados_venda.itens) == 0:
            raise HTTPException(status_code=400, detail="Nenhum item informado na venda.")

        produtos_cadastrados_atuais = self.prod_repo.buscar_todos_produtos_cadastrados()

        for item_venda in dados_venda.itens:
            if item_venda.tipo == "produto":
                produto_atual = next((p for p in produtos_cadastrados_atuais if p["id"] == item_venda.id_item), None)

                if not produto_atual:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Produto '{item_venda.nome}' (ID: {item_venda.id_item}) não foi encontrado."
                    )

                estoque_real = int(produto_atual["estoque"])

                if item_venda.quantidade > estoque_real:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Estoque insuficiente para '{item_venda.nome}'. Pedido: {item_venda.quantidade}, Disponível: {estoque_real}"
                    )

        total = sum(item.quantidade * float(item.preco_unitario) for item in dados_venda.itens)

        try:
            venda = self.repo.registrar_venda(funcionario_id, dados_venda, total)
            return {
                "mensagem": "Venda registrada com sucesso.",
                "venda": venda
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao registrar venda: {e}")

    def buscar_venda_por_id(self, venda_id: int):
        venda = self.repo.get_venda_by_id(venda_id)
        if not venda:
            raise HTTPException(status_code=404, detail="Venda não encontrada.")
        return venda

    def listar_vendas(self):
        vendas = self.repo.get_all_vendas()
        return vendas or []

    def atualizar_venda(
            self,
            venda_id: int,
            forma_pagamento: str = None,
            total: float = None,
            status_pagamento: str = None
    ):
        if not any([forma_pagamento, total, status_pagamento]):
            raise HTTPException(status_code=400, detail="Nenhum campo para atualização informado.")

        atualizada = self.repo.update_venda(venda_id, forma_pagamento, total, status_pagamento)
        if not atualizada:
            raise HTTPException(status_code=404, detail="Venda não encontrada ou sem alterações.")

        return {"mensagem": "Venda atualizada com sucesso."}

    def deletar_venda(self, venda_id: int):
        deletada = self.repo.delete_venda(venda_id)
        if not deletada:
            raise HTTPException(status_code=404, detail="Venda não encontrada.")
        return {"mensagem": "Venda excluída com sucesso."}

    def listar_por_periodo(self, data_inicial: date, data_final: date):
        if data_inicial > data_final:
            raise HTTPException(status_code=400, detail="A data inicial não pode ser maior que a data final.")

        try:
            vendas = self.repo.get_vendas_por_periodo(data_inicial, data_final)
            return vendas or []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao buscar vendas por período: {e}")