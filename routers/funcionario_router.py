from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from seguranca import verifica_token
from services.funcionario_service import ServicosFuncionario
from services.cliente_service import ServicosCliente
from services.venda_service import ServicosVenda
from modelos import FuncionarioModel, ClienteCadastroPorFuncionario, ClienteEdicaoPorFuncionario, CriarVenda
from util.cargos import Cargo

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
    funcionario_id: int = Depends(pegar_id_do_funcionario),
    service: ServicosCliente = Depends(pegar_servicos_cliente),
    service_funcionario: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    #verifica se o funcionário é gestor
    funcionario = service_funcionario.buscar_pelo_id(funcionario_id)

    if not funcionario or funcionario.get("cargo_id") != Cargo.GESTOR.value:
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas gestores podem realizar esta ação.")

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
    funcionario_id: int = Depends(pegar_id_do_funcionario),
    service: ServicosCliente = Depends(pegar_servicos_cliente),
    service_funcionario: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    # Apenas gestores podem editar
    funcionario = service_funcionario.buscar_pelo_id(funcionario_id)
    if not funcionario or funcionario.get("cargo_id") != Cargo.GESTOR.value:
        raise HTTPException(status_code=403, detail="Acesso negado.")

    service.editar_cliente(
        id=cliente_id,
        nome=dados_edicao.nome,
        email=dados_edicao.email,
        telefone=dados_edicao.telefone,
        endereco=dados_edicao.endereco
    )

    return {"Aviso": f"Cliente '{dados_edicao.nome or cliente_id}' editado com sucesso!"}

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