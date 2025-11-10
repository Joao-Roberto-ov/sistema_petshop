from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from seguranca import verifica_token
from models.despesa_model import DespesaModel
from services.despesa_service import DespesaService
from typing import List
from datetime import date

router = APIRouter(prefix="/admin/despesas", tags=["Despesas"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

# ------------------- CRIAR DESPESA -------------------
@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_despesa(despesa: DespesaModel, token: str = Depends(oauth2_scheme)):
    verifica_token(token)
    try:
        DespesaService.criar(despesa)
        return {"message": "Despesa registrada com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------------------- LISTAR TODAS -------------------
@router.get("/", response_model=list[DespesaModel])
def listar_despesas(token: str = Depends(oauth2_scheme)):
    verifica_token(token)
    try:
        return DespesaService.listar_todas()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------------------- LISTAR POR ID -------------------
@router.get("/{despesa_id}", response_model=DespesaModel)
def buscar_despesa(despesa_id: int, token: str = Depends(oauth2_scheme)):
    verifica_token(token)
    despesa = DespesaService.buscar_por_id(despesa_id)
    if not despesa:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    return despesa

# ------------------- LISTAR POR PERÍODO -------------------
@router.get("", status_code=200)
def listar_despesas(
    data_inicio: date | None = Query(None),
    data_fim: date | None = Query(None)
):
    """
    Lista todas as despesas ou filtra por período (data_inicio e data_fim)
    """
    if data_inicio and data_fim:
        return DespesaService.listar_por_periodo(data_inicio, data_fim)
    return DespesaService.listar_todas()

# ------------------- EDITAR -------------------
@router.put("/{despesa_id}")
def editar_despesa(despesa_id: int, despesa: DespesaModel, token: str = Depends(oauth2_scheme)):
    verifica_token(token)
    try:
        DespesaService.editar(despesa_id, despesa)
        return {"message": "Despesa atualizada com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------------------- EXCLUIR -------------------
@router.delete("/{despesa_id}")
def deletar_despesa(despesa_id: int, token: str = Depends(oauth2_scheme)):
    verifica_token(token)
    try:
        DespesaService.deletar(despesa_id)
        return {"message": "Despesa excluída com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
