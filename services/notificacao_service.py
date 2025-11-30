from repositories.notificacao_repository import NotificacaoRepository

class NotificacaoService:
    def __init__(self):
        self.repo = NotificacaoRepository()

    def criar_notificacao(self, mensagem: str, tipo: str = 'info'):
        return self.repo.criar(mensagem, tipo)

    def listar_nao_lidas(self):
        return self.repo.listar_nao_lidas()

    def marcar_como_lida(self, notificacao_id: int):
        return self.repo.marcar_como_lida(notificacao_id)