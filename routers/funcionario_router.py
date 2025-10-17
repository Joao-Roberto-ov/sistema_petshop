from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from seguranca import verifica_token, verificar_permissao_admin
from services.funcionario_service import ServicosFuncionario
from services.cliente_service import ServicosCliente
from modelos import FuncionarioModel, ClienteCadastroPorFuncionario, ClienteEdicaoPorFuncionario, FuncionarioCadastro, FuncionarioUpdate, CriarVenda
from util.cargos import Cargo
from typing import Annotated
from modelos import UsuarioLogin
from services.funcionario_service import ServicosFuncionario
from services.venda_service import ServicosVenda

router = APIRouter(prefix="/api/funcionario", tags=["Funcionario"])
dupla_autenticacao = OAuth2PasswordBearer(tokenUrl="/login")

def pegar_servicos_funcionario():
    return ServicosFuncionario()

def pegar_servicos_cliente():
    from services.cliente_service import ServicosCliente
    return ServicosCliente()

def pegar_servico_venda():
    return ServicosVenda()

async def pegar_id_do_funcionario(token: str = Depends(dupla_autenticacao)) -> int:
    user_id = verifica_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return int(user_id)

@router.post("/cadastrar-cliente", status_code=201)
async def cadastrar_cliente_por_funcionario(
    dados_cliente: ClienteCadastroPorFuncionario,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosCliente = Depends(pegar_servicos_cliente),
    service_funcionario: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    try:
        resultado = service.cadastrar_por_funcionario(dados_cliente)
        return {
            "Aviso": f"Cliente '{dados_cliente.nome}' cadastrado com sucesso!",
            "senha_temporaria": resultado["senha_temporaria"]
        }
    except HTTPException as e:
        raise e

    except Exception as e:
        import traceback
        print("Erro interno em /cadastrar-cliente:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno.")

@router.put("/editar-cliente/{cliente_id}", status_code=200)
async def editar_cliente_por_funcionario(
    cliente_id: int,
    dados_edicao: ClienteEdicaoPorFuncionario,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosCliente = Depends(pegar_servicos_cliente),
    service_funcionario: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    service.editar_cliente(
        id=cliente_id,
        nome=dados_edicao.nome,
        email=dados_edicao.email,
        telefone=dados_edicao.telefone,
        endereco=dados_edicao.endereco,
        cpf=dados_edicao.cpf
    )

    return {"Aviso": f"Cliente '{dados_edicao.nome or cliente_id}' editado com sucesso!"}

@router.post("/login")
async def login_funcionario(
    dados_login: UsuarioLogin, 
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    return service.login(dados_login)

@router.post("/cadastrar", status_code=201)
async def cadastrar_funcionario(
    dados_funcionario: FuncionarioCadastro,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    """
    Cadastra um novo funcionário (AC1: formulário com campos obrigatórios)
    Requer permissão de administrador
    """
    try:
        resultado = service.cadastrar_funcionario_completo(dados_funcionario)
        return {
            "success": True,
            "data": resultado,
            "message": resultado["message"]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        print("Erro interno em /cadastrar:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno.")

@router.get("/listar")
async def listar_funcionarios(
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    """
    Lista todos os funcionários cadastrados (AC2: disponível para consultas)
    Requer permissão de administrador
    """
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
        print("Erro interno em /listar:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno.")

@router.get("/{funcionario_id}")
async def buscar_funcionario(
    funcionario_id: int,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    """
    Busca um funcionário específico por ID (AC2: disponível para consultas)
    Requer permissão de administrador
    """
    try:
        funcionario = service.buscar_funcionario_por_id(funcionario_id)
        return {
            "success": True,
            "data": funcionario
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        print("Erro interno em /buscar:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno.")

@router.put("/{funcionario_id}")
async def atualizar_funcionario(
    funcionario_id: int,
    dados_atualizacao: FuncionarioUpdate,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    """
    Atualiza dados de um funcionário existente
    Requer permissão de administrador
    """
    try:
        resultado = service.atualizar_funcionario(funcionario_id, dados_atualizacao)
        return {
            "success": True,
            "data": resultado,
            "message": resultado["message"]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        print("Erro interno em /atualizar:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno.")

@router.put("/{funcionario_id}/desativar")
async def desativar_funcionario_rota(
    funcionario_id: int,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    """
    Desativa um funcionário, alterando seu status is_ativo para False.
    Requer permissão de administrador
    """
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
        print("Erro interno em /desativar:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno.")

@router.put("/{funcionario_id}/ativar")
async def ativar_funcionario_rota(
    funcionario_id: int,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    """
    Ativa um funcionário, alterando seu status is_ativo para True.
    Requer permissão de administrador
    """
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
        print("Erro interno em /ativar:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno.")

# --- Rota para registrar venda ---
@router.post("/registrar-venda", status_code=201)
async def registrar_venda_por_funcionario(
    dados_venda: CriarVenda,
    funcionario_id: int = Depends(pegar_id_do_funcionario),
    service_venda: ServicosVenda = Depends(pegar_servico_venda)
):
    """
    Permite que o funcionário autenticado registre uma venda.
    """
    try:
        resultado = service_venda.registrar_venda(dados_venda, funcionario_id)
        return {
            "Aviso": "Venda registrada com sucesso.",
            "Detalhes": resultado
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        import traceback
        print("Erro interno em /registrar-venda:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno ao registrar a venda.")