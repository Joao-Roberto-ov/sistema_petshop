# Petshop_GP/services/funcionario_service.py (Versão de depuração final)

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

    def login(self, dados_login):
        print("\n--- INICIANDO TENTATIVA DE LOGIN DE FUNCIONÁRIO ---")
        print(f"1. Buscando funcionário com email: {dados_login.email}")
        try:
            resultado = self.repo.buscar_pelo_email(dados_login.email)

            if not resultado:
                print("   [FALHA] Nenhum funcionário encontrado com este email.")
                raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

            print("   [SUCESSO] Funcionário encontrado no banco.")
            user_id, senha_hashed_do_banco = resultado

            print("2. Verificando a senha...")
            if not verifica_senha(dados_login.senha, senha_hashed_do_banco):
                print("   [FALHA] A senha digitada não corresponde ao hash.")
                raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

            print("   [SUCESSO] Senha verificada com sucesso.")

            print(f"3. Buscando dados completos do funcionário com ID: {user_id}")
            dados_usuario = self.buscar_pelo_id(user_id)

            if not dados_usuario:
                print("   [FALHA] Não foi possível buscar os dados completos do funcionário (verifique o cargo_id).")
                raise HTTPException(status_code=404, detail="Funcionário não encontrado após verificação.")

            print("   [SUCESSO] Dados completos do funcionário obtidos.")
            print(f"   Dados obtidos: {dados_usuario}")

            print("4. Verificando se o funcionário está ativo...")
            if not dados_usuario.get("is_ativo"):
                print("   [FALHA] O funcionário está marcado como inativo.")
                raise HTTPException(status_code=403, detail="Funcionário inativo")

            print("   [SUCESSO] Funcionário está ativo.")

            print("5. Criando token de acesso...")
            token = cria_token_de_acesso(data={
                "sub": str(user_id),
                "role": dados_usuario.get("cargo", "funcionario")
            })
            print("   [SUCESSO] Token criado. Login de funcionário bem-sucedido!")

            return {
                "access_token": token,
                "token_type": "bearer",
                "user": dados_usuario
            }

        except HTTPException as http_exc:
            # Apenas repassa a exceção HTTP para a próxima camada
            raise http_exc
        except Exception as e:
            # Captura qualquer outro erro inesperado
            print(f"\n[ERRO INESPERADO NO SERVIÇO DE FUNCIONÁRIO] Ocorreu uma exceção não tratada: {e}\n")
            raise HTTPException(status_code=500, detail=f"Erro interno inesperado no login de funcionário: {str(e)}")

    def buscar_pelo_id(self, user_id: int):
        """
        Função simplificada e robusta para buscar dados do funcionário.
        """
        try:
            user_data = self.repo.procurar_pelo_id(user_id)
            return user_data
        except Exception as e:
            print(f"[ERRO] Falha na função 'buscar_pelo_id' do serviço: {e}")
            # Retorna None para que a lógica de login possa tratar a falha
            return None

    # O resto do arquivo permanece igual
    def cadastrar_funcionario(self, nome, email, senha, telefone, endereco, cpf, cargo_id, is_ativo=True):
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

        senha_hashed = pwd_context.hash(request_data.nova_senha)
        self.repo.atualizar_senha_funcionario(funcionario_id, senha_hashed)
        self.repo.invalidar_token_redefinicao(request_data.token)

        return {"message": "Senha redefinida com sucesso!"}