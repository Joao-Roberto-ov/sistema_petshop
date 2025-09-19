from fastapi import APIRouter, Depends, HTTPException
from seguranca import pegar_id_do_usuario_logado 
from services.cliente_service import ServicosCliente

from modelos import (ClienteCadastro, ClienteLogin, ClienteUpdate, 
                     PasswordResetRequest, PasswordResetConfirm, ForgotPasswordRequest)

router = APIRouter(prefix="/api", tags=["Clientes"])
def pegar_servicos_cliente():
    return ServicosCliente()

@router.post("/signup", status_code = 201)
async def rota_signup(dados_cliente: ClienteCadastro, service: ServicosCliente = Depends(pegar_servicos_cliente)):
    try:
        service.signup(dados_cliente)
        return {"Aviso": f"Cliente '{dados_cliente.nome}' cadastrado com sucesso!"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno.")

@router.post("/login")
async def rota_login(cliente_login_data: ClienteLogin, service: ServicosCliente = Depends(pegar_servicos_cliente)):
    try:
        return service.login(cliente_login_data)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno.")

@router.get("/users/me")
async def rota_para_usuario(
        current_user_id: int = Depends(pegar_id_do_usuario_logado),
        service: ServicosCliente = Depends(pegar_servicos_cliente)):
    try:
        user = service.buscar_pelo_id(current_user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        return user
    except HTTPException as e:
        raise e

@router.put("/users/me")
async def rota_atualizar_perfil(
    dados_update: ClienteUpdate,
    current_user_id: int = Depends(pegar_id_do_usuario_logado),
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
    return service.atualizar_perfil(current_user_id, dados_update)

@router.post("/users/me/request-password-change", status_code=200)
async def rota_solicitar_alteracao_senha(
    request_data: PasswordResetRequest,
    current_user_id: int = Depends(pegar_id_do_usuario_logado),
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
    return service.solicitar_alteracao_senha(current_user_id, request_data)

@router.post("/users/me/confirm-password-change", status_code=200)
async def rota_confirmar_alteracao_senha(
    confirm_data: PasswordResetConfirm,
    current_user_id: int = Depends(pegar_id_do_usuario_logado),
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
    return service.confirmar_alteracao_senha(current_user_id, confirm_data)

# Rota para o fluxo de "Esqueci a Senha"
@router.post("/forgot-password", status_code=200)
async def rota_esqueci_senha(
    request_data: ForgotPasswordRequest,
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
    return service.esqueci_minha_senha(request_data)
