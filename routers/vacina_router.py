from fastapi import APIRouter, Depends, HTTPException, status
from modelos import VacinaCreate, VacinaResponse
from services import vacina_service
from seguranca import obter_usuario_logado
from typing import List

router = APIRouter(
    prefix="/api/vacinas", 
    tags=["Vacinas"]
)

@router.post("/", response_model=VacinaResponse, status_code=status.HTTP_201_CREATED)
def adicionar_vacina(vacina: VacinaCreate, usuario: dict = Depends(obter_usuario_logado)):
    """Adiciona um novo registro de vacina para um pet. Apenas funcionários podem adicionar."""
    if usuario.get("tipo") not in ["funcionario", "gestor", "veterinario"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas funcionários podem adicionar registros de vacina."
        )
    
    try:
        # Adiciona o ID do funcionário que está registrando
        vacina.funcionario_id = usuario.get("id")
        vacina_id = vacina_service.adicionar_vacina(vacina)
        
        # Retorna o objeto completo da vacina recém-criada
        vacina_completa = vacina_service.obter_vacina_por_id(vacina_id)
        if not vacina_completa:
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao recuperar vacina recém-criada."
            )
        return vacina_completa
    except Exception as e:
        print(f"Erro ao adicionar vacina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao processar a requisição."
        )

@router.get("/pet/{pet_id}", response_model=List[VacinaResponse])
def obter_vacinas_pet(pet_id: int, usuario: dict = Depends(obter_usuario_logado)):
    """Obtém a carteira de vacinação de um pet. Clientes só podem ver a de seus próprios pets."""
    
    try:
        vacinas = vacina_service.obter_vacinas_por_pet_id(pet_id)
        return vacinas
    except Exception as e:
        print(f"Erro ao obter vacinas do pet {pet_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar a carteira de vacinação."
        )