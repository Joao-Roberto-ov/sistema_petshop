from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from modelos import HistoricoMedico, HistoricoMedicoResponse
from services import historico_medico_service, vacina_service
from services.observacao_service import ServicosObservacao
from services.pet_service import ServicosPet
from seguranca import verifica_token, decodifica_token

router = APIRouter(
    prefix="/historico",
    tags=["Historico Medico"]
)


async def obter_usuario_logado(token: str = Depends(verifica_token)):
    """Obtém o usuário logado a partir do token"""
    payload = decodifica_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado"
        )
    return payload


async def obter_funcionario_logado(token: str = Depends(verifica_token)):
    """Obtém o funcionário logado a partir do token"""
    payload = decodifica_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado"
        )

    user_type = payload.get("tipo")
    if user_type != "funcionario":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para funcionários"
        )

    return payload


@router.post("/", response_model=HistoricoMedicoResponse, status_code=status.HTTP_201_CREATED)
def registrar_historico(historico: HistoricoMedico, funcionario: dict = Depends(obter_funcionario_logado)):
    # Apenas funcionários podem registrar histórico
    historico.funcionario_id = int(funcionario["sub"])  # 'sub' contém o ID no token padrão
    historico_id = historico_medico_service.registrar_historico(historico)
    if not historico_id:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao registrar histórico.")

    # Retorna o registro completo
    return historico_medico_service.buscar_detalhes_historico(historico_id)


@router.get("/pet/{pet_id}", response_model=List[HistoricoMedicoResponse])
def obter_historico_pet(pet_id: int, usuario: dict = Depends(obter_usuario_logado)):
    """
    Obtém o histórico médico de um pet com verificação de permissões
    """
    try:
        # Verificar se o usuário tem acesso a este pet
        service_pet = ServicosPet()

        # Se for cliente, verificar se o pet pertence a ele
        if usuario.get("tipo") == "cliente":
            pet_data = service_pet.buscar_pet_por_id(pet_id)
            # Verifica se o ID do cliente no token (sub) bate com o do pet
            if not pet_data or str(pet_data.get("cliente_id")) != str(usuario.get("sub")):
                raise HTTPException(
                    status_code=403,
                    detail="Você não tem permissão para acessar o histórico deste pet"
                )

        # Se for funcionário, permitir acesso a qualquer pet
        historico = historico_medico_service.buscar_historico_pet(pet_id)
        return historico

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar histórico: {str(e)}")


@router.get("/{historico_id}", response_model=HistoricoMedicoResponse)
def obter_detalhes_historico(historico_id: int, usuario: dict = Depends(obter_usuario_logado)):
    """
    Obtém detalhes completos de um registro específico do histórico
    """
    try:
        historico = historico_medico_service.buscar_detalhes_historico(historico_id)
        if not historico:
            raise HTTPException(status_code=404, detail="Registro de histórico não encontrado")

        # Verificar permissão
        service_pet = ServicosPet()
        pet_data = service_pet.buscar_pet_por_id(historico["pet_id"])

        if usuario.get("tipo") == "cliente" and str(pet_data.get("cliente_id")) != str(usuario.get("sub")):
            raise HTTPException(
                status_code=403,
                detail="Você não tem permissão para acessar este registro"
            )

        return historico

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar detalhes: {str(e)}")


@router.delete("/{historico_id}", status_code=status.HTTP_200_OK)
def deletar_historico(historico_id: int, funcionario: dict = Depends(obter_funcionario_logado)):
    """
    Remove um registro do histórico (apenas funcionários)
    """
    sucesso = historico_medico_service.deletar_historico(historico_id)
    if not sucesso:
        raise HTTPException(status_code=500, detail="Erro ao deletar registro.")
    return {"message": "Registro deletado com sucesso."}


@router.get("/completo/{pet_id}")
async def historico_completo(pet_id: int):
    """
    Rota consolidada para obter o histórico do pet (dados + histórico médico + vacinas + OBSERVAÇÕES).
    """
    try:
        # procura dados do Pet
        service_pet = ServicosPet()
        pet_data_raw = service_pet.buscar_pet_por_id(pet_id)

        if not pet_data_raw:
            return {"error": "Pet não encontrado"}

        # ajusta formato
        pet_dict = pet_data_raw

        # procura histórico médico
        historico_lista = historico_medico_service.buscar_historico_pet(pet_id)

        # procura vacinas
        vacinas_lista = vacina_service.obter_vacinas_por_pet_id(pet_id)
        vacinas_dict = [v.model_dump() if hasattr(v, 'model_dump') else v for v in vacinas_lista]

        # procura observações
        service_obs = ServicosObservacao()
        observacoes_lista = service_obs.listar_por_pet(pet_id)

        return {
            "success": True,
            "dados_pet": pet_dict,
            "historico": historico_lista,
            "vacinas": vacinas_dict,
            "observacoes": observacoes_lista,  # Retorna a lista da nova tabela
            "total_registros": len(historico_lista) + len(vacinas_dict) + len(observacoes_lista)
        }

    except Exception as e:
        print(f"Erro ao buscar histórico completo: {e}")
        return {"error": f"Erro interno: {str(e)}"}