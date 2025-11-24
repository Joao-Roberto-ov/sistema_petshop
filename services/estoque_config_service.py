import json
import os

CONFIG_PATH = "config/estoque_minimo.json"

class EstoqueConfigService:

    @staticmethod
    def _carregar_config():
        if not os.path.exists(CONFIG_PATH):
            return {}
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def _salvar_config(config):
        os.makedirs("config", exist_ok=True)
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=4, ensure_ascii=False)

    @staticmethod
    def configurar_estoque_minimo(produto_id: int, minimo: int):
        config = EstoqueConfigService._carregar_config()
        config[str(produto_id)] = minimo
        EstoqueConfigService._salvar_config(config)
        return {"produto_id": produto_id, "estoque_minimo": minimo}

    @staticmethod
    def obter_estoque_minimo(produto_id: int):
        config = EstoqueConfigService._carregar_config()
        return config.get(str(produto_id))

    @staticmethod
    def listar_todos():
        return EstoqueConfigService._carregar_config()
