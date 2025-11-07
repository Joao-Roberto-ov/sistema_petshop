from models.despesa_model import DespesaModel
from repositories.despesa_repository import DespesaRepository

class DespesaService:
    @staticmethod
    def criar(despesa: DespesaModel):
        return DespesaRepository.criar(despesa)

    @staticmethod
    def listar_todas():
        return DespesaRepository.listar_todas()

    @staticmethod
    def buscar_por_id(despesa_id: int):
        return DespesaRepository.buscar_por_id(despesa_id)

    @staticmethod
    def editar(despesa_id: int, despesa: DespesaModel):
        return DespesaRepository.editar(despesa_id, despesa)

    @staticmethod
    def deletar(despesa_id: int):
        return DespesaRepository.deletar(despesa_id)
