from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from seguranca import (
    verifica_token,
    pegar_id_do_usuario_logado,
    decodifica_token
)

from modelos import (
    ClienteCadastro,
    UsuarioLogin,
    ClienteUpdate,
    PasswordResetRequest,
    PasswordResetConfirm,
    ForgotPasswordRequest
)

from services.cliente_service import ServicosCliente
from services.pet_service import ServicosPet
from services.agendamento_service import ServicosAgendamento
from services import historico_medico_service


# ------------------------------------
# CONFIG DO ROUTER
# ------------------------------------

router = APIRouter(
    prefix="/api/users",
    tags=["User"]
)


# ------------------------------------
# DEPENDÊNCIAS
# ------------------------------------

def pegar_servicos_cliente():
    return ServicosCliente()

def pegar_servicos_pet():
    return ServicosPet()

def pegar_servicos_agendamento():
    return ServicosAgendamento()


# ------------------------------------
# MIDDLEWARE / PERMISSÕES
# ------------------------------------

async def verificar_permissao_cliente(token: str = Depends(verifica_token)):
    """
    Verifica se o token pertence a um cliente.
    """
    payload = decodifica_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_type = payload.get("tipo")
    if user_type != "cliente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para clientes"
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ID do usuário não encontrado no token"
        )

    return int(user_id)


# ------------------------------------
# ROTAS
# ------------------------------------

@router.get("/me")
async def rota_para_usuario(
        current_user_id: int = Depends(pegar_id_do_usuario_logado),
        service: ServicosCliente = Depends(pegar_servicos_cliente)):
    """
    Retorna os dados do usuário logado (cliente).
    """
    user = service.buscar_pelo_id(current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user


@router.put("/me")
async def rota_atualizar_perfil(
    dados_update: ClienteUpdate,
    current_user_id: int = Depends(pegar_id_do_usuario_logado),
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
    """
    Atualiza os dados do usuário logado.
    """
    return service.atualizar_perfil(current_user_id, dados_update)


@router.post("/me/request-password-change", status_code=200)
async def rota_solicitar_alteracao_senha(
    request_data: PasswordResetRequest,
    current_user_id: int = Depends(pegar_id_do_usuario_logado),
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
    """
    Envia e-mail de solicitação de mudança de senha.
    """
    return service.solicitar_alteracao_senha(current_user_id, request_data)


@router.post("/me/confirm-password-change", status_code=200)
async def rota_confirmar_alteracao_senha(
    confirm_data: PasswordResetConfirm,
    current_user_id: int = Depends(pegar_id_do_usuario_logado),
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
    """
    Confirma a mudança de senha.
    """
    return service.confirmar_alteracao_senha(current_user_id, confirm_data)


@router.get("/", status_code=200)
async def rota_buscar_todos(service: ServicosCliente = Depends(pegar_servicos_cliente)):
    """
    Retorna todos os clientes cadastrados.
    """
    try:
        clientes = service.buscar_todos()
        return clientes
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao buscar clientes.")
