from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from seguranca import verifica_token
from services.funcionario_service import ServicosFuncionario
from services.cliente_service import ServicosCliente
from modelos import FuncionarioModel, ClienteCadastroPorFuncionario
from util.cargos import Cargo

router = APIRouter(prefix="/api/funcionario", tags=["Funcionario"])
dupla_autenticacao = OAuth2PasswordBearer(tokenUrl="/login")

def pegar_servicos_funcionario():
    return ServicosFuncionario()

def pegar_servicos_cliente():
    from services.cliente_service import ServicosCliente
    return ServicosCliente()

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