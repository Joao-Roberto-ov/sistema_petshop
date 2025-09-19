from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from seguranca import verifica_token
from services.cliente_service import ServicosCliente
from modelos import ClienteCadastro

router = APIRouter(prefix="/api", tags=["Clientes"])
dupla_autenticacao = OAuth2PasswordBearer(tokenUrl = "/login")

async def pegar_id_do_usuario(token: str = Depends(dupla_autenticacao)) -> int:

    user_id = verifica_token(token)

    if user_id is None:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado", headers={"WWW-Authenticate": "Bearer"},)
    return int(user_id)

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
        raise HTTPException(status_code=500, detail = "Ocorreu um erro interno.")

@router.get("/users/me")
async def rota_para_usuario(
        current_user_id: int = Depends(pegar_id_do_usuario),
        service: ServicosCliente = Depends(pegar_servicos_cliente)
):

    try:
        user = service.buscar_pelo_id(current_user_id)
        if not user:
            raise HTTPException(status_code=404, detail = "Usuário não encontrado.")
        return user

    except HTTPException as e:
        raise e
@router.get("/users", status_code=200)
async def rota_buscar_todos(service: ServicosCliente = Depends(pegar_servicos_cliente)):
    """
    Retorna a lista de todos os clientes cadastrados.
    """
    try:
        clientes = service.buscar_todos()
        return clientes
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao buscar clientes.")
