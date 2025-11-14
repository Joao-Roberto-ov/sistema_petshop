from pydantic import BaseModel, field_validator, EmailStr
from typing import Optional
from datetime import time


class ConfigEmpresa(BaseModel):
    endereco: str
    telefone: str
    email: EmailStr


class HorarioFuncionamento(BaseModel):
    id: Optional[int] = None
    dia_semana: str

    # Turno Manhã
    inicio_manha: Optional[str] = "08:00"  # Usando string para facilitar transporte HH:MM
    fim_manha: Optional[str] = "12:00"
    manha_ativa: bool = True

    # Turno Tarde
    inicio_tarde: Optional[str] = "13:00"
    fim_tarde: Optional[str] = "18:00"
    tarde_ativa: bool = True

    @field_validator("dia_semana")
    def validar_dia_semana(cls, v):
        dias_validos = [
            "Segunda-feira", "Terça-feira", "Quarta-feira",
            "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"
        ]
        if v not in dias_validos:
            raise ValueError("Dia da semana inválido")
        return v