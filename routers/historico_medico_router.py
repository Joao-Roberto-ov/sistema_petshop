from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from modelos import HistoricoMedico, HistoricoMedicoResponse
from services import historico_medico_service
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
    historico.funcionario_id = funcionario["id"]
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
        from services.pet_service import ServicosPet
        service_pet = ServicosPet()
        
        # Se for cliente, verificar se o pet pertence a ele
        if usuario.get("tipo") == "cliente":
            pet_data = service_pet.buscar_pet_por_id(pet_id)
            if not pet_data or pet_data.get("cliente_id") != usuario.get("id"):
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
        
        # Verificar se o usuário tem acesso a este registro
        from services.pet_service import ServicosPet
        service_pet = ServicosPet()
        
        pet_data = service_pet.buscar_pet_por_id(historico["pet_id"])
        if not pet_data:
            raise HTTPException(status_code=404, detail="Pet não encontrado")
            
        if usuario.get("tipo") == "cliente" and pet_data.get("cliente_id") != usuario.get("id"):
            raise HTTPException(
                status_code=403,
                detail="Você não tem permissão para acessar este registro"
            )
        
        return historico
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar detalhes: {str(e)}")

# CORREÇÃO: Adicionar rota de teste
@router.post("/teste/{pet_id}")
def criar_consulta_teste_rota(
    pet_id: int,
    funcionario: dict = Depends(obter_funcionario_logado)
):
    """
    Rota para criar uma consulta de teste (apenas para desenvolvimento)
    """
    try:
        from datetime import datetime, timezone
        from modelos import HistoricoMedico
        
        consulta_teste = HistoricoMedico(
            pet_id=pet_id,
            tipo_servico="Consulta",
            data_hora=datetime.now(timezone.utc),
            resumo="Consulta de teste - Desenvolvimento",
            detalhes="Esta é uma consulta de teste criada para verificar o funcionamento do histórico médico. Pet em bom estado geral, exames normais.",
            funcionario_id=funcionario["id"],
            valor=100.00
        )
        
        historico_id = historico_medico_service.registrar_historico(consulta_teste)
        
        if historico_id:
            return {
                "message": "Consulta de teste criada com sucesso!",
                "historico_id": historico_id,
                "pet_id": pet_id
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Erro ao criar consulta de teste"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar consulta de teste: {str(e)}"
        )
    
@router.get("/public/pet/{pet_id}")
def obter_historico_publico(pet_id: int):
    """
    Rota pública para teste (REMOVER EM PRODUÇÃO)
    """
    try:
        historico = historico_medico_service.buscar_historico_pet(pet_id)
        return {
            "success": True,
            "pet_id": pet_id,
            "historico": historico,
            "total_registros": len(historico)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")