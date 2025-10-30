from fastapi import APIRouter, Depends, HTTPException, status
from modelos import ForgotPasswordRequest, PasswordResetForm
from services.cliente_service import ServicosCliente
from services.funcionario_service import ServicosFuncionario

router = APIRouter(prefix="/api", tags=["Redefinição de Senha"])

def pegar_servicos_cliente():
    return ServicosCliente()

def pegar_servicos_funcionario():
    return ServicosFuncionario()

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password_request(
    request_data: ForgotPasswordRequest,
    service_cliente: ServicosCliente = Depends(pegar_servicos_cliente),
    service_funcionario: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    """
    Solicita a redefinição de senha para um e-mail fornecido.
    Envia um link de redefinição para o e-mail se o usuário existir.
    Retorna uma mensagem genérica de sucesso para evitar enumeração de usuários.
    """
    try:
        # Tenta encontrar o usuário como cliente
        service_cliente.esqueci_minha_senha(request_data)
        return {"message": "Se um usuário com este e-mail existir, um link de redefinição de senha será enviado.", "status": "success"}
    except HTTPException as e:
        # Se for um erro 404 (não encontrado), ainda retorna sucesso genérico
        if e.status_code == status.HTTP_404_NOT_FOUND:
            return {"message": "Se um usuário com este e-mail existir, um link de redefinição de senha será enviado.", "status": "success"}
        raise e
    except Exception as e:
        print(f"Erro inesperado ao solicitar redefinição de senha para cliente: {e}")
        return {"message": "Se um usuário com este e-mail existir, um link de redefinição de senha será enviado.", "status": "success"}

@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password_confirm(
    reset_data: PasswordResetForm,
    service_cliente: ServicosCliente = Depends(pegar_servicos_cliente),
    service_funcionario: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    """
    Confirma a redefinição de senha usando um token e a nova senha.
    """
    if reset_data.nova_senha != reset_data.confirmar_nova_senha:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="As senhas não coincidem.")

    try:
        # Tenta redefinir a senha como cliente
        service_cliente.redefinir_senha_com_token(reset_data.token, reset_data.nova_senha)
        return {"message": "Senha redefinida com sucesso!", "status": "success"}
    except HTTPException as e:
        if e.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND, status.HTTP_401_UNAUTHORIZED]:
            raise e
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro interno ao redefinir senha de cliente: {e}")
    except Exception as e:
        print(f"Erro inesperado ao redefinir senha para cliente: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao redefinir a senha.")
