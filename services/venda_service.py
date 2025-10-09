from fastapi import HTTPException
from repositories.venda_repository import RepositorioVenda

class ServicosVenda:
    def __init__(self):
        self.repo = RepositorioVenda()

    def registrar_venda(self, dados_venda, funcionario_id: int):
        if not dados_venda.itens or len(dados_venda.itens) == 0:
            raise HTTPException(status_code=400, detail="Nenhum item informado na venda.")
        
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
