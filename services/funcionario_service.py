from fastapi import HTTPException
from psycopg2 import IntegrityError
from seguranca import cria_hash_senha, verifica_senha, cria_token_de_acesso
from repositories.funcionario_repository import RepositorioFuncionario

class ServicosFuncionario:
    def __init__(self):
        self.repo = RepositorioFuncionario()

    def login(self, dados_login):
        """
        Login de funcionário
        """
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
            raise  # Re-raise HTTPExceptions
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro interno no login de funcionário: {str(e)}")

    def buscar_pelo_id(self, user_id: int):
        """
        Retorna dados completos do funcionário
        """
        try:
            user_data = self.repo.procurar_pelo_id(user_id)
            if not user_data:
                return None

            # Garantir que user_data é um dicionário
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
                # Se for uma tupla (fallback para compatibilidade)
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

