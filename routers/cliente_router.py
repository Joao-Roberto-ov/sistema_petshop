from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from seguranca import (
    pegar_id_do_usuario_logado, 
    verificar_permissao_funcionario,
    verifica_token,
    decodifica_token
)
from modelos import (
    ClienteCadastro, 
    UsuarioLogin, 
    ClienteUpdate, 
    PasswordResetRequest, 
    PasswordResetConfirm, 
    ForgotPasswordRequest, 
    ClienteBuscaResponse
)
from services.cliente_service import ServicosCliente
from services.pet_service import ServicosPet
from services.agendamento_service import ServicosAgendamento
from services import historico_medico_service

# Router principal para /api
router = APIRouter(prefix="/api", tags=["Clientes"])

# Router para rotas específicas de cliente
cliente_router = APIRouter(prefix="/cliente", tags=["Clientes"])

def pegar_servicos_cliente():
    return ServicosCliente()

def pegar_servicos_pet():
    return ServicosPet()

def pegar_servicos_agendamento():
    return ServicosAgendamento()

# Função para verificar permissão de cliente
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

# ========== ROTAS PARA /api ========== (Compatíveis com o frontend)

@router.get("/users", status_code=200)
async def rota_buscar_todos(
    service: ServicosCliente = Depends(pegar_servicos_cliente),
    funcionario_id: int = Depends(verificar_permissao_funcionario)
):
    """
    Retorna a lista de todos os clientes cadastrados (apenas para funcionários).
    Rota: GET /api/users
    """
    try:
        print("=== INICIANDO BUSCA DE CLIENTES ===")
        clientes = service.buscar_todos()
        print(f"=== CLIENTES ENCONTRADOS: {len(clientes)} ===")
        return clientes
    except Exception as e:
        print(f"=== ERRO NO ENDPOINT /api/users: {str(e)} ===")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Erro ao buscar clientes.")

@router.get("/cliente/buscar", response_model=List[ClienteBuscaResponse])
async def buscar_clientes(
    termo: str,
    service: ServicosCliente = Depends(pegar_servicos_cliente),
    funcionario_id: int = Depends(verificar_permissao_funcionario) 
):
    """
    Busca clientes por nome ou CPF (apenas para funcionários).
    Rota: GET /api/cliente/buscar?termo=...
    """
    return service.buscar_clientes_por_termo(termo)

@router.post("/signup", status_code=201)
async def rota_signup(
    dados_cliente: ClienteCadastro, 
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
    """
    Cadastro de cliente
    Rota: POST /api/signup
    """
    try:
        service.signup(dados_cliente)
        return {"Aviso": f"Cliente '{dados_cliente.nome}' cadastrado com sucesso!"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno.")

@router.post("/login", status_code=200)
async def rota_login(
    dados_login: UsuarioLogin,
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
    """
    Rota de login para clientes
    Rota: POST /api/login
    """
    try:
        return service.login(dados_login)
    except HTTPException as e:
        # Se não encontrou como cliente, redireciona para login de funcionário
        if e.status_code == 401:
            # Importar aqui para evitar circular imports
            from services.funcionario_service import ServicosFuncionario
            funcionario_service = ServicosFuncionario()
            try:
                # Tenta fazer login como funcionário
                return funcionario_service.login(dados_login)
            except HTTPException:
                # Se também falhar como funcionário, retorna o erro original
                raise e
        raise e
    except Exception as e:
        print(f"Erro no login: {e}")
        raise HTTPException(status_code=500, detail="Erro interno no servidor")

# ========== ROTAS PARA /api/cliente ==========

@cliente_router.get("/pets/{pet_id}/perfil")
async def obter_perfil_pet_cliente(
    pet_id: int,
    cliente_id: int = Depends(verificar_permissao_cliente), 
    service_pet: ServicosPet = Depends(pegar_servicos_pet)
):
    """
    Cliente visualiza perfil completo do SEU pet
    Rota: GET /api/cliente/pets/{pet_id}/perfil
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

@cliente_router.get("/users/me")
async def rota_para_usuario(
    current_user_id: int = Depends(pegar_id_do_usuario_logado),
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
    """
    Perfil do cliente logado
    Rota: GET /api/cliente/users/me
    """
    try:
        user = service.buscar_pelo_id(current_user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        return user
    except HTTPException as e:
        raise e

@cliente_router.put("/users/me")
async def rota_atualizar_perfil(
    dados_update: ClienteUpdate,
    current_user_id: int = Depends(pegar_id_do_usuario_logado),
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
    """
    Atualizar perfil do cliente
    Rota: PUT /api/cliente/users/me
    """
    return service.atualizar_perfil(current_user_id, dados_update)

@cliente_router.post("/users/me/request-password-change", status_code=200)
async def rota_solicitar_alteracao_senha(
    request_data: PasswordResetRequest,
    current_user_id: int = Depends(pegar_id_do_usuario_logado),
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
    """
    Solicitar alteração de senha
    Rota: POST /api/cliente/users/me/request-password-change
    """
    return service.solicitar_alteracao_senha(current_user_id, request_data)

@cliente_router.post("/users/me/confirm-password-change", status_code=200)
async def rota_confirmar_alteracao_senha(
    confirm_data: PasswordResetConfirm,
    current_user_id: int = Depends(pegar_id_do_usuario_logado),
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
    """
    Confirmar alteração de senha
    Rota: POST /api/cliente/users/me/confirm-password-change
    """
    return service.confirmar_alteracao_senha(current_user_id, confirm_data)

@cliente_router.post("/forgot-password", status_code=200)
async def rota_esqueci_senha(
    request_data: ForgotPasswordRequest,
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
    """
    Esqueci a senha
    Rota: POST /api/cliente/forgot-password
    """
    return service.esqueci_minha_senha(request_data)

# Incluir ambos os routers
router.include_router(cliente_router)


@router.get("/cliente/{id}", response_model=ClienteBuscaResponse)
async def buscar_cliente_por_id(
    id: int,
    service: ServicosCliente = Depends(pegar_servicos_cliente),
    funcionario_id: int = Depends(verificar_permissao_funcionario)
):
    cliente = service.buscar_pelo_id(id)

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    return cliente