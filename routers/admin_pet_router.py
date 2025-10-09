from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from seguranca import decodifica_token
from modelos import PetUpdate
from services.pet_service import ServicosPet

router = APIRouter(prefix="/admin", tags=["Admin - Pets"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def pegar_servicos_pet():
    return ServicosPet()

@router.get("/pets", status_code=status.HTTP_200_OK)
async def listar_todos_pets(
    token: Annotated[str, Depends(oauth2_scheme)],
    service: ServicosPet = Depends(pegar_servicos_pet)
):
    """
    Endpoint para gestores visualizarem todos os pets cadastrados no sistema.
    Apenas gestores e administradores têm acesso a esta funcionalidade.
    """
    token_data = decodifica_token(token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado"
        )
    
    user_type = token_data.get("tipo")
    cargo_id = token_data.get("cargo_id")
    
    # Verificar se é funcionário
    if user_type != "funcionario":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Apenas funcionários podem acessar esta funcionalidade."
        )
    
    # Verificar se tem permissão de gestor/admin (cargos 1, 2, 405, 524)
    cargos_admin = [1, 2, 405, 524]
    
    if cargo_id not in cargos_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Apenas gestores podem visualizar todos os pets do sistema."
        )
    
    try:
        pets = service.listar_todos_pets_para_gestor()
        return pets
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Erro ao buscar pets: {str(e)}"
        )

@router.put("/pets/{pet_id}", status_code=status.HTTP_200_OK)
async def atualizar_pet_gestor(
    pet_id: int,
    pet_dados: PetUpdate,
    token: Annotated[str, Depends(oauth2_scheme)],
    service: ServicosPet = Depends(pegar_servicos_pet)
):
    """
    Endpoint para gestores atualizarem informações de qualquer pet do sistema.
    Apenas gestores e administradores têm acesso a esta funcionalidade.
    """
    token_data = decodifica_token(token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado"
        )
    
    user_type = token_data.get("tipo")
    cargo_id = token_data.get("cargo_id")
    
    # Verificar se é funcionário
    if user_type != "funcionario":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Apenas funcionários podem acessar esta funcionalidade."
        )
    
    # Verificar se tem permissão de gestor/admin (cargos 1, 2, 405, 524)
    cargos_admin = [1, 2, 405, 524]
    
    if cargo_id not in cargos_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Apenas gestores podem editar pets do sistema."
        )
    
    try:
        pet_atualizado = service.atualizar_pet_gestor(pet_id, pet_dados)
        return pet_atualizado
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Erro ao atualizar pet: {str(e)}"
        )
