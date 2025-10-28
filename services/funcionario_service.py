from fastapi import HTTPException
from psycopg2 import IntegrityError
from seguranca import cria_hash_senha, verifica_senha, cria_token_de_acesso
from repositories.funcionario_repository import RepositorioFuncionario
from services.email_service import EmailService
# --- MODIFICAÇÕES DE IMPORTAÇÃO ---
from modelos import (
    ForgotPasswordRequest, RedefinirSenhaRequest, FuncionarioCadastroPorAdmin,
    FuncionarioCadastro, FuncionarioUpdate
)
from typing import List, Optional
# --- FIM DAS MODIFICAÇÕES ---
import secrets
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# (Req 2) ID do Cargo "Funcionário"
CARGO_FUNCIONARIO_ID = 2


class ServicosFuncionario:
    def __init__(self):
        self.repo = RepositorioFuncionario()
        self.email_service = EmailService()

    def login(self, dados_login):
        try:
            resultado = self.repo.buscar_pelo_email(dados_login.email)

            if not resultado:
                raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

            user_id, senha_hashed_do_banco = resultado

            if not verifica_senha(dados_login.senha, senha_hashed_do_banco):
                raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

            dados_usuario = self.buscar_pelo_id(user_id)

            if not dados_usuario:
                raise HTTPException(status_code=404, detail="Funcionário não encontrado após verificação.")

            if not dados_usuario.get("is_ativo", True):
                raise HTTPException(status_code=403, detail="Funcionário inativo")

            token = cria_token_de_acesso(data={
                "sub": str(user_id),
                "tipo": "funcionario",
                "cargo_id": dados_usuario.get("cargo_id")
            })

            return {
                "access_token": token,
                "token_type": "bearer",
                "user": dados_usuario
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro interno no login de funcionário: {str(e)}")

    def buscar_pelo_id(self, user_id: int):
        """
        Busca os dados completos do funcionário.
        O repositório já retorna um dict incluindo 'especialidades'.
        """
        try:
            user_data = self.repo.procurar_pelo_id(user_id)  # Esta função foi modificada no repo
            if not user_data:
                return None

            # Apenas retorna o dicionário que o repositório já montou
            return user_data

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao buscar funcionário: {str(e)}")

    def cadastrar_funcionario(self, nome, email, senha, telefone, endereco, cpf, cargo_id, is_ativo=True,
                              horario_inicio=None, horario_fim=None, dias_trabalho=None):
        """
        Cadastra um novo funcionário (Função antiga, mantida por compatibilidade)
        """
        try:
            senha_hash = cria_hash_senha(senha)
            user_id = self.repo.cadastrar_funcionario(
                nome, email, senha_hash, telefone, endereco, cpf, cargo_id, is_ativo,
                horario_inicio=None, horario_fim=None, dias_trabalho=None
            )

            return user_id
        except IntegrityError as e:
            error_message = str(e).lower()
            if "email" in error_message:
                raise HTTPException(status_code=400, detail="O e-mail fornecido já está cadastrado.")
            elif "cpf" in error_message:
                raise HTTPException(status_code=400, detail="O CPF fornecido já está cadastrado.")
            else:
                raise HTTPException(status_code=400, detail="Erro de integridade dos dados.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao cadastrar funcionário: {str(e)}")

    def cadastrar_funcionario_por_admin(self, funcionario: FuncionarioCadastroPorAdmin):
        """
        Cadastra um novo funcionário por um administrador (Função antiga).
        """
        try:
            senha_hash = cria_hash_senha(funcionario.senha)
            user_id = self.repo.criar_funcionario_admin(
                funcionario.nome, funcionario.email, senha_hash, funcionario.telefone,
                funcionario.endereco, funcionario.cpf, funcionario.cargo_id, funcionario.isAtivo, horario_inicio=None,
                horario_fim=None, dias_trabalho=None
            )
            return user_id
        except IntegrityError as e:
            error_message = str(e).lower()
            if "email" in error_message:
                raise HTTPException(status_code=400, detail="O e-mail fornecido já está cadastrado.")
            elif "cpf" in error_message:
                raise HTTPException(status_code=400, detail="O CPF fornecido já está cadastrado.")
            else:
                raise HTTPException(status_code=400, detail="Erro de integridade dos dados.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao cadastrar funcionário: {str(e)}")

    # --- FUNÇÃO MODIFICADA (REQ 2) ---
    def cadastrar_funcionario_completo(self, funcionario_data: FuncionarioCadastro):
        """
        Cadastra um novo funcionário e, se for Cargo 2, guarda as suas especialidades.
        """
        try:
            # Validação dos campos obrigatórios (AC3)
            if not funcionario_data.nome or not funcionario_data.nome.strip():
                raise HTTPException(status_code=400, detail="Nome é obrigatório e não pode ficar em branco.")
            if not funcionario_data.cargo_id:
                raise HTTPException(status_code=400, detail="Cargo é obrigatório.")
            if not funcionario_data.email:
                raise HTTPException(status_code=400, detail="E-mail é obrigatório.")
            if not funcionario_data.telefone or not funcionario_data.telefone.strip():
                raise HTTPException(status_code=400, detail="Telefone é obrigatório.")
            if not funcionario_data.horario_inicio or not funcionario_data.horario_fim:
                raise HTTPException(status_code=400, detail="Horários de trabalho são obrigatórios.")
            if not funcionario_data.dias_trabalho or not funcionario_data.dias_trabalho.strip():
                raise HTTPException(status_code=400, detail="Dias de trabalho são obrigatórios.")

            senha_hash = cria_hash_senha(funcionario_data.senha)

            # Cadastro no banco de dados (AC2)
            user_id = self.repo.cadastrar_funcionario(
                nome=funcionario_data.nome,
                email=funcionario_data.email,
                senha_hash=senha_hash,
                telefone=funcionario_data.telefone,
                endereco=funcionario_data.endereco or "Não informado",
                cpf=funcionario_data.cpf,
                cargo_id=funcionario_data.cargo_id,
                is_ativo=funcionario_data.is_ativo,
                horario_inicio=funcionario_data.horario_inicio,
                horario_fim=funcionario_data.horario_fim,
                dias_trabalho=funcionario_data.dias_trabalho,
                cargo_funcao=funcionario_data.cargo_funcao
            )

            # --- LÓGICA DE ESPECIALIDADE (REQ 2) ---
            # Se o cargo for "Funcionário" (ID 2) e especialidades foram enviadas
            if funcionario_data.especialidades is not None and funcionario_data.cargo_id == CARGO_FUNCIONARIO_ID:
                self.repo.atualizar_especialidades(user_id, funcionario_data.especialidades)
            # --- FIM DA LÓGICA ---

            return {
                "id": user_id,
                "message": f"Funcionário '{funcionario_data.nome}' cadastrado com sucesso!"
            }

        except IntegrityError as e:
            error_message = str(e).lower()
            if "email" in error_message:
                raise HTTPException(status_code=400, detail="O e-mail fornecido já está cadastrado.")
            elif "cpf" in error_message:
                raise HTTPException(status_code=400, detail="O CPF fornecido já está cadastrado.")
            else:
                raise HTTPException(status_code=400, detail="Erro de integridade dos dados.")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao cadastrar funcionário: {str(e)}")

    def listar_funcionarios(self):
        """
        Lista todos os funcionários (repo agora inclui especialidades).
        """
        try:
            funcionarios = self.repo.buscar_todos()
            return funcionarios
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao listar funcionários: {str(e)}")

    def buscar_funcionario_por_id(self, funcionario_id: int):
        """
        Busca um funcionário (repo agora inclui especialidades).
        """
        try:
            funcionario = self.buscar_pelo_id(funcionario_id)
            if not funcionario:
                raise HTTPException(status_code=404, detail="Funcionário não encontrado.")
            return funcionario
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao buscar funcionário: {str(e)}")

    # --- FUNÇÃO MODIFICADA (REQ 3) ---
    def atualizar_funcionario(self, funcionario_id: int, dados_atualizacao: FuncionarioUpdate):
        """
        Atualiza dados de um funcionário existente, incluindo especialidades (Req 3).
        """
        try:
            # 1. Separa as especialidades dos outros campos
            especialidades_para_atualizar = dados_atualizacao.especialidades

            # 2. Pega os outros campos que foram enviados (excluindo os que são None)
            campos_atualizacao = dados_atualizacao.model_dump(exclude_unset=True, exclude={'especialidades'})

            funcionario_atual = self.repo.procurar_pelo_id(funcionario_id)
            if not funcionario_atual:
                raise HTTPException(status_code=404, detail="Funcionário não encontrado.")

            # 3. Lógica de atualização de especialidades (Req 3)
            if especialidades_para_atualizar is not None:
                # O cargo final é o novo cargo (se enviado) ou o cargo antigo
                cargo_final = campos_atualizacao.get('cargo_id', funcionario_atual.get('cargo_id'))

                if cargo_final == CARGO_FUNCIONARIO_ID:
                    # Se for cargo "Funcionário", atualiza as especialidades
                    self.repo.atualizar_especialidades(funcionario_id, especialidades_para_atualizar)
                else:
                    # Se mudou para um cargo que não tem especialidade (ex: Gestor), limpa a lista
                    self.repo.atualizar_especialidades(funcionario_id, [])

            # 4. Verifica se há outros campos (além de especialidades) para atualizar
            if not campos_atualizacao:
                if especialidades_para_atualizar is not None:
                    # Só atualizou especialidades
                    funcionario_final = self.repo.procurar_pelo_id(funcionario_id)
                    return {
                        "funcionario": funcionario_final,
                        "message": "Especialidades atualizadas com sucesso!"
                    }
                else:
                    # Não enviou nada para atualizar
                    raise HTTPException(status_code=400, detail="Nenhum campo válido fornecido para atualização.")

            # 5. Atualiza os outros campos na tabela Funcionarios
            funcionario_atualizado_base = self.repo.atualizar_funcionario(funcionario_id, campos_atualizacao)

            if not funcionario_atualizado_base:
                raise HTTPException(status_code=404, detail="Erro ao atualizar funcionário.")

            # 6. Busca o funcionário completo novamente para retornar os dados corretos
            funcionario_final = self.repo.procurar_pelo_id(funcionario_id)

            return {
                "funcionario": funcionario_final,
                "message": "Funcionário atualizado com sucesso!"
            }

        except IntegrityError as e:
            error_message = str(e).lower()
            if "email" in error_message:
                raise HTTPException(status_code=400, detail="O e-mail fornecido já está cadastrado.")
            elif "cpf" in error_message:
                raise HTTPException(status_code=400, detail="O CPF fornecido já está cadastrado.")
            else:
                raise HTTPException(status_code=400, detail="Erro de integridade dos dados.")
        except HTTPException:
            raise
        except Exception as e:
            print(f"Erro geral ao atualizar funcionário: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Erro ao atualizar funcionário: {str(e)}")

    # --- NOVA FUNÇÃO ADICIONADA (REQ 5) ---
    def buscar_especialistas_por_servico(self, servico_id: int):
        """
        Retorna funcionários (ID, Nome) que são especialistas em um serviço (ou todos os funcionários do cargo 2).
        """
        try:
            especialistas = self.repo.buscar_especialistas_por_servico(servico_id)
            # Nota: Req 2 menciona "Serviços Gerais". Se quisermos que funcionários sem
            # especialidade apareçam aqui, a lógica no repositório precisa ser alterada.
            # Por enquanto, retorna apenas quem tem a especialidade exata.
            return especialistas
        except Exception as e:
            print(f"Erro ao buscar especialistas: {e}")
            raise HTTPException(status_code=500, detail="Erro ao buscar especialistas.")

    def esqueci_minha_senha(self, request_data: ForgotPasswordRequest):
        """
        Inicia o fluxo de recuperação de senha para um funcionário que não está logado.
        """
        try:
            user_db = self.repo.buscar_funcionario_pelo_email(request_data.email)
            if not user_db:
                print(
                    f"Tentativa de redefinição de senha para e-mail de funcionário não cadastrado: {request_data.email}")
                return {"message": "Se um usuário com este e-mail existir, um link de redefinição será enviado."}

            user_id, user_email = user_db
            token = secrets.token_urlsafe(32)
            expiracao = datetime.now(timezone.utc) + timedelta(minutes=15)

            self.repo.salvar_token_redefinicao(user_id, token, expiracao)

            link_redefinicao = f"http://localhost:3000/reset-password-funcionario?token={token}&email={user_email}"
            self.email_service.enviar_link_redefinicao(user_email, link_redefinicao)
            return {"message": "Se um usuário com este e-mail existir, um link de redefinição será enviado."}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

    def redefinir_senha_publica(self, request_data: RedefinirSenhaRequest):

        token_info = self.repo.buscar_token_redefinicao(request_data.token)

        if not token_info:
            raise HTTPException(status_code=400, detail="Token inválido ou expirado.")

        funcionario_id, email_associado, expiracao_token = token_info

        if datetime.now(timezone.utc) > expiracao_token:
            self.repo.invalidar_token_redefinicao(request_data.token)
            raise HTTPException(status_code=400, detail="Token inválido ou expirado.")

        senha_hashed = cria_hash_senha(request_data.nova_senha)
        self.repo.atualizar_senha_funcionario(funcionario_id, senha_hashed)
        self.repo.invalidar_token_redefinicao(request_data.token)

        return {"message": "Senha redefinida com sucesso!"}

    def desativar_funcionario(self, funcionario_id: int):
        """
        Desativa um funcionário, alterando seu status is_ativo para False.
        """
        try:
            funcionario_existente = self.repo.procurar_pelo_id(funcionario_id)
            if not funcionario_existente:
                raise HTTPException(status_code=404, detail="Funcionário não encontrado.")

            campos_atualizacao = {"is_ativo": False}
            funcionario_atualizado = self.repo.atualizar_funcionario(funcionario_id, campos_atualizacao)

            if not funcionario_atualizado:
                raise HTTPException(status_code=500, detail="Erro ao desativar funcionário.")

            return {"message": "Funcionário desativado com sucesso!"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao desativar funcionário: {str(e)}")

    def ativar_funcionario(self, funcionario_id: int):
        """
        Ativa um funcionário, alterando seu status is_ativo para True.
        """
        try:
            funcionario_existente = self.repo.procurar_pelo_id(funcionario_id)
            if not funcionario_existente:
                raise HTTPException(status_code=404, detail="Funcionário não encontrado.")

            campos_atualizacao = {"is_ativo": True}
            funcionario_atualizado = self.repo.atualizar_funcionario(funcionario_id, campos_atualizacao)

            if not funcionario_atualizado:
                raise HTTPException(status_code=500, detail="Erro ao ativar funcionário.")

            return {"message": "Funcionário ativado com sucesso!"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao ativar funcionário: {str(e)}")