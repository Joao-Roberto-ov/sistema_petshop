from fastapi import APIRouter, Depends, HTTPException
from modelos import PetCadastro, PetUpdate
from services.pet_service import ServicosPet
from seguranca import (
    pegar_id_do_usuario_logado,
    verificar_permissao_veterinario,
    verificar_permissao_gestor,
    pegar_payload_do_usuario_logado,
    verificar_permissao_funcionario # Importante: adicionei essa importação
)

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

# --- NOVA ROTA PARA O FUNCIONÁRIO/SISTEMA BUSCAR PETS DE UM CLIENTE ---
@router.get("/pets/cliente/{cliente_id}")
async def rota_listar_pets_de_cliente_especifico(
    cliente_id: int,
    service: ServicosPet = Depends(pegar_servicos_pet),
    # Apenas funcionários podem ver pets de outros clientes dessa forma
    funcionario_id: int = Depends(verificar_permissao_funcionario)
):
    """
    Lista os pets de um cliente específico (Usado na tela de Vendas/Agendamento)
    """
    try:
        return service.listar_pets_do_cliente(cliente_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao buscar pets do cliente.")
# -----------------------------------------------------------------------

@router.get("/pets/{pet_id}/history")
async def rota_buscar_historico_do_pet(
        pet_id: int,
        service: ServicosPet = Depends(pegar_servicos_pet),
        user_payload: dict = Depends(pegar_payload_do_usuario_logado)
):
    current_user_id = user_payload.get("sub")
    user_type = user_payload.get("tipo")
    return service.buscar_historico_do_pet(pet_id, current_user_id, user_type)

@router.put("/pets/{pet_id}")
async def rota_atualizar_pet(
        pet_id: int,
        pet_dados: PetUpdate,
        service: ServicosPet = Depends(pegar_servicos_pet),
        user_payload: dict = Depends(pegar_payload_do_usuario_logado)
):
    try:
        current_user_id = user_payload.get("sub")
        user_type = user_payload.get("tipo")
        pet_atualizado = service.atualizar_pet(pet_id, pet_dados, current_user_id, user_type)
        return pet_atualizado
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno ao atualizar o pet.")

@router.delete("/pets/{pet_id}")
async def rota_excluir_pet(
        pet_id: int,
        service: ServicosPet = Depends(pegar_servicos_pet),
        current_user_id: int = Depends(pegar_id_do_usuario_logado)
):
    try:
        service.excluir_pet(pet_id, current_user_id)
        return {"message": "Pet excluído com sucesso"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno ao excluir o pet.")

@router.get("/pets/all")
async def rota_listar_todos_pets(
        service: ServicosPet = Depends(pegar_servicos_pet),
        current_user_id: int = Depends(verificar_permissao_veterinario) # Gestor e Veterinário
):
    try:
        pets = service.listar_todos_pets_para_funcionario(current_user_id)
        return pets
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno ao listar todos os pets.")