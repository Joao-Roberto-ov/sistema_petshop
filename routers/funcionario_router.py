from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from seguranca import verifica_token, verificar_permissao_admin
from services.funcionario_service import ServicosFuncionario
from services.cliente_service import ServicosCliente
from services.venda_service import ServicosVenda
from typing import Annotated, List, Optional
from util.cargos import Cargo
from modelos import (
    FuncionarioModel, ClienteCadastroPorFuncionario, ClienteEdicaoPorFuncionario,
    FuncionarioCadastro, FuncionarioUpdate, UsuarioLogin, ForgotPasswordRequest,
    RedefinirSenhaRequest, CriarVenda
)

router = APIRouter(prefix="/api/funcionario", tags=["Funcionários"]) # Tag no plural
dupla_autenticacao = OAuth2PasswordBearer(tokenUrl="/api/funcionario/login") # URL completa

def pegar_servicos_funcionario():
    return ServicosFuncionario()

def pegar_servicos_cliente():
    return ServicosCliente()

def pegar_servico_venda():
    return ServicosVenda()

async def pegar_id_do_funcionario(token: str = Depends(dupla_autenticacao)) -> int:
    payload = verifica_token(token) # verifica_token
    if not payload or payload.get("tipo") != "funcionario": # Verifica o tipo
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, # Usa status code
            detail="Token inválido, expirado ou não é de funcionário",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if user_id is None:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ID do usuário não encontrado no token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return int(user_id)

# --- MODIFICAÇÃO: Adiciona verificação de permissão admin ---
@router.post("/cadastrar-cliente", status_code=status.HTTP_201_CREATED)
async def cadastrar_cliente_por_funcionario(
    dados_cliente: ClienteCadastroPorFuncionario,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],  # Verifica se é admin/gestor
    service: ServicosCliente = Depends(pegar_servicos_cliente)
):
# --- FIM DA MODIFICAÇÃO ---
    try:
        resultado = service.cadastrar_por_funcionario(dados_cliente)
        return {
            "message": f"Cliente '{dados_cliente.nome}' cadastrado com sucesso!",
            "senha_temporaria": resultado["senha_temporaria"]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao cadastrar cliente.")

@router.put("/editar-cliente/{cliente_id}", status_code=status.HTTP_200_OK) # Usa status
async def editar_cliente_por_funcionario(
    cliente_id: int,
    dados_edicao: ClienteEdicaoPorFuncionario,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)], # Mantido
    service: ServicosCliente = Depends(pegar_servicos_cliente)
    # Removido service_funcionario não utilizado
):
    try:
        cliente_editado = service.editar_cliente(
            id=cliente_id,
            nome=dados_edicao.nome,
            email=dados_edicao.email,
            telefone=dados_edicao.telefone,
            endereco=dados_edicao.endereco
        )
        if not cliente_editado: # Checagem
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado ou erro ao editar.")

        return {"message": f"Cliente ID {cliente_id} editado com sucesso!"}
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao editar cliente.")


@router.post("/login")
async def login_funcionario(
    dados_login: UsuarioLogin,
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    try:
        return service.login(dados_login)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno no servidor durante o login.")


@router.post("/cadastrar", status_code=status.HTTP_201_CREATED) # Usa status
async def cadastrar_funcionario(
    dados_funcionario: FuncionarioCadastro,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    try:
        resultado = service.cadastrar_funcionario_completo(dados_funcionario)
        return {
            "success": True,
            "data": resultado,
            "message": resultado.get("message", "Funcionário cadastrado.")
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao cadastrar funcionário.")

@router.get("/listar")
async def listar_funcionarios(
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    try:
        funcionarios = service.listar_funcionarios()
        return {
            "success": True,
            "data": funcionarios,
            "total": len(funcionarios)
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao listar funcionários.")

@router.get("/{funcionario_id}")
async def buscar_funcionario(
    funcionario_id: int,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    try:
        funcionario = service.buscar_funcionario_por_id(funcionario_id)
        if not funcionario:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcionário não encontrado.")
        return {
            "success": True,
            "data": funcionario
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao buscar funcionário.")

@router.put("/{funcionario_id}")
async def atualizar_funcionario(
    funcionario_id: int,
    dados_atualizacao: FuncionarioUpdate,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    try:
        resultado = service.atualizar_funcionario(funcionario_id, dados_atualizacao)
        return {
            "success": True,
            "data": resultado,
            "message": resultado.get("message", "Funcionário atualizado.")
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao atualizar funcionário.")

@router.put("/{funcionario_id}/desativar", status_code=status.HTTP_200_OK) # Usa status
async def desativar_funcionario_rota(
    funcionario_id: int,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    try:
        resultado = service.desativar_funcionario(funcionario_id)
        return {
            "success": True,
            "message": resultado["message"]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao desativar funcionário.")

@router.put("/{funcionario_id}/ativar", status_code=status.HTTP_200_OK) # Usa status
async def ativar_funcionario_rota(
    funcionario_id: int,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    try:
        resultado = service.ativar_funcionario(funcionario_id)
        return {
            "success": True,
            "message": resultado["message"]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao ativar funcionário.")

@router.post("/registrar-venda", status_code=status.HTTP_201_CREATED) # Usa status
async def registrar_venda_por_funcionario(
    dados_venda: CriarVenda,
    funcionario_id: int = Depends(pegar_id_do_funcionario), # Usa o auth helper atualizado
    service_venda: ServicosVenda = Depends(pegar_servico_venda)
):
    """
    Permite que o funcionário autenticado registre uma venda.
    """
    try:
        resultado = service_venda.registrar_venda(dados_venda, funcionario_id)
        # Resposta padronizada
        return {
            "success": True,
            "message": "Venda registrada com sucesso.",
            "data": resultado
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocorreu um erro interno ao registrar a venda.")

@router.get("/especialistas/{servico_id}", response_model=List[dict])
async def rota_buscar_especialistas_por_servico(
    servico_id: int,
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario),
):
    """
    Retorna uma lista de funcionários (id, nome) que são especialistas
    no serviço com o ID fornecido. Aberto para qualquer utilizador (cliente ou funcionário).
    """
    try:
        especialistas = service.buscar_especialistas_por_servico(servico_id)
        return especialistas
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erro ao buscar especialistas para serviço {servico_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar especialistas."
        )

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password_funcionario(
    request_data: ForgotPasswordRequest,
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    """ Rota pública para solicitar redefinição de senha de funcionário """
    try:
        return service.esqueci_minha_senha(request_data)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro interno do servidor: {str(e)}")

@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password_funcionario(
    request_data: RedefinirSenhaRequest,
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    """ Rota pública para confirmar a redefinição de senha de funcionário com token """
    try:
        return service.redefinir_senha_publica(request_data)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro interno do servidor: {str(e)}")