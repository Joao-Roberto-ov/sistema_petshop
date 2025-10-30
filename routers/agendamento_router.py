from fastapi import APIRouter, Depends, HTTPException, status
from datetime import date, datetime
from typing import List, Optional, Annotated
from fastapi.security import OAuth2PasswordBearer
import traceback

from services.agendamento_service import ServicosAgendamento
from modelos import AgendamentoCreate, DisponibilidadeResponse, Agendamento, AgendamentoReagendar
from seguranca import pegar_id_do_usuario_logado, verificar_permissao_admin, decodifica_token

router = APIRouter(prefix="/api/agendamentos", tags=["Agendamentos"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

#dependencia para obter o serviço de agendamento
def pegar_servicos_agendamento():
    return ServicosAgendamento()

async def verificar_funcionario_logado(token: str = Depends(oauth2_scheme)) -> int:
    payload = decodifica_token(token)

    if not payload or payload.get("tipo") != "funcionario":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Rota apenas para funcionários."
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: ID do usuário não encontrado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return int(user_id)


@router.get("/disponibilidade", response_model=DisponibilidadeResponse)
async def rota_buscar_disponibilidade(
        servico_id: int,
        data_consulta: date,
        agendamento_id_excluir: Optional[int] = None,
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento)
):

    #retorna os horarios de inicio disponiveis para um serviço numa data especifica

    try:
        disponibilidade = service.buscar_disponibilidade_servico(
            servico_id,
            data_consulta,
            agendamento_id_excluir
        )
        return disponibilidade
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erro ao buscar disponibilidade: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao calcular disponibilidade."
        )


@router.post("", status_code=status.HTTP_201_CREATED)
async def rota_criar_agendamento(
        agendamento_data: AgendamentoCreate,
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento),
        current_user_id: int = Depends(pegar_id_do_usuario_logado)
):
    #cria um novo agendamento para o cliente logado

    try:
        resultado = service.criar_agendamento(agendamento_data, current_user_id)
        return resultado
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erro inesperado ao criar agendamento: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao processar o agendamento."
        )


@router.get("/meus", response_model=List[dict])
async def rota_listar_meus_agendamentos(
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento),
        current_user_id: int = Depends(pegar_id_do_usuario_logado)
):
    #lista os agendamentos (incluindo cancelados) do cliente logado
    try:
        agendamentos = service.listar_agendamentos_cliente(current_user_id)
        return agendamentos
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erro ao listar agendamentos do cliente {current_user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar seus agendamentos."
        )


@router.put("/{agendamento_id}/reagendar", status_code=status.HTTP_200_OK)
async def rota_reagendar_agendamento(
        agendamento_id: int,
        reagendamento_data: AgendamentoReagendar,
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento),
        current_user_id: int = Depends(pegar_id_do_usuario_logado)
):

    #reagenda um agendamento existente (login cliente), verifica a posse, valida o novo horario e conflitos

    try:
        resultado = service.reagendar_agendamento(
            agendamento_id,
            reagendamento_data.nova_data_hora_inicio,
            current_user_id
        )
        return resultado
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erro inesperado ao reagendar agendamento {agendamento_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao processar o reagendamento."
        )


@router.put("/{agendamento_id}/cancelar", status_code=status.HTTP_200_OK)
async def rota_cancelar_agendamento(
        agendamento_id: int,
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento),
        current_user_id: int = Depends(pegar_id_do_usuario_logado)
):

    # Cancela um agendamento existente (login cliente). apenas o proprio cliente pode cancelar.

    try:
        resultado = service.cancelar_agendamento(agendamento_id, current_user_id)
        return resultado
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erro inesperado ao cancelar agendamento {agendamento_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao processar o cancelamento."
        )


# rotas de funcionarios e gestores

@router.get("/proximos", response_model=List[dict])
async def rota_listar_agendamentos_proximos(
        current_funcionario_id: int = Depends(verificar_funcionario_logado),
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento)
):

    #lista os próximos agendamentos (Agendado e datas futuras), usa isso pelo dashboard do funcionário

    try:
        agendamentos = service.listar_agendamentos_proximos()
        return agendamentos
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erro ao listar próximos agendamentos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar próximos agendamentos."
        )


@router.get("/todos-gestor", response_model=List[dict])
async def rota_listar_todos_agendamentos_gestor(
        admin_id: Annotated[int, Depends(verificar_permissao_admin)],
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento)
):

    #mostra todos os agendamentos do sistema (passados e futuros, cancelados e ativos), usa isso pelo dashboard do gestor

    try:
        agendamentos = service.listar_todos_agendamentos_gestor()
        return agendamentos
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erro ao listar todos os agendamentos para gestor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar todos os agendamentos."
        )

@router.put("/admin/{agendamento_id}/cancelar", status_code=status.HTTP_200_OK)
async def rota_cancelar_agendamento_gestor(
    agendamento_id: int,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosAgendamento = Depends(pegar_servicos_agendamento)
):
    # Permite que um Gestor cancele qualquer agendamento futuro.
    try:
        resultado = service.cancelar_agendamento_gestor(agendamento_id)
        return resultado
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erro ao cancelar agendamento (gestor) {agendamento_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao processar o cancelamento pelo gestor."
        )

@router.put("/admin/{agendamento_id}/reagendar", status_code=status.HTTP_200_OK)
async def rota_reagendar_agendamento_gestor(
    agendamento_id: int,
    reagendamento_data: AgendamentoReagendar,
    admin_id: Annotated[int, Depends(verificar_permissao_admin)],
    service: ServicosAgendamento = Depends(pegar_servicos_agendamento)
):
    # Permite que um Gestor reagende qualquer agendamento existente.
    try:
        #chama o metodo do serviço especifico para gestor
        resultado = service.reagendar_agendamento_gestor(
            agendamento_id,
            reagendamento_data.nova_data_hora_inicio
        )
        return resultado
    except HTTPException as e:
        raise e
    except Exception as e:
        # Captura erros inesperados
        print(f"Erro inesperado ao reagendar (gestor) agendamento {agendamento_id}: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao processar o reagendamento pelo gestor."
        )