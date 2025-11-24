import json
import os

CAMINHO_JSON = "config/estoque_minimo.json"

class EstoqueConfigService:

    @staticmethod
    def carregar_config():
        if not os.path.exists(CAMINHO_JSON):
            return {}
        with open(CAMINHO_JSON, "r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def salvar_config(dados: dict):
        with open(CAMINHO_JSON, "w", encoding="utf-8") as f:
            json.dump(dados, f, indent=4, ensure_ascii=False)

    @staticmethod
    def definir_estoque_minimo(produto_id: int, minimo: int):
        dados = EstoqueConfigService.carregar_config()
        dados[str(produto_id)] = minimo
        EstoqueConfigService.salvar_config(dados)
        return {"produto_id": produto_id, "estoque_minimo": minimo}

    @staticmethod
    def obter_estoque_minimo(produto_id: int):
        dados = EstoqueConfigService.carregar_config()
        return dados.get(str(produto_id), None)
