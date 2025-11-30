from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse  # Importante!
from datetime import date, datetime
from typing import List, Optional, Annotated
from fastapi.security import OAuth2PasswordBearer
import traceback

from services.agendamento_service import ServicosAgendamento
from modelos import AgendamentoCreate, DisponibilidadeResponse, Agendamento, AgendamentoReagendar
from seguranca import pegar_id_do_usuario_logado, verificar_permissao_admin, decodifica_token

router = APIRouter(prefix="/api/agendamentos", tags=["Agendamentos"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


# dependencia para obter o serviço de agendamento
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


# rotas para açoes com email

@router.get("/{agendamento_id}/confirmar-email", response_class=HTMLResponse)
async def confirmar_agendamento_email(
        agendamento_id: int,
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento)
):
    try:
        service.confirmar_agendamento(agendamento_id)

        return """
        <html>
            <head><title>Confirmado</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f4f4f4;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                    <h1 style="color: #27ae60; margin-bottom: 10px;">✅ Presença Confirmada!</h1>
                    <p style="color: #555; font-size: 18px;">Obrigado por confirmar seu agendamento.</p>
                    <p style="color: #888;">Estamos aguardando você e seu pet na PetLife.</p>
                </div>
            </body>
        </html>
        """
    except HTTPException as e:
        return f"""
        <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #e74c3c;">Não foi possível confirmar</h1>
                <p>{e.detail}</p>
            </body>
        </html>
        """


@router.get("/{agendamento_id}/cancelar-email", response_class=HTMLResponse)
async def cancelar_agendamento_email(
        agendamento_id: int,
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento)
):
    try:
        # Chama o metodo específico que não exige token de usuário
        sucesso, mensagem = service.cancelar_agendamento_via_email(agendamento_id)

        cor = "#e74c3c" if not sucesso else "#f39c12"
        titulo = "Erro" if not sucesso else "Agendamento Cancelado"

        return f"""
        <html>
            <head><title>Cancelamento</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f4f4f4;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                    <h1 style="color: {cor}; margin-bottom: 10px;">{titulo}</h1>
                    <p style="color: #555; font-size: 18px;">{mensagem}</p>
                    <p style="color: #888;">Caso queira remarcar, entre em contato conosco ou acesse o sistema.</p>
                </div>
            </body>
        </html>
        """
    except Exception as e:
        return f"<html><body><h1>Erro Interno</h1><p>{str(e)}</p></body></html>"


# --- ROTA PARA API (Se ainda for usada pelo front) ---
@router.post("/{agendamento_id}/confirmar", status_code=status.HTTP_200_OK)
async def rota_confirmar_agendamento(
        agendamento_id: int,
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento)
):
    try:
        resultado = service.confirmar_agendamento(agendamento_id)
        return resultado
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Erro ao confirmar agendamento {agendamento_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao confirmar presença."
        )


# rotas de funcionarios e gestores

@router.get("/proximos", response_model=List[dict])
async def rota_listar_agendamentos_proximos(
        current_funcionario_id: int = Depends(verificar_funcionario_logado),
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento)
):
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
            detail="Erro interno ao processar o cancelamento pelo gestor."
        )


@router.put("/admin/{agendamento_id}/reagendar", status_code=status.HTTP_200_OK)
async def rota_reagendar_agendamento_gestor(
        agendamento_id: int,
        reagendamento_data: AgendamentoReagendar,
        admin_id: Annotated[int, Depends(verificar_permissao_admin)],
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento)
):
    try:
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


@router.put("/{agendamento_id}/assumir", status_code=status.HTTP_200_OK)
async def rota_assumir_agendamento(
        agendamento_id: int,
        funcionario_id: int = Depends(verificar_funcionario_logado),
        service: ServicosAgendamento = Depends(pegar_servicos_agendamento)
):
    try:
        resultado = service.assumir_agendamento(agendamento_id, funcionario_id)
        return resultado
    except HTTPException as e:
        if e.status_code == 409:
            raise HTTPException(status_code=409, detail=e.detail)
        raise e
    except Exception as e:
        print(f"Erro inesperado ao assumir agendamento {agendamento_id}: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao processar a solicitação."
        )