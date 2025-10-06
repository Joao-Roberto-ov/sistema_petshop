from fastapi import HTTPException
from psycopg2 import IntegrityError
from seguranca import cria_hash_senha, verifica_senha, cria_token_de_acesso
from repositories.funcionario_repository import RepositorioFuncionario
from services.email_service import EmailService
from modelos import ForgotPasswordRequest, RedefinirSenhaRequest, FuncionarioCadastroPorAdmin
import secrets
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
        try:
            user_data = self.repo.procurar_pelo_id(user_id)
            if not user_data:
                return None

            if isinstance(user_data, dict):
                return {
                    "id": user_data.get("id"),
                    "nome": user_data.get("nome"),
                    "email": user_data.get("email"),
                    "telefone": user_data.get("telefone"),
                    "endereco": user_data.get("endereco") if user_data.get("endereco") else "Não informado",
                    "cpf": user_data.get("cpf"),
                    "cargo_id": user_data.get("cargo_id"),
                    "cargo": user_data.get("cargo"),
                    "is_ativo": user_data.get("is_ativo", True)
                }
            else:
                return {
                    "id": user_data[0] if len(user_data) > 0 else None,
                    "nome": user_data[1] if len(user_data) > 1 else None,
                    "email": user_data[2] if len(user_data) > 2 else None,
                    "telefone": user_data[3] if len(user_data) > 3 else None,
                    "endereco": user_data[4] if len(user_data) > 4 and user_data[4] else "Não informado",
                    "cpf": user_data[5] if len(user_data) > 5 and user_data[5] else None,
                    "cargo_id": user_data[6] if len(user_data) > 6 else None,
                    "cargo": user_data[7] if len(user_data) > 7 else "funcionario",
                    "is_ativo": user_data[8] if len(user_data) > 8 else True
                }
        
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao buscar funcionário: {str(e)}")

    def cadastrar_funcionario(self, nome, email, senha, telefone, endereco, cpf, cargo_id, is_ativo=True, horario_inicio=None, horario_fim=None, dias_trabalho=None):
        """
        Cadastra um novo funcionário
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
        Cadastra um novo funcionário por um administrador.
        """
        try:
            senha_hash = cria_hash_senha(funcionario.senha)
            user_id = self.repo.criar_funcionario_admin(
                funcionario.nome, funcionario.email, senha_hash, funcionario.telefone,
                funcionario.endereco, funcionario.cpf, funcionario.cargo_id, funcionario.isAtivo, horario_inicio=None, horario_fim=None, dias_trabalho=None
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



    def cadastrar_funcionario_completo(self, funcionario_data):
        """
        Cadastra um novo funcionário com todos os campos obrigatórios incluindo horários de trabalho.
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
                dias_trabalho=funcionario_data.dias_trabalho
            )
            
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
        Lista todos os funcionários cadastrados (AC2 - disponível para consultas).
        """
        try:
            funcionarios = self.repo.buscar_todos()
            return funcionarios
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao listar funcionários: {str(e)}")

    def buscar_funcionario_por_id(self, funcionario_id: int):
        """
        Busca um funcionário específico por ID (AC2 - disponível para consultas).
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

    def atualizar_funcionario(self, funcionario_id: int, dados_atualizacao):
        """
        Atualiza dados de um funcionário existente.
        """
        try:
            campos_atualizacao = {}
            
            if dados_atualizacao.nome is not None:
                if not dados_atualizacao.nome.strip():
                    raise HTTPException(status_code=400, detail="Nome não pode ficar em branco.")
                campos_atualizacao["nome"] = dados_atualizacao.nome
            
            if dados_atualizacao.cargo_id is not None:
                if dados_atualizacao.cargo_id not in [1, 2, 3, 4]:
                    raise HTTPException(status_code=400, detail="ID do cargo inválido. Os IDs válidos são 1 (Gestor), 2 (Funcionário), 3 (Veterinário) ou 4 (Atendente).")
                campos_atualizacao["cargo_id"] = dados_atualizacao.cargo_id
            
            if dados_atualizacao.email is not None:
                campos_atualizacao["email"] = dados_atualizacao.email
            
            if dados_atualizacao.telefone is not None:
                campos_atualizacao["telefone"] = dados_atualizacao.telefone
            
            if dados_atualizacao.cpf is not None:
                campos_atualizacao["cpf"] = dados_atualizacao.cpf
            
            if dados_atualizacao.endereco is not None:
                campos_atualizacao["endereco"] = dados_atualizacao.endereco
            
            if dados_atualizacao.horario_inicio is not None:
                campos_atualizacao["horario_inicio"] = dados_atualizacao.horario_inicio
            
            if dados_atualizacao.horario_fim is not None:
                campos_atualizacao["horario_fim"] = dados_atualizacao.horario_fim
            
            if dados_atualizacao.dias_trabalho is not None:
                campos_atualizacao["dias_trabalho"] = dados_atualizacao.dias_trabalho
            
            if dados_atualizacao.is_ativo is not None:
                campos_atualizacao["is_ativo"] = dados_atualizacao.is_ativo

            if not campos_atualizacao:
                raise HTTPException(status_code=400, detail="Nenhum campo válido fornecido para atualização.")
            
            funcionario_atual = self.repo.procurar_pelo_id(funcionario_id)
            if not funcionario_atual:
                raise HTTPException(status_code=404, detail="Funcionário não encontrado.")
            
            campos_finais = {}
            for campo, valor in campos_atualizacao.items():
                valor_atual = funcionario_atual.get(campo)
                
                if isinstance(valor_atual, str):
                    valor_atual = valor_atual.strip().lower() if valor_atual else ""
                    valor_comparar = str(valor).strip().lower() if valor else ""
                else:
                    valor_comparar = valor
                
                if valor_atual != valor_comparar:
                    campos_finais[campo] = valor
            
            if not campos_finais:
                return {
                    "funcionario": funcionario_atual,
                    "message": "Nenhuma alteração necessária - dados já estão atualizados"
                }
            
            print(f"Campos que serão atualizados: {campos_finais}")
            
            funcionario_atualizado = self.repo.atualizar_funcionario(funcionario_id, campos_finais)
            
            if not funcionario_atualizado:
                raise HTTPException(status_code=404, detail="Funcionário não encontrado.")
            
            return {
                "funcionario": funcionario_atualizado,
                "message": "Funcionário atualizado com sucesso!"
            }
            
        except IntegrityError as e:
            error_message = str(e).lower()
            print(f"ERRO DE INTEGRIDADE DETALHADO: {error_message}")
            
            if "email" in error_message:
                raise HTTPException(status_code=400, detail="O e-mail fornecido já está cadastrado.")
            elif "cpf" in error_message:
                raise HTTPException(status_code=400, detail="O CPF fornecido já está cadastrado.")
            else:
                # Log mais detalhado para debug
                print(f"Erro de integridade não tratado: {e}")
                raise HTTPException(status_code=400, detail="Erro de integridade dos dados. Possível conflito com dados existentes.")
        except HTTPException:
            raise
        except Exception as e:
            print(f"Erro geral ao atualizar funcionário: {e}")
            raise HTTPException(status_code=500, detail=f"Erro ao atualizar funcionário: {str(e)}")

    def esqueci_minha_senha(self, request_data: ForgotPasswordRequest):
        """
        Inicia o fluxo de recuperação de senha para um funcionário que não está logado.
        """
        try:
            user_db = self.repo.buscar_funcionario_pelo_email(request_data.email)
            if not user_db:
                # AC3: mensagem padrao para evitar enumeraçao de usuarios
                print(f"Tentativa de redefinição de senha para e-mail de funcionário não cadastrado: {request_data.email}")
                return {"message": "Se um usuário com este e-mail existir, um link de redefinição será enviado."}

            user_id, user_email = user_db
            token = secrets.token_urlsafe(32) #gera um token seguro
            expiracao = datetime.now(timezone.utc) + timedelta(minutes=15) # AC4: o token acaba em 15 minutos
            
            self.repo.salvar_token_redefinicao(user_id, token, expiracao)

            #AC1: envia o e-mail com o link de redefinição
            #AC2: e-mail não revela a senha atual
            #AC4: link deve ser de uso único e com prazo de expiração
            #AC5: link deve direcionar para a página de redefinição de senha
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

