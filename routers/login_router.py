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
    # Tenta login como funcionário
    try:
        return service_funcionario.login(dados_login)
    except HTTPException as e:
        if e.status_code not in (401, 403):
            raise

    # Se falhou como funcionário, tenta cliente
    try:
        return service_cliente.login(dados_login)
    except HTTPException as e:
        if e.status_code == 401:
            raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
        raise e
    except Exception:
        raise HTTPException(status_code=500, detail="Erro interno no login de cliente")

    except Exception as funcionario_exception:
        # Se houve erro interno no login de funcionário, tenta cliente
        try:
            resultado_cliente = service_cliente.login(dados_login)
            return resultado_cliente

        except HTTPException as cliente_error:
            if cliente_error.status_code == 401:
                raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
            else:
                raise cliente_error
        except Exception:
            # Se ambos falharam com erro interno, retorna erro genérico
            raise HTTPException(status_code=500, detail="Ocorreu um erro interno no sistema de login")

