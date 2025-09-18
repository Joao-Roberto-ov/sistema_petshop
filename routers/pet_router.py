from fastapi import APIRouter, Depends, HTTPException
from modelos import PetCadastro
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