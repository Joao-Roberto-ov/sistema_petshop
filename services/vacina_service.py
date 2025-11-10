from repositories import vacina_repository
from modelos import VacinaCreate, VacinaResponse
from typing import List
from datetime import datetime, timedelta

def calcular_proxima_dose(nome_vacina: str, data_aplicacao: datetime, especie_pet: str):
    """
    Calcula a próxima dose da vacina baseado no tipo de vacina e espécie do pet
    """
    nome_vacina_lower = nome_vacina.lower()
    especie_lower = especie_pet.lower()
    
    # VACINAS PARA CÃES
    if any(palavra in especie_lower for palavra in ['cão', 'cachorro', 'cao', 'canino']):
        if any(palavra in nome_vacina_lower for palavra in ['polivalente', 'v8', 'v10']):
            # Polivalente (V8/V10) - reforço anual
            return data_aplicacao.replace(year=data_aplicacao.year + 1)
        elif any(palavra in nome_vacina_lower for palavra in ['antirrábica', 'raiva']):
            # Antirrábica - reforço anual
            return data_aplicacao.replace(year=data_aplicacao.year + 1)
        elif any(palavra in nome_vacina_lower for palavra in ['gripe', 'tosse', 'bordetella']):
            # Gripe Canina - reforço anual
            return data_aplicacao.replace(year=data_aplicacao.year + 1)
        elif any(palavra in nome_vacina_lower for palavra in ['giárdia', 'giardia']):
            # Giárdia - reforço anual
            return data_aplicacao.replace(year=data_aplicacao.year + 1)
    
    # VACINAS PARA GATOS
    elif any(palavra in especie_lower for palavra in ['gato', 'felino']):
        if any(palavra in nome_vacina_lower for palavra in ['polivalente', 'v3', 'v4', 'v5']):
            # Polivalente felina - reforço anual
            return data_aplicacao.replace(year=data_aplicacao.year + 1)
        elif any(palavra in nome_vacina_lower for palavra in ['antirrábica', 'raiva']):
            # Antirrábica - reforço anual
            return data_aplicacao.replace(year=data_aplicacao.year + 1)
        elif any(palavra in nome_vacina_lower for palavra in ['leucemia', 'felv']):
            # Leucemia Felina - reforço anual
            return data_aplicacao.replace(year=data_aplicacao.year + 1)
    
    # Vacina genérica - padrão anual (1 ano)
    return data_aplicacao.replace(year=data_aplicacao.year + 1)

def adicionar_vacina(vacina: VacinaCreate, especie_pet: str = "") -> int:
    """Adiciona um registro de vacina com cálculo automático da próxima dose."""
    try:
        # Se não foi informada data da próxima dose, calcular automaticamente
        if not vacina.data_proxima_dose and vacina.data_aplicacao and especie_pet:
            # Converter string para datetime se necessário
            if isinstance(vacina.data_aplicacao, str):
                data_app = datetime.fromisoformat(vacina.data_aplicacao.replace('Z', '+00:00'))
            else:
                data_app = vacina.data_aplicacao
            
            proxima_dose = calcular_proxima_dose(vacina.nome_vacina, data_app, especie_pet)
            vacina.data_proxima_dose = proxima_dose.date() if hasattr(proxima_dose, 'date') else proxima_dose
        
        return vacina_repository.adicionar_vacina(vacina)
    except Exception as e:
        print(f"Erro ao adicionar vacina com cálculo automático: {e}")
        # Fallback: adicionar sem cálculo automático
        return vacina_repository.adicionar_vacina(vacina)

def obter_vacinas_por_pet_id(pet_id: int) -> List[VacinaResponse]:
    """Obtém todas as vacinas registradas para um pet."""
    return vacina_repository.obter_vacinas_por_pet_id(pet_id)

def obter_vacina_por_id(vacina_id: int) -> VacinaResponse:
    """Obtém os detalhes de uma vacina específica."""
    return vacina_repository.obter_vacina_por_id(vacina_id)

def obter_informacoes_vacina(nome_vacina: str, especie_pet: str) -> dict:
    """
    Retorna informações detalhadas sobre uma vacina específica
    """
    nome_vacina_lower = nome_vacina.lower()
    especie_lower = especie_pet.lower()
    
    # 🐶 VACINAS PARA CÃES
    if any(palavra in especie_lower for palavra in ['cão', 'cachorro', 'cao', 'canino']):
        if any(palavra in nome_vacina_lower for palavra in ['polivalente', 'v8', 'v10']):
            return {
                "descricao": "Protege contra: cinomose, hepatite, leptospirose, parvovirose, parainfluenza, adenovirose",
                "esquema": "Reforço anual obrigatório",
                "protecoes": ["Cinomose", "Hepatite", "Leptospirose", "Parvovirose", "Parainfluenza", "Adenovirose"],
                "tipo": "Essencial"
            }
        elif any(palavra in nome_vacina_lower for palavra in ['antirrábica', 'raiva']):
            return {
                "descricao": "Protege contra raiva (fatal e transmissível para humanos)",
                "esquema": "Reforço anual obrigatório",
                "protecoes": ["Raiva"],
                "tipo": "Obrigatória por lei"
            }
        elif any(palavra in nome_vacina_lower for palavra in ['gripe', 'tosse', 'bordetella']):
            return {
                "descricao": "Protege contra Bordetella bronchiseptica e parainfluenza canina",
                "esquema": "Reforço anual recomendado",
                "protecoes": ["Tosse dos Canis", "Bordetella", "Parainfluenza"],
                "tipo": "Recomendada"
            }
        elif any(palavra in nome_vacina_lower for palavra in ['giárdia', 'giardia']):
            return {
                "descricao": "Protege contra Giardíase (infecção intestinal)",
                "esquema": "Reforço anual opcional",
                "protecoes": ["Giardíase"],
                "tipo": "Opcional"
            }
    
    # 🐱 VACINAS PARA GATOS
    elif any(palavra in especie_lower for palavra in ['gato', 'felino']):
        if any(palavra in nome_vacina_lower for palavra in ['polivalente', 'v3', 'v4', 'v5']):
            return {
                "descricao": "Protege contra: rinotraqueíte, calicivirose, panleucopenia",
                "esquema": "Reforço anual obrigatório",
                "protecoes": ["Rinotraqueíte", "Calicivirose", "Panleucopenia"],
                "tipo": "Essencial"
            }
        elif any(palavra in nome_vacina_lower for palavra in ['antirrábica', 'raiva']):
            return {
                "descricao": "Protege contra raiva",
                "esquema": "Reforço anual obrigatório",
                "protecoes": ["Raiva"],
                "tipo": "Obrigatória por lei"
            }
        elif any(palavra in nome_vacina_lower for palavra in ['leucemia', 'felv']):
            return {
                "descricao": "Protege contra Leucemia Felina (recomendada para gatos que saem de casa)",
                "esquema": "Reforço anual recomendado",
                "protecoes": ["Leucemia Felina"],
                "tipo": "Recomendada"
            }
    
    # Vacina genérica
    return {
        "descricao": "Vacina de proteção geral",
        "esquema": "Consulte o veterinário para reforço",
        "protecoes": ["Proteção geral"],
        "tipo": "Genérica"
    }

def verificar_vacinas_pendentes(pet_id: int) -> List[VacinaResponse]:
    """
    Retorna as vacinas que estão com próxima dose vencida ou próxima do vencimento
    """
    vacinas = obter_vacinas_por_pet_id(pet_id)
    hoje = datetime.now().date()
    
    vacinas_pendentes = []
    
    for vacina in vacinas:
        if vacina.data_proxima_dose:
            data_proxima = vacina.data_proxima_dose
            if isinstance(data_proxima, str):
                data_proxima = datetime.fromisoformat(data_proxima.replace('Z', '+00:00')).date()
            
            # Verificar se está vencida ou vence em até 30 dias
            dias_para_vencer = (data_proxima - hoje).days
            if dias_para_vencer <= 30:
                vacinas_pendentes.append(vacina)
    
    return vacinas_pendentes

def obter_esquema_vacinal_recomendado(especie_pet: str, idade_meses: int = None) -> List[dict]:
    """
    Retorna o esquema vacinal recomendado baseado na espécie e idade do pet
    """
    especie_lower = especie_pet.lower()
    
    if any(palavra in especie_lower for palavra in ['cão', 'cachorro', 'cao', 'canino']):
        return [
            {
                "vacina": "Polivalente (V8/V10)",
                "idade_filhote": "45, 75 e 105 dias",
                "reforco": "Anual",
                "obrigatoria": True,
                "descricao": "Proteção múltipla contra doenças caninas graves"
            },
            {
                "vacina": "Antirrábica",
                "idade_filhote": "4 meses",
                "reforco": "Anual",
                "obrigatoria": True,
                "descricao": "Proteção contra raiva - obrigatória por lei"
            },
            {
                "vacina": "Gripe Canina",
                "idade_filhote": "2 doses com 15-30 dias de intervalo",
                "reforco": "Anual",
                "obrigatoria": False,
                "descricao": "Proteção contra tosse dos canis"
            },
            {
                "vacina": "Giárdia",
                "idade_filhote": "2 doses com 15-21 dias de intervalo",
                "reforco": "Anual",
                "obrigatoria": False,
                "descricao": "Proteção contra infecção intestinal"
            }
        ]
    elif any(palavra in especie_lower for palavra in ['gato', 'felino']):
        return [
            {
                "vacina": "Polivalente (V3/V4/V5)",
                "idade_filhote": "60, 90 e 120 dias",
                "reforco": "Anual",
                "obrigatoria": True,
                "descricao": "Proteção múltipla contra doenças felinas graves"
            },
            {
                "vacina": "Antirrábica",
                "idade_filhote": "4 meses",
                "reforco": "Anual",
                "obrigatoria": True,
                "descricao": "Proteção contra raiva - obrigatória por lei"
            },
            {
                "vacina": "Leucemia Felina (FeLV)",
                "idade_filhote": "2 doses com 21-30 dias de intervalo",
                "reforco": "Anual",
                "obrigatoria": False,
                "descricao": "Recomendada para gatos com acesso à rua"
            }
        ]
    
    return []