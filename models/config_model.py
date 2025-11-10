from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import time

class ConfigEmpresa(BaseModel):
    nome_empresa: str
    endereco: str
    telefone: str
    logo_url: str

class HorarioFuncionamento(BaseModel):
    id: Optional[int] = None
    dia_semana: str
    abre: time
    fecha: time
    fechado: bool = False

    @field_validator("dia_semana")
    def validar_dia_semana(cls, v):
        dias_validos = [
            "Segunda-feira", "Terça-feira", "Quarta-feira",
            "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"
        ]
        if v not in dias_validos:
            raise ValueError("Dia da semana inválido")
        return v