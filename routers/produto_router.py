from fastapi import APIRouter, Depends, HTTPException
from seguranca import pegar_id_do_usuario_logado
from services.funcionario_service import ServicosFuncionario
from services.produto_service import ServicosProduto
from modelos import ProdutoCadastro
from util.cargos import Cargo

router = APIRouter(prefix="/api/produtos", tags=["Produtos"])

#garante que o usuario logado é um gestor
async def pegar_gestor_logado(
    usuario_id: int = Depends(pegar_id_do_usuario_logado),
    service_func: ServicosFuncionario = Depends(ServicosFuncionario)
) -> int:
    funcionario = service_func.buscar_pelo_id(usuario_id)
    if not funcionario or funcionario.get("cargo_id") != Cargo.GESTOR.value:
        raise HTTPException(
            status_code=403,
            detail="Acesso negado. Apenas gestores podem realizar esta ação."
        )
    return usuario_id


@router.get("/buscar-externo")
async def buscar_produtos_externos(
    q: str,
    gestor_id: int = Depends(pegar_gestor_logado),
    service: ServicosProduto = Depends(ServicosProduto)
):
    #endpoint para rocurar sugestoes de produtos
    return service.buscar_sugestoes(q)


@router.get("/detalhes-externo/{barcode}")
async def buscar_detalhes_produto_externo(
    barcode: str,
    gestor_id: int = Depends(pegar_gestor_logado),
    service: ServicosProduto = Depends(ServicosProduto)
):
    #pega os detalhes de um produto da base externa para preencher o formulário
    return service.buscar_detalhes_para_cadastro(barcode)


@router.post("/cadastrar")
async def cadastrar_novo_produto(
    dados_produto: ProdutoCadastro,
    gestor_id: int = Depends(pegar_gestor_logado),
    service: ServicosProduto = Depends(ServicosProduto)
):
    #cadastra um novo produto no sistema
    return service.cadastrar_produto(dados_produto, gestor_id)