from fastapi import APIRouter, Depends, HTTPException, status
from datetime import date
from typing import List, Optional, Annotated  # Adicionado Annotated
from fastapi.security import OAuth2PasswordBearer  # <-- ADIÇÃO 1

from services.agendamento_service import ServicosAgendamento
from modelos import AgendamentoCreate, DisponibilidadeResponse, Agendamento, AgendamentoReagendar
# --- MODIFICAÇÃO DE IMPORTAÇÃO (REQ 1, 4, 6) ---
from seguranca import pegar_id_do_usuario_logado, verificar_permissao_admin, \
    decodifica_token  # Trocado verifica_token por decodifica_token

router = APIRouter(prefix="/api/agendamentos", tags=["Agendamentos"])

# --- ADIÇÃO (Necessário para a nova dependência) ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")  # Usa a rota de login unificada


# Dependência para obter o serviço de agendamento
def pegar_servicos_agendamento():
    return ServicosAgendamento()


# --- CORREÇÃO NA DEPENDÊNCIA (REQ 4) ---
# A função estava a depender de 'verifica_token' incorretamente.
# Agora depende de 'oauth2_scheme' e usa 'decodifica_token',
# igual às outras funções de segurança.
async def verificar_funcionario_logado(token: str = Depends(oauth2_scheme)) -> int:
    payload = decodifica_token(token)  # Usa decodifica_token para obter o payload

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


# --- FIM DA CORREÇÃO ---


@router.get("/disponibilidade", response_model=DisponibilidadeResponse)
async def rota_buscar_disponibilidade(
        servico_id: int,
        data_consulta: date,
        agendamento_id_excluir: Optional[int] = None,  # Para reagendamento
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento)
        # Removido o 'current_user_id' daqui, pois a busca pode ser pública
        # Se precisar de login, adicione: current_user_id: int = Depends(pegar_id_do_usuario_logado)
):
    """
    Retorna os horários de início disponíveis para um serviço numa data específica.
    Opcionalmente, pode excluir um agendamento_id da verificação de conflitos (usado para reagendar).
    """
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
        current_user_id: int = Depends(pegar_id_do_usuario_logado)  # Requer login (cliente)
):
    """
    Cria um novo agendamento para o cliente logado.
    """
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
        current_user_id: int = Depends(pegar_id_do_usuario_logado)  # Requer login (cliente)
):
    """Lista os agendamentos (incluindo cancelados) do cliente logado."""
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
        current_user_id: int = Depends(pegar_id_do_usuario_logado)  # Requer login (cliente)
):
    """
    Reagenda um agendamento existente (AC3, AC4).
    Verifica posse, validade do novo horário e conflitos (excluindo a si mesmo).
    """
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
        current_user_id: int = Depends(pegar_id_do_usuario_logado)  # Requer login (cliente)
):
    """
    Cancela um agendamento existente (AC1, AC2, AC4).
    Apenas o próprio cliente pode cancelar.
    Aplica regras de negócio de 24h de antecedência.
    """
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


# --- NOVAS ROTAS PARA DASHBOARDS (REQ 4 e 6) ---

@router.get("/proximos", response_model=List[dict])
async def rota_listar_agendamentos_proximos(
        # Parâmetro sem default (Dependência) vem primeiro
        current_funcionario_id: int = Depends(verificar_funcionario_logado),
        # Parâmetro com default vem depois
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento)
):
    """
    Lista os próximos agendamentos (status 'Agendado' e data futura).
    Usado pelo dashboard do funcionário. Requer login de funcionário. (Req 4)
    """
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
        # Parâmetro sem default (Dependência) vem primeiro
        admin_id: Annotated[int, Depends(verificar_permissao_admin)],
        # Parâmetro com default vem depois
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento)
):
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

    try:
        resultado = service.cancelar_agendamento_gestor(agendamento_id)
        return resultado
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erro ao cancelar agendamento (gestor) {agendamento_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao processar o cancelamento."
        )