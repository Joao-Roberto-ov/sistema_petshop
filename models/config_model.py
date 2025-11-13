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