from fastapi import HTTPException
from repositories.produto_repository import RepositorioProduto
from modelos import ProdutoCadastro

class ServicosProduto:
    def __init__(self):
        self.repo = RepositorioProduto()

    def buscar_sugestoes(self, query: str):
        if not query or len(query) < 3:
            return [] #nao da sugestoes se a quantidade de caracteres da busca for muito curta
        return self.repo.buscar_produto_externo(query)

    def buscar_detalhes_para_cadastro(self, barcode: str):
        detalhes = self.repo.buscar_detalhes_produto_externo(barcode)
        if not detalhes:
            raise HTTPException(status_code=404, detail="Produto não encontrado na base de dados externa.")
        return detalhes

    def cadastrar_produto(self, dados_produto: ProdutoCadastro, gestor_id: int):
        try:
            produto_id = self.repo.cadastrar_produto(dados_produto, gestor_id)
            return {"id": produto_id, **dados_produto.model_dump()}
        except Exception as e:
            #tratamento pra codigo de barras já existente
            if "duplicate key value" in str(e) and "barcode" in str(e):
                 raise HTTPException(status_code=409, detail="Um produto com este código de barras já foi cadastrado.")
            raise HTTPException(status_code=500, detail=f"Ocorreu um erro ao cadastrar o produto: {e}")