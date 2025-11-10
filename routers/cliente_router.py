from fastapi import APIRouter, Depends, HTTPException
from seguranca import pegar_id_do_usuario_logado
from modelos import (ClienteCadastro, UsuarioLogin, ClienteUpdate, PasswordResetRequest, PasswordResetConfirm, ForgotPasswordRequest)
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from services.cliente_service import ServicosCliente
from services.pet_service import ServicosPet
from services.agendamento_service import ServicosAgendamento
from services import historico_medico_service

router = APIRouter(prefix="/api", tags=["Clientes"])

from seguranca import (
    verifica_token, 
    pegar_id_do_usuario_logado,  
    decodifica_token  
)

router = APIRouter(prefix="/api/cliente", tags=["Clientes"])

def pegar_servicos_cliente():
    return ServicosCliente()

def pegar_servicos_pet():
    return ServicosPet()

def pegar_servicos_agendamento():
    return ServicosAgendamento()

# CORREÇÃO: Criar a função verificar_permissao_cliente que está faltando
async def verificar_permissao_cliente(token: str = Depends(verifica_token)):
    """
    Verifica se o usuário é um cliente baseado no token
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

# Agora as rotas podem usar a função corretamente
@router.get("/pets/{pet_id}/perfil")
async def obter_perfil_pet_cliente(
    pet_id: int,
    cliente_id: int = Depends(verificar_permissao_cliente), 
    service_pet: ServicosPet = Depends(pegar_servicos_pet)
):
    """
    Cliente visualiza perfil completo do SEU pet
    """
    try:
        # Verificar se o pet pertence ao cliente
        pet_data = service_pet.buscar_pet_por_id(pet_id)
        if not pet_data:
            raise HTTPException(status_code=404, detail="Pet não encontrado")
        
        if pet_data.get("cliente_id") != cliente_id:
            raise HTTPException(status_code=403, detail="Este pet não pertence a você")
        
        # Buscar histórico médico
        historico = historico_medico_service.buscar_historico_pet(pet_id)
        
        return {
            "dados_pet": pet_data,
            "historico": historico
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erro ao buscar perfil do pet: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar perfil do pet")
    
@router.post("/signup", status_code=201)
async def rota_signup(dados_cliente: ClienteCadastro, service: ServicosCliente = Depends(pegar_servicos_cliente)):
    try:
        service.signup(dados_cliente)
        return {"Aviso": f"Cliente '{dados_cliente.nome}' cadastrado com sucesso!"}
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

@router.get("/users", status_code=200)
async def rota_buscar_todos(service: ServicosCliente = Depends(pegar_servicos_cliente)):
    """
    Retorna a lista de todos os clientes cadastrados.
    """
    try:
        print("=== INICIANDO BUSCA DE CLIENTES ===")
        clientes = service.buscar_todos()
        print(f"=== CLIENTES ENCONTRADOS: {len(clientes)} ===")
        return clientes
    except Exception as e:
        print(f"=== ERRO NO ENDPOINT /users: {str(e)} ===")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Erro ao buscar clientes.")

@router.get("/buscar", status_code=200)
async def rota_buscar_clientes(nome: str, service: ServicosCliente = Depends(pegar_servicos_cliente)):
    return service.buscar_clientes_por_nome(nome)
