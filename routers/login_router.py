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
    print(f"=== LOGIN UNIFICADO INICIADO - Email: {dados_login.email} ===")
    
    # Tenta o login como funcionário primeiro
    try:
        print("🔧 Tentando login como funcionário...")
        resultado_funcionario = service_funcionario.login(dados_login)
        print("✅ Login como funcionário bem-sucedido")
        return resultado_funcionario
    except HTTPException as e:
        # Se o erro NÃO for de autenticação (401), é um erro inesperado. Propague-o.
        if e.status_code != 401:
            print(f"❌ Erro inesperado no login de funcionário: {e.detail}")
            raise e
        # Se for 401, tenta como cliente
        print("❌ Login como funcionário falhou, tentando como cliente...")

    # Se o login de funcionário falhou com 401, tenta como cliente
    try:
        print("👤 Tentando login como cliente...")
        resultado_cliente = service_cliente.login(dados_login)
        print("✅ Login como cliente bem-sucedido")
        return resultado_cliente
    except HTTPException as e:
        # Se o login de cliente também falhar, propague o erro do cliente.
        print(f"❌ Login como cliente falhou: {e.detail}")
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")
    except Exception as e:
        # Captura qualquer outra exceção inesperada no login do cliente
        print(f"❌ Erro interno no login de cliente: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Erro interno no servidor durante o login")

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
