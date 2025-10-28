from fastapi import HTTPException
from repositories.servico_repository import RepositorioCatalogoServico
from repositories.funcionario_repository import RepositorioFuncionario


class ServicosService:
    def __init__(self):
        self.repo_servico = RepositorioCatalogoServico()
        self.repo_funcionario = RepositorioFuncionario()

    def _verifica_gestor(self, user_id: int):
        """
        Verifica se o usuário é gestor
        """
        funcionario = self.repo_funcionario.procurar_pelo_id(user_id)
        if not funcionario or funcionario.get("cargo") != "gestor":
            raise HTTPException(status_code=403, detail="Acesso negado: apenas gestores podem realizar esta operação")

    def cadastrar_servico(self, dados_servico, user_id: int):
        self._verifica_gestor(user_id)
        return self.repo_servico.cadastrar_servico(
            dados_servico.nome,
            dados_servico.descricao,
            dados_servico.duracao,
            dados_servico.preco,
            dados_servico.criador_id
        )

    def listar_servicos(self):
        return self.repo_servico.buscar_todos()

    def buscar_servico_por_id(self, servico_id: int):
        return self.repo_servico.buscar_por_id(servico_id)

    def atualizar_servico(self, servico_id: int, campos: dict, user_id: int):
        self._verifica_gestor(user_id)
        return self.repo_servico.atualizar_servico(servico_id, campos)

    def deletar_servico(self, servico_id: int, user_id: int):
        self._verifica_gestor(user_id)
        return self.repo_servico.deletar_servico(servico_id)
