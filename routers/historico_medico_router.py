from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import List, Optional
from modelos import HistoricoMedico, HistoricoMedicoResponse, CriarVenda, CriarItemVenda
from repositories import historico_medico_repository
from services import historico_medico_service, vacina_service
from services.observacao_service import ServicosObservacao
from services.pet_service import ServicosPet
from services.venda_service import ServicosVenda
from seguranca import decodifica_token

router = APIRouter(
    prefix="/historico",
    tags=["Historico Medico"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


async def obter_usuario_logado(token: str = Depends(oauth2_scheme)):
    """Obtém o usuário logado a partir do token no Header"""
    payload = decodifica_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado"
        )
    return payload


async def obter_funcionario_logado(token: str = Depends(oauth2_scheme)):
    """Obtém o funcionário logado a partir do token no Header"""
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


def pegar_servico_venda():
    return ServicosVenda()


def pegar_servicos_pet():
    return ServicosPet()


@router.post("/", response_model=HistoricoMedicoResponse, status_code=status.HTTP_201_CREATED)
def registrar_historico(
        historico: HistoricoMedico,
        funcionario: dict = Depends(obter_funcionario_logado),
        srv_venda: ServicosVenda = Depends(pegar_servico_venda),
        srv_pet: ServicosPet = Depends(pegar_servicos_pet)
):
    # 1. Registra o histórico médico
    historico.funcionario_id = int(funcionario["sub"])
    historico_id = historico_medico_service.registrar_historico(historico)

    if not historico_id:
        raise HTTPException(status_code=500, detail="Erro ao registrar histórico.")

    # 2. (REQ 2) Se tiver valor, cria uma VENDA PENDENTE automaticamente
    if historico.valor and historico.valor > 0:
        try:
            # Busca o dono do pet para vincular a venda
            pet_dados = srv_pet.buscar_pet_por_id(historico.pet_id)  # Retorna tupla/dict

            # Ajuste para pegar o ID do cliente dependendo se retorna tupla ou dict
            if isinstance(pet_dados, tuple):
                cliente_id = pet_dados[8]
            else:
                cliente_id = pet_dados.get('cliente_id')

            # Cria o item da venda representando a consulta
            item_venda = CriarItemVenda(
                tipo="servico",
                id_item=9999,  # ID genérico para consulta avulsa
                nome=f"{historico.tipo_servico} (Pet ID: {historico.pet_id})",
                quantidade=1,
                preco_unitario=historico.valor,
                info_agendamento=None
            )

            dados_venda = CriarVenda(
                cliente_id=cliente_id,
                forma_pagamento="A Definir",  # Será definido no caixa
                itens=[item_venda]
            )

            # Registra a venda
            srv_venda.registrar_venda(dados_venda, historico.funcionario_id)
            print(f"✅ Venda automática criada para histórico #{historico_id}")

        except Exception as e:
            print(f"⚠️ Aviso: Histórico salvo, mas falha ao criar venda automática: {e}")
            # Não impedimos o retorno do histórico se a venda falhar, mas logamos o erro

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


# --- Rota para o Dashboard do Veterinário (REQ 3) ---
@router.get("/meus-atendimentos", status_code=status.HTTP_200_OK)
def listar_meus_atendimentos(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    funcionario: dict = Depends(obter_funcionario_logado)
):
    """Lista o histórico de atendimentos realizados pelo funcionário logado com filtro de data."""
    func_id = int(funcionario["sub"])
    return historico_medico_repository.obter_historico_por_funcionario_id(func_id, data_inicio, data_fim)


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
            "observacoes": observacoes_lista,
            "total_registros": len(historico_lista) + len(vacinas_dict) + len(observacoes_lista)
        }

    except Exception as e:
        print(f"Erro ao buscar histórico completo: {e}")
        return {"error": f"Erro interno: {str(e)}"}