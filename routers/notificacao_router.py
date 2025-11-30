from fastapi import APIRouter, Depends, status
from services.notificacao_service import NotificacaoService
from seguranca import verificar_permissao_gestor # Apenas gestores veem

router = APIRouter(prefix="/api/notificacoes", tags=["Notificações"])

@router.get("/", status_code=status.HTTP_200_OK)
def listar_notificacoes(
    service: NotificacaoService = Depends(),
    gestor_id: int = Depends(verificar_permissao_gestor)
):
    return service.listar_nao_lidas()

@router.put("/{id}/lida", status_code=status.HTTP_204_NO_CONTENT)
def marcar_lida(
    id: int,
    service: NotificacaoService = Depends(),
    gestor_id: int = Depends(verificar_permissao_gestor)
):
    service.marcar_como_lida(id)