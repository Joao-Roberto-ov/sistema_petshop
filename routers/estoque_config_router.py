from fastapi import APIRouter, HTTPException, status, Depends
from services.estoque_config_service import EstoqueConfigService
from models.estoque_minimo import EstoqueMinimoConfig
from seguranca import verificar_permissao_admin
from typing import Annotated
router = APIRouter(
    prefix="/api/admin/config/estoque-minimo",
    tags=["Configuração de Estoque"]
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def configurar_estoque_minimo(dados: EstoqueMinimoConfig, 
    funcionario_id: Annotated[int, Depends(verificar_permissao_admin)]):
    if dados.estoque_minimo < 0:
        raise HTTPException(status_code=400, detail="O estoque mínimo não pode ser negativo.")

    resultado = EstoqueConfigService.configurar_estoque_minimo(
        produto_id=dados.produto_id,
        estoque_minimo=dados.estoque_minimo
    )

    return {
        "message": "Estoque mínimo configurado com sucesso!",
        "produto_id": dados.produto_id,
        "estoque_minimo": resultado["estoque_minimo"]
    }


@router.put("/{produto_id}", status_code=status.HTTP_200_OK)
def atualizar_estoque_minimo(produto_id: int, dados: EstoqueMinimoConfig, 
    funcionario_id: Annotated[int, Depends(verificar_permissao_admin)]):
    if dados.estoque_minimo < 0:
        raise HTTPException(status_code=400, detail="O estoque mínimo não pode ser negativo.")

    resultado = EstoqueConfigService.configurar_estoque_minimo(
        produto_id=produto_id,
        minimo=dados.estoque_minimo
    )
    return {"message": "Estoque mínimo atualizado com sucesso!", **resultado}



@router.get("/{produto_id}")
def obter_estoque_minimo(produto_id: int, 
    funcionario_id: Annotated[int, Depends(verificar_permissao_admin)]):
    minimo = EstoqueConfigService.obter_estoque_minimo(produto_id)

    if minimo is None:
        return {"produto_id": produto_id, "estoque_minimo": None}

    return {
        "produto_id": produto_id,
        "estoque_minimo": minimo
    }


@router.get("/")
def listar_todos_estoques_minimos(
    funcionario_id: Annotated[int, Depends(verificar_permissao_admin)]):
    return EstoqueConfigService.listar_todos()
