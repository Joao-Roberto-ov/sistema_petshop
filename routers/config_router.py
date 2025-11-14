from fastapi import APIRouter, HTTPException, status, Depends
from typing import Annotated
from fastapi.security import OAuth2PasswordBearer
from services.config_service import ConfigService
from models.config_model import ConfigEmpresa, HorarioFuncionamento
from seguranca import decodifica_token

router = APIRouter(prefix="/admin/config", tags=["Configuração"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


# ------------------- CONFIGURAÇÃO GERAL -------------------

@router.get("/", status_code=status.HTTP_200_OK)
async def get_config():
    try:
        config = ConfigService.get_config()
        return config
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/", status_code=status.HTTP_200_OK)
async def update_config(data: ConfigEmpresa, token: Annotated[str, Depends(oauth2_scheme)]):
    token_data = decodifica_token(token)
    if not token_data or token_data.get("tipo") != "funcionario" or token_data.get("cargo_id") not in [1, 2]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")

    try:
        return ConfigService.update_config(data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ------------------- HORÁRIOS DE FUNCIONAMENTO -------------------

@router.get("/horarios", status_code=status.HTTP_200_OK)
async def listar_horarios(token: Annotated[str, Depends(oauth2_scheme)]):
    token_data = decodifica_token(token)
    if not token_data or token_data.get("tipo") != "funcionario" or token_data.get("cargo_id") not in [1, 2]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")

    try:
        return ConfigService.get_horarios()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/horarios/{id}", status_code=status.HTTP_200_OK)
async def atualizar_horario(id: int, data: HorarioFuncionamento, token: Annotated[str, Depends(oauth2_scheme)]):
    token_data = decodifica_token(token)
    if not token_data or token_data.get("tipo") != "funcionario" or token_data.get("cargo_id") not in [1, 2]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")

    try:
        return ConfigService.update_horario(id, data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))