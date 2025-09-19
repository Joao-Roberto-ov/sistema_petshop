from fastapi import APIRouter, Depends, HTTPException
from modelos import PetCadastro, PetUpdate
from services.pet_service import ServicosPet
from seguranca import pegar_id_do_usuario_logado

router = APIRouter(prefix="/api", tags=["Pets"])

def pegar_servicos_pet():
    return ServicosPet()

@router.post("/pets", status_code=201)
async def rota_cadastrar_pet(
        pet_dados: PetCadastro,
        service: ServicosPet = Depends(pegar_servicos_pet),
        current_user_id: int = Depends(pegar_id_do_usuario_logado)
):
    try:
        service.cadastrar_pet(pet_dados, current_user_id)
        return {"Aviso": f"'{pet_dados.nome}' cadastrado com sucesso!"}
    except HTTPException as e:
        raise e

    except Exception as e:
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno.")

@router.get("/pets")
async def rota_listar_pets_do_usuario(
        service: ServicosPet = Depends(pegar_servicos_pet),
        current_user_id: int = Depends(pegar_id_do_usuario_logado)
):
    return service.listar_pets_do_cliente(current_user_id)

@router.get("/pets/{pet_id}/history")

async def rota_buscar_historico_do_pet(
        pet_id: int,
        service: ServicosPet = Depends(pegar_servicos_pet),
        current_user_id: int = Depends(pegar_id_do_usuario_logado)
):
    return service.buscar_historico_do_pet(pet_id, current_user_id)

@router.put("/pets/{pet_id}")
async def rota_atualizar_pet(

        pet_id: int,
        pet_dados: PetUpdate,
        service: ServicosPet = Depends(pegar_servicos_pet),
        current_user_id: int = Depends(pegar_id_do_usuario_logado)
):
    try:
        pet_atualizado = service.atualizar_pet(pet_id, pet_dados, current_user_id)
        return pet_atualizado

    except HTTPException as e:
        raise e

    except Exception as e:
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno ao atualizar o pet.")