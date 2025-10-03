from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from seguranca import verifica_token, verificar_permissao_admin
from services.funcionario_service import ServicosFuncionario
from services.cliente_service import ServicosCliente
from modelos import FuncionarioModel, ClienteCadastroPorFuncionario, ClienteEdicaoPorFuncionario
from util.cargos import Cargo
from typing import Annotated
from modelos import UsuarioLogin
from services.funcionario_service import ServicosFuncionario

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
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosCliente = Depends(pegar_servicos_cliente),
    service_funcionario: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    try:
        resultado = service.cadastrar_por_funcionario(dados_cliente)
        return {
            "Aviso": f"Cliente \'{dados_cliente.nome}\' cadastrado com sucesso!",
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
        endereco=dados_edicao.endereco
    )

    return {"Aviso": f"Cliente \'{dados_edicao.nome or cliente_id}\' editado com sucesso!"}



@router.post("/login")
async def login_funcionario(
    dados_login: UsuarioLogin, 
    service: ServicosFuncionario = Depends(pegar_servicos_funcionario)
):
    return service.login(dados_login)
