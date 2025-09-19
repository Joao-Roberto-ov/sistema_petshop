from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from services.cliente_service import ServicosCliente
from services.funcionario_service import ServicosFuncionario

router = APIRouter(prefix="/api", tags=["Login"])

def pegar_servicos_cliente():
    return ServicosCliente()

def pegar_servicos_funcionario():
    return ServicosFuncionario()

from fastapi import APIRouter, Depends, HTTPException
from services.cliente_service import ServicosCliente
from services.funcionario_service import ServicosFuncionario
from modelos import UsuarioLogin  # modelo genérico para login (email + senha)

router = APIRouter(prefix="/api", tags=["Login"])

# Dependências para os serviços
def pegar_servicos_cliente():
    return ServicosCliente()

def pegar_servicos_funcionario():
    return ServicosFuncionario()


@router.post("/login")
async def rota_login_unificado(
    dados_login: UsuarioLogin,
    service_cliente: ServicosCliente = Depends(pegar_servicos_cliente),
    service_funcionario: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    """
    Login unificado.
    Tenta funcionário primeiro, depois cliente.
    Retorna token JWT com role no payload.
    """
    try:
        # Tenta login como funcionário
        return service_funcionario.login(dados_login)
    except HTTPException as e:
        if e.status_code not in (401, 403):
            # outros erros críticos
            raise e
        # Se falhou como funcionário, tenta cliente
        try:
            return service_cliente.login(dados_login)
        except HTTPException:
            raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
    except Exception:
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno")

