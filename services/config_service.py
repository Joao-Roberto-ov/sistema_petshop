from repositories.config_repository import carregar_config, salvar_config, listar_horarios, atualizar_horario, criar_horario, deletar_horario
from models.config_model import ConfigEmpresa, HorarioFuncionamento

class ConfigService:
    @staticmethod
    def get_config():
        return carregar_config()

    @staticmethod
    def update_config(data: ConfigEmpresa):
        salvar_config(data)
        return {"mensagem": "Configurações atualizadas com sucesso"}

    @staticmethod
    def get_horarios():
        return listar_horarios()

    @staticmethod
    def update_horario(id, data: HorarioFuncionamento):
        atualizar_horario(id, data)
        return {"mensagem": "Horário atualizado com sucesso"}

    @staticmethod
    def create_horario(data: HorarioFuncionamento):
        return criar_horario(data)

    @staticmethod
    def delete_horario(id: int):
        return deletar_horario(id)