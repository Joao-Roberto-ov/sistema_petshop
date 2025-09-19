from fastapi import APIRouter, Depends, HTTPException
from services.cliente_service import ServicosCliente
from services.funcionario_service import ServicosFuncionario
from modelos import UsuarioLogin

router = APIRouter(prefix="/api", tags=["Login"])

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

    try:

        return service_funcionario.login(dados_login)

    except HTTPException as e:
        if e.status_code not in (401, 403):
            raise e
        try:
            return service_cliente.login(dados_login)

        except HTTPException:
            raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")

    except Exception:
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno")