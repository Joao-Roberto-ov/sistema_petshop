from fastapi import APIRouter, Depends, HTTPException
from seguranca import pegar_id_do_usuario_logado
from services.funcionario_service import ServicosFuncionario
from services.produto_service import ServicosProduto
from modelos import ProdutoCadastro, LoteEstoqueUpdate
from util.cargos import Cargo

router = APIRouter(prefix="/api/produtos", tags=["Produtos"])


# garante que o usuario logado é um gestor
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
        service: ServicosProduto = Depends(ServicosProduto)
):
    # endpoint para procurar sugestoes de produtos
    return service.buscar_sugestoes(q)


@router.get("/detalhes-externo/{barcode}")
async def buscar_detalhes_produto_externo(
        barcode: str,
        service: ServicosProduto = Depends(ServicosProduto)
):
    return service.buscar_detalhes_para_cadastro(barcode)


@router.post("/cadastrar")
async def cadastrar_novo_produto(
        dados_produto: ProdutoCadastro,
        gestor_id: int = Depends(pegar_gestor_logado),
        service: ServicosProduto = Depends(ServicosProduto)
):
    return service.cadastrar_produto(dados_produto, gestor_id)


@router.get("/listar")
async def listar_produtos(
        service: ServicosProduto = Depends(ServicosProduto)
):
    """Lista todos os produtos cadastrados - PÚBLICO, não requer autenticação"""
    return service.listar_todos_produtos()


@router.put("/editar/{produto_id}")
async def editar_produto(
        produto_id: int,
        dados_produto: ProdutoCadastro,
        gestor_id: int = Depends(pegar_gestor_logado),
        service: ServicosProduto = Depends(ServicosProduto)
):
    """Edita um produto cadastrado - apenas gestores"""
    return service.editar_produto(produto_id, dados_produto, gestor_id)


@router.delete("/excluir/{produto_id}")
async def excluir_produto(
        produto_id: int,
        gestor_id: int = Depends(pegar_gestor_logado),
        service: ServicosProduto = Depends(ServicosProduto)
):
    """Exclui um produto cadastrado - apenas gestores"""
    return service.excluir_produto(produto_id, gestor_id)


@router.get("/verificar-externo/{barcode}")
async def verificar_produto_externo(
        barcode: str,
        service: ServicosProduto = Depends(ServicosProduto)
):
    """Verifica se produto existe na base externa - apenas gestores"""
    eh_externo = service.repo.verificar_produto_externo(barcode)
    return {"eh_externo": eh_externo}

@router.post("/atualizar-estoque-lote")
async def atualizar_estoque_em_lote(
        dados_lote: LoteEstoqueUpdate,
        gestor_id: int = Depends(pegar_gestor_logado),
        service: ServicosProduto = Depends(ServicosProduto)
):
    # Recebe uma lista de produtos e quantidades para adicionar ao estoque -- gestores
    return service.atualizar_estoque_lote(dados_lote, gestor_id)


# Endpoint publico para verificar o estoque em tempo real de um produto
@router.get("/{produto_id}/estoque")
async def get_estoque_produto(
        produto_id: int,
        service: ServicosProduto = Depends(ServicosProduto)
):

    #retorna o estoque atual de um produto especifico
    #publico para que o frontend (carrinho) possa verificar.
    try:
        # Reutiliza o serviço que lista todos
        produtos = service.listar_todos_produtos()
        produto = next((p for p in produtos if p["id"] == produto_id), None)

        if not produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado.")

        return {"id": produto_id, "estoque": produto["estoque"]}
    except HTTPException as e:
        raise e
    except Exception as e:
        # Captura genérica caso o produto não seja encontrado no 'next'
        print(f"Erro ao buscar estoque para ID {produto_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estoque: {e}")