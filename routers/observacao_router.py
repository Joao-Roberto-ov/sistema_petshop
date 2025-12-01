from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer # <--- Importação necessária
from typing import List
from modelos import ObservacaoCreate, ObservacaoResponse
from services.observacao_service import ServicosObservacao
from seguranca import verifica_token, decodifica_token

router = APIRouter(prefix="/api/observacoes", tags=["Observações"])

# <--- Definição do esquema para extrair o token do Header 'Authorization: Bearer ...'
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def pegar_servicos_observacao():
    return ServicosObservacao()


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_observacao(
        dados: ObservacaoCreate,
        token: str = Depends(oauth2_scheme), # <--- Alterado de verifica_token para oauth2_scheme
        service: ServicosObservacao = Depends(pegar_servicos_observacao)
):
    try:
        # Tenta extrair o ID do funcionário do token, se disponível
        payload = decodifica_token(token)
        if payload and payload.get("tipo") == "funcionario":
            dados.funcionario_id = int(payload['sub'])

        return service.criar_observacao(dados)
    except Exception as e:
        print(f"Erro ao criar observação: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/pet/{pet_id}", response_model=List[ObservacaoResponse])
def listar_observacoes_pet(
        pet_id: int,
        token: str = Depends(oauth2_scheme), # <--- Alterado de verifica_token para oauth2_scheme
        service: ServicosObservacao = Depends(pegar_servicos_observacao)
):
    try:
        # O response_model=List[ObservacaoResponse] fará a validação automática
        # Se der erro 422 aqui, é porque o banco retornou algo incompatível com o modelo
        return service.listar_por_pet(pet_id)
    except Exception as e:
        print(f"Erro ao listar observações: {e}")
        # Retorna lista vazia em caso de erro de conversão para evitar crash no front
        return []


@router.delete("/{obs_id}", status_code=204)
def deletar_observacao(
        obs_id: int,
        token: str = Depends(oauth2_scheme), # <--- Alterado de verifica_token para oauth2_scheme
        service: ServicosObservacao = Depends(pegar_servicos_observacao)
):
    service.deletar_observacao(obs_id)