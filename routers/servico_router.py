from fastapi import APIRouter, Depends, HTTPException

from seguranca import pegar_id_do_usuario_logado
from services.servico_service import ServicosService
from modelos import ServicoModel

router = APIRouter(prefix="/api/servicos", tags=["Catálogo de Serviços"])

def pegar_servicos_catalogo():
    return ServicosService()

@router.get("", status_code=200)
async def rota_listar_servicos(service: ServicosService = Depends(pegar_servicos_catalogo)):
    return service.listar_servicos()

@router.get("/{servico_id}", status_code=200)
async def rota_buscar_servico(servico_id: int, service: ServicosService = Depends(pegar_servicos_catalogo)):
    return service.buscar_servico_por_id(servico_id)


@router.post("", status_code=201)
async def rota_cadastrar_servico(
    dados_servico: ServicoModel,
    user_id: int = Depends(pegar_id_do_usuario_logado),
    service: ServicosService = Depends(pegar_servicos_catalogo)
):
    return service.cadastrar_servico(dados_servico, user_id)

@router.put("/{servico_id}", status_code=200)
async def rota_atualizar_servico(
    servico_id: int,
    campos: dict,
    user_id: int = Depends(pegar_id_do_usuario_logado),
    service: ServicosService = Depends(pegar_servicos_catalogo)
):
    return service.atualizar_servico(servico_id, campos, user_id)

@router.delete("/{servico_id}", status_code=200)
async def rota_deletar_servico(
    servico_id: int,
    user_id: int = Depends(pegar_id_do_usuario_logado),
    service: ServicosService = Depends(pegar_servicos_catalogo)
):
    return service.deletar_servico(servico_id, user_id)
