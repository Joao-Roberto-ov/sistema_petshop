from fastapi import APIRouter, Depends, HTTPException
from services.checkout_service import CheckoutService
from models.checkout_model import CheckoutRequest, CheckoutResponse

router = APIRouter(prefix="/api/checkout", tags=["Checkout"])

@router.post("", response_model=CheckoutResponse)
async def finalizar_checkout(dados: CheckoutRequest, service: CheckoutService = Depends()):
    try:
        resposta = service.finalizar_compra(dados)
        if resposta.status_pagamento == "falhou":
            raise HTTPException(status_code=400, detail="Pagamento não aprovado.")
        return resposta
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
