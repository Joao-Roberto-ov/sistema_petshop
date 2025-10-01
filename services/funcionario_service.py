from fastapi import HTTPException
from psycopg2 import IntegrityError
from seguranca import cria_hash_senha, verifica_senha, cria_token_de_acesso
from repositories.funcionario_repository import RepositorioFuncionario
from services.email_service import EmailService
from modelos import ForgotPasswordRequest, RedefinirSenhaRequest
import secrets
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ServicosFuncionario:
    def __init__(self):
        self.repo = RepositorioFuncionario()
        self.email_service = EmailService()

    #login funcionario
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
                "role": dados_usuario.get("cargo", "funcionario")
            })

            return {
                "access_token": token,
                "token_type": "bearer",
                "user": dados_usuario
            }
        
        except HTTPException:
            raise  #re-raise httpexceptions
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro interno no login de funcionário: {str(e)}")

    #retorna os dados do funcionario
    def buscar_pelo_id(self, user_id: int):
        try:
            user_data = self.repo.procurar_pelo_id(user_id)
            if not user_data:
                return None

            #ele está garantindo que user_data é um dicionario para facilitar a validaçao
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
                #se for uma tupla (fallback para compatibilidade)
                return {
                    "id": user_data[0] if len(user_data) > 0 else None,
                    "nome": user_data[1] if len(user_data) > 1 else None,
                    "email": user_data[2] if len(user_data) > 2 else None,
                    "telefone": user_data[3] if len(user_data) > 3 else None,
                    "endereco": user_data[4] if len(user_data) > 4 and user_data[4] else "Não informado",
                    "cpf": user_data[5] if len(user_data) > 5 else None,
                    "cargo_id": user_data[6] if len(user_data) > 6 else None,
                    "cargo": user_data[7] if len(user_data) > 7 else "funcionario",
                    "is_ativo": user_data[8] if len(user_data) > 8 else True
                }
        
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao buscar funcionário: {str(e)}")

    def cadastrar_funcionario(self, nome, email, senha, telefone, endereco, cpf, cargo_id, is_ativo=True):
        """
        Cadastra um novo funcionário
        """
        try:
            senha_hash = cria_hash_senha(senha)
            user_id = self.repo.cadastrar_funcionario(
                nome, email, senha_hash, telefone, endereco, cpf, cargo_id, is_ativo
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
            
            #armazena o token no banco de dados associado ao funcionário
            self.repo.salvar_token_redefinicao(user_id, token, expiracao)

            #AC1: envia o e-mail com o link de redefinição
            #AC2: e-mail não revela a senha atual
            #AC4: link deve ser de uso único e com prazo de expiração
            #AC5: link deve direcionar para a página de redefinição de senha
            link_redefinicao = f"http://localhost:3000/reset-password-funcionario?token={token}&email={user_email}" # Exemplo de URL
            self.email_service.enviar_link_redefinicao(user_email, link_redefinicao)
            return {"message": "Se um usuário com este e-mail existir, um link de redefinição será enviado."}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

    def redefinir_senha_publica(self, request_data: RedefinirSenhaRequest):

        #procura o token e o email associado no banco de dados
        token_info = self.repo.buscar_token_redefinicao(request_data.token)
        
        if not token_info:
            raise HTTPException(status_code=400, detail="Token inválido ou expirado.")
        
        funcionario_id, email_associado, expiracao_token = token_info

        if datetime.now(timezone.utc) > expiracao_token:
            self.repo.invalidar_token_redefinicao(request_data.token) #invalida o token expirado
            raise HTTPException(status_code=400, detail="Token inválido ou expirado.")
        
        # gera o hash da nova senha antes de salvar
        senha_hashed = pwd_context.hash(request_data.nova_senha)
        self.repo.atualizar_senha_funcionario(funcionario_id, senha_hashed)
        self.repo.invalidar_token_redefinicao(request_data.token) #invalida o token após o uso
        
        return {"message": "Senha redefinida com sucesso!"}

