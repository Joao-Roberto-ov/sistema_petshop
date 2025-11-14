from fastapi import HTTPException
from repositories.venda_repository import RepositorioVenda
from repositories.produto_repository import RepositorioProduto
from datetime import date


class ServicosVenda:
    def __init__(self):
        self.repo = RepositorioVenda()
        self.prod_repo = RepositorioProduto()

    def registrar_venda(self, dados_venda, funcionario_id: int):
        # (Req 1) Status é removido, backend define como 'Pendente'
        if not dados_venda.itens or len(dados_venda.itens) == 0:
            raise HTTPException(status_code=400, detail="Nenhum item informado na venda.")

        # (Req 3) Validação de leitura: Apenas verifica se há estoque ANTES de criar
        # A baixa real só ocorre no pagamento.
        produtos_cadastrados_atuais = self.prod_repo.buscar_todos_produtos_cadastrados()
        for item_venda in dados_venda.itens:
            if item_venda.tipo == "produto":
                produto_atual = next((p for p in produtos_cadastrados_atuais if p["id"] == item_venda.id_item), None)
                if not produto_atual:
                    raise HTTPException(status_code=404, detail=f"Produto '{item_venda.nome}' não encontrado.")

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
                "mensagem": "Venda registrada como Pendente.",
                "venda": venda
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao registrar venda: {e}")

    def atualizar_status(self, venda_id: int, novo_status: str):
        # (Req 6) Lógica central de atualização de status

        # 1. Busca a venda atual
        venda = self.repo.get_venda_by_id(venda_id)
        if not venda:
            raise HTTPException(status_code=404, detail="Venda não encontrada")

        # (Req 6) Não pode alterar se não for 'Pendente'
        if venda['status_pagamento'] != 'Pendente':
            raise HTTPException(status_code=400,
                                detail=f"Apenas vendas 'Pendentes' podem ser alteradas. Status atual: {venda['status_pagamento']}.")

        # (Req 4) Valida os novos status
        if novo_status not in ['Pago', 'Cancelado']:
            raise HTTPException(status_code=400, detail="Status inválido. Use 'Pago' ou 'Cancelado'.")

        # 2. Busca itens para processamento (se for 'Pago')
        itens_db = self.repo.buscar_itens_da_venda(venda_id)

        # 3. Executa transação de baixa/agendamento no repositório
        try:
            self.repo.atualizar_status_e_processar(
                venda_id=venda_id,
                novo_status=novo_status,
                itens_venda=itens_db,
                cliente_id=venda['cliente_id'],
                funcionario_id=venda['funcionario_id']
            )
            return {"mensagem": f"Venda {venda_id} atualizada para {novo_status} com sucesso."}
        except Exception as e:
            # Captura erros de estoque que podem ocorrer durante a transação
            raise HTTPException(status_code=500, detail=f"Erro ao processar venda: {str(e)}")

    def listar_vendas_filtradas(self, filtro_status=None, filtro_funcionario=None, filtro_data_inicio=None,
                                filtro_data_fim=None):
        """ (Req 5) Passa os filtros para o repositório """
        return self.repo.get_all_vendas(
            filtro_status=filtro_status,
            filtro_funcionario=filtro_funcionario,
            filtro_data_inicio=filtro_data_inicio,
            filtro_data_fim=filtro_data_fim
        )

    def buscar_venda_por_id(self, venda_id: int):
        venda = self.repo.get_venda_by_id(venda_id)
        if not venda:
            raise HTTPException(status_code=404, detail="Venda não encontrada.")
        return venda