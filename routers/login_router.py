
from fastapi import APIRouter, Depends, HTTPException, status
from services.cliente_service import ServicosCliente
from services.funcionario_service import ServicosFuncionario
from modelos import UsuarioLogin, ForgotPasswordRequest, RedefinirSenhaRequest

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
    """
    Rota de login unificado que tenta primeiro funcionário, depois cliente
    """
    # Primeiro tenta login como funcionário
    try:
        resultado_funcionario = service_funcionario.login(dados_login)
        return resultado_funcionario

    except HTTPException as e:
        # Se for erro 401 ou 403, tenta login como cliente
        if e.status_code in (401, 403):
            try:
                resultado_cliente = service_cliente.login(dados_login)
                return resultado_cliente

            except HTTPException as cliente_error:
                # Se ambos falharam com 401, retorna erro genérico
                if cliente_error.status_code == 401:
                    raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
                else:
                    raise cliente_error
            except Exception as cliente_exception:
                raise HTTPException(status_code=500, detail=f"Erro interno no login de cliente: {str(cliente_exception)}")
        else:
            # Se não for 401 ou 403, re-raise o erro original
            raise e

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

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    request: ForgotPasswordRequest,
    service_cliente: ServicosCliente = Depends(pegar_servicos_cliente)
):
    """
    Solicita a redefinição de senha para um e-mail de cliente. Envia um link de redefinição se o e-mail for válido.
    Retorna sucesso genérico para evitar enumeração de usuários.
    """
    return service_cliente.esqueci_minha_senha(request)

@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    request: RedefinirSenhaRequest,
    service_cliente: ServicosCliente = Depends(pegar_servicos_cliente)
):
    """
    Redefine a senha do cliente usando um token de redefinição e a nova senha.
    """
    return service_cliente.redefinir_senha_publica(request)

@router.post("/forgot-password-funcionario", status_code=status.HTTP_200_OK)
async def forgot_password_funcionario(
    request: ForgotPasswordRequest,
    service_funcionario: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    """
    Solicita a redefinição de senha para um e-mail de funcionário. Envia um link de redefinição se o e-mail for válido.
    Retorna sucesso genérico para evitar enumeração de usuários.
    """
    return service_funcionario.esqueci_minha_senha(request)

@router.post("/reset-password-funcionario", status_code=status.HTTP_200_OK)
async def reset_password_funcionario(
    request: RedefinirSenhaRequest,
    service_funcionario: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    """
    Redefine a senha do funcionário usando um token de redefinição e a nova senha.
    """
    return service_funcionario.redefinir_senha_publica(request)

