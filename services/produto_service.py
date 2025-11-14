from fastapi import HTTPException
from repositories.produto_repository import RepositorioProduto
from modelos import ProdutoCadastro, LoteEstoqueUpdate


class ServicosProduto:
    def __init__(self):
        self.repo = RepositorioProduto()

    def buscar_sugestoes(self, query: str):
        if not query or len(query) < 1:
            return []  #nao da sugestao se a quantidade de caracteres for menor do que o limite aqui em cima
        return self.repo.buscar_produto_externo(query)

    def buscar_detalhes_para_cadastro(self, barcode: str):
        detalhes = self.repo.buscar_detalhes_produto_externo(barcode)
        if not detalhes:
            raise HTTPException(status_code=404, detail="Produto não encontrado na base de dados externa.")
        return detalhes

    def cadastrar_produto(self, dados_produto: ProdutoCadastro, gestor_id: int):
        # Validação: estoque não pode ser negativo
        if dados_produto.estoque < 0:
            raise HTTPException(status_code=400, detail="O estoque não pode ser negativo.")

        try:
            produto_id = self.repo.cadastrar_produto(dados_produto, gestor_id)
            return {"id": produto_id, **dados_produto.model_dump()}
        except Exception as e:
            # tratamento para codigo de barras ja existente
            if "duplicate key value" in str(e) and "barcode" in str(e):
                raise HTTPException(status_code=409, detail="Um produto com este código de barras já foi cadastrado.")
            raise HTTPException(status_code=500, detail=f"Ocorreu um erro ao cadastrar o produto: {e}")

    def listar_todos_produtos(self):
        return self.repo.buscar_todos_produtos_cadastrados()

    def editar_produto(self, produto_id: int, dados_produto: ProdutoCadastro, gestor_id: int):
        # Validação: estoque não pode ser negativo
        if dados_produto.estoque < 0:
            raise HTTPException(status_code=400, detail="O estoque não pode ser negativo.")

        try:
            produtos = self.repo.buscar_todos_produtos_cadastrados()
            produto_atual = next((p for p in produtos if p['id'] == produto_id), None)

            if not produto_atual:
                raise HTTPException(status_code=404, detail="Produto não encontrado.")

            eh_produto_externo = self.repo.verificar_produto_externo(produto_atual['barcode'])

            if eh_produto_externo:
                dados_produto.nome = produto_atual['nome']
                dados_produto.marca = produto_atual['marca']
                dados_produto.categoria = produto_atual['categoria']
                dados_produto.descricao = produto_atual['descricao']
                dados_produto.url_imagem = produto_atual['url_imagem']

            produto_id_atualizado = self.repo.atualizar_produto(produto_id, dados_produto)
            return {"id": produto_id_atualizado, **dados_produto.model_dump()}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao editar produto: {e}")

    def excluir_produto(self, produto_id: int, gestor_id: int):
        """Exclui um produto cadastrado - apenas gestores"""
        try:
            produtos = self.repo.buscar_todos_produtos_cadastrados()
            produto = next((p for p in produtos if p['id'] == produto_id), None)

            if not produto:
                raise HTTPException(status_code=404, detail="Produto não encontrado.")

            sucesso = self.repo.excluir_produto(produto_id)
            if not sucesso:
                raise HTTPException(status_code=500, detail="Erro ao excluir produto.")

            return {"message": f"Produto '{produto['nome']}' excluído com sucesso."}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao excluir produto: {e}")

    def atualizar_estoque_lote(self, dados_lote: LoteEstoqueUpdate, gestor_id: int):

        # serviço para atualizar o estoque de varios produtos.

        try:
            # Converte os modelos Pydantic em uma lista de dicionarios
            itens_list = [item.model_dump() for item in dados_lote.itens]

            if not itens_list:
                raise HTTPException(status_code=400, detail="Nenhum item fornecido para atualização.")

            sucesso = self.repo.atualizar_estoque_lote(itens_list)

            if not sucesso:
                raise HTTPException(status_code=500, detail="Erro ao salvar dados no banco.")

            return {"message": "Estoque atualizado com sucesso!"}
        except Exception as e:
            print(f"Erro no serviço de atualização de estoque: {e}")
            raise HTTPException(status_code=500, detail=f"Erro ao processar atualização de estoque: {e}")