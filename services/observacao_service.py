from repositories.observacao_repository import RepositorioObservacao
from modelos import ObservacaoCreate

class ServicosObservacao:
    def __init__(self):
        self.repo = RepositorioObservacao()

    def criar_observacao(self, dados: ObservacaoCreate):
        id_obs, data = self.repo.criar(dados)
        # Retorna o objeto completo buscando do banco para garantir consistência
        lista = self.repo.listar_por_pet(dados.pet_id)
        for item in lista:
            if item['id'] == id_obs:
                return item
        return None

    def listar_por_pet(self, pet_id: int):
        return self.repo.listar_por_pet(pet_id)

    def deletar_observacao(self, obs_id: int):
        return self.repo.deletar(obs_id)