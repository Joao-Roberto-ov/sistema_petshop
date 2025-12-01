from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from seguranca import decodifica_token
from modelos import PetUpdate, PetTransferencia  # Adicione PetTransferencia aqui
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
    Endpoint para gestores e veterinários visualizarem todos os pets cadastrados no sistema.
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
    
    # Verificar se tem permissão de gestor ou veterinário
    cargos_permitidos = [1, 3]  # Gestor (1) e Veterinário (3)
    
    if cargo_id not in cargos_permitidos:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Apenas gestores e veterinários podem visualizar todos os pets do sistema."
        )
    
    try:
        pets = service.listar_todos_pets_para_gestor()
        return pets
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Erro ao buscar pets: {str(e)}"
        )

@router.post("/pets/transferir", status_code=status.HTTP_200_OK)
async def transferir_pet(
    transferencia_dados: PetTransferencia,
    token: Annotated[str, Depends(oauth2_scheme)],
    service: ServicosPet = Depends(pegar_servicos_pet)
):
    """
    Endpoint para gestores transferirem a posse de um pet para outro cliente.
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
    
    # Verificar se tem permissão de gestor (APENAS gestor pode transferir)
    if cargo_id != 1:  # Apenas Gestor (cargo_id = 1)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Apenas gestores podem transferir pets entre clientes."
        )
    
    try:
        service.transferir_pet(transferencia_dados.pet_id, transferencia_dados.novo_cliente_id)
        return {"Aviso": f"Pet ID {transferencia_dados.pet_id} transferido com sucesso para o Cliente ID {transferencia_dados.novo_cliente_id}."}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Erro ao transferir pet: {str(e)}"
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
    APENAS gestores têm acesso a esta funcionalidade.
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
    
    # Verificar se tem permissão de gestor (APENAS gestor pode editar)
    if cargo_id != 1:  # Apenas Gestor (cargo_id = 1)
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

@router.get("/pets/{pet_id}/history", status_code=status.HTTP_200_OK)
async def buscar_historico_pet_gestor(
    pet_id: int,
    token: Annotated[str, Depends(oauth2_scheme)],
    service: ServicosPet = Depends(pegar_servicos_pet)
):
    """
    Endpoint para gestores e veterinários visualizarem histórico de qualquer pet.
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
    
    # Verificar se tem permissão de gestor ou veterinário
    cargos_permitidos = [1, 3]  # Gestor (1) e Veterinário (3)
    
    if cargo_id not in cargos_permitidos:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Apenas gestores e veterinários podem visualizar histórico de pets."
        )
    
    try:
        # Verificar se o pet existe
        pet_existe = service.repo.verificar_pet_existe(pet_id)
        if not pet_existe:
            raise HTTPException(status_code=404, detail="Pet não encontrado.")

        # Buscar histórico
        consultas_data = service.repo.buscar_consultas_por_pet_id(pet_id)
        servicos_data = service.repo.buscar_servicos_por_pet_id(pet_id)

        consultas = [
            {
                "servico_realizado": c[0], 
                "funcionario": c[1], 
                "data_hora": c[2].isoformat() if c[2] else None, 
                "valor": float(c[3]) if c[3] else 0
            }
            for c in consultas_data
        ]
        servicos = [
            {
                "servico_realizado": s[0], 
                "funcionario": s[1], 
                "data_hora": s[2].isoformat() if s[2] else None, 
                "valor": float(s[3]) if s[3] else 0
            }
            for s in servicos_data
        ]
        
        return {"consultas": consultas, "servicos": servicos}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erro ao buscar histórico do pet: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Erro ao buscar histórico do pet: {str(e)}"
        )