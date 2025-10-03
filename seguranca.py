import os
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "uma_chave_secreta_padrao_para_testes")
ALGORITMO = "HS256"
TEMPO_EXPIRACAO_TOKEN = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def verifica_senha(senha_usuario: str, senha_hashed: str) -> bool:
    return pwd_context.verify(senha_usuario, senha_hashed)

def cria_hash_senha(senha: str) -> str:
    return pwd_context.hash(senha)

def cria_token_de_acesso(data: dict) -> str:
    dados_codificar = data.copy()
    expiracao = datetime.now(timezone.utc) + timedelta(minutes=TEMPO_EXPIRACAO_TOKEN)
    dados_codificar.update({"exp": expiracao})
    token_jwt_codificado = jwt.encode(dados_codificar, SECRET_KEY, algorithm=ALGORITMO)
    return token_jwt_codificado

def verifica_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITMO])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        return None

async def pegar_id_do_usuario_logado(token: str = Depends(oauth2_scheme)) -> int:
    user_id = verifica_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return int(user_id)



def decodifica_token(token: str) -> Optional[dict]:
    try:
        print(f"=== DECODIFICANDO TOKEN ===")
        print(f"Token recebido: {token[:20]}...")  # Mostra apenas os primeiros 20 caracteres
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITMO])
        print(f"✅ Token decodificado com sucesso: {payload}")
        return payload
    except JWTError as e:
        print(f"❌ Erro ao decodificar token: {e}")
        return None


from repositories.funcionario_repository import RepositorioFuncionario
from util.cargos import Cargo

async def verificar_permissao_admin(token: str = Depends(oauth2_scheme)) -> int:
    payload = decodifica_token(token)
    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    user_type = payload.get("tipo")

    if user_id is None or user_type is None:
        raise HTTPException(
            status_code=401,
            detail="Token inválido: informações de usuário ausentes",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user_type != "funcionario":
        raise HTTPException(
            status_code=403,
            detail="Acesso negado: Apenas funcionários podem realizar esta ação",
        )
    
    # Sempre busca no banco de dados para garantir que o cargo é o mais atualizado
    repo_funcionario = RepositorioFuncionario()
    funcionario_data = repo_funcionario.procurar_pelo_id(int(user_id))

    # Verificar pelos IDs corretos dos cargos administrativos
    cargos_admin = [1, 2, 405, 524]  # Todos os IDs que são considerados administradores
    
    if not funcionario_data or funcionario_data.get("cargo_id") not in cargos_admin:
        raise HTTPException(
            status_code=403,
            detail="Acesso negado: Apenas administradores podem realizar esta ação",
        )

    return int(user_id)


