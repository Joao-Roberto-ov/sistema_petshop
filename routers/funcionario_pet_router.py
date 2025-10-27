from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from modelos import PetCadastroFuncionario
from services.pet_service import ServicosPet
from seguranca import verificar_permissao_atendente

router = APIRouter(prefix="/api/funcionario", tags=["Funcionario - Pets"])

def pegar_servicos_pet():
    return ServicosPet()

@router.post("/pets", status_code=status.HTTP_201_CREATED)
async def cadastrar_pet_por_funcionario(
    pet_dados: PetCadastroFuncionario,
    atendente_id: Annotated[int, Depends(verificar_permissao_atendente)],
    service: ServicosPet = Depends(pegar_servicos_pet)
):
    try:
        service.cadastrar_pet_funcionario(pet_dados)
        return {"Aviso": f"Pet '{pet_dados.nome}' cadastrado com sucesso para o cliente!"}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erro interno em cadastrar_pet_por_funcionario: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno.")