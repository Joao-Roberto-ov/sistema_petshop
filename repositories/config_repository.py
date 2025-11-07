import json
from models.config_model import ConfigEmpresa
from bancoDeDados import conectar, encerra_conexao 
CONFIG_PATH = "config/config.json"

# -------- Configurações gerais da empresa --------

def carregar_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def salvar_config(config: ConfigEmpresa):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config.dict(), f, indent=4, ensure_ascii=False)

# -------- Horários de funcionamento --------

def listar_horarios():
    conn = conectar()
    if not conn:
        raise Exception("Erro ao conectar ao banco de dados")
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, dia_semana, abre, fecha, fechado FROM horarios_funcionamento ORDER BY id")
        rows = cursor.fetchall()
        return [
            {
                "id": r[0],
                "dia_semana": r[1],
                "abre": str(r[2]) if r[2] else None,
                "fecha": str(r[3]) if r[3] else None,
                "fechado": r[4]
            } for r in rows
        ]
    finally:
        encerra_conexao(conn)

def atualizar_horario(id: int, horario):
    conn = conectar()
    if not conn:
        raise Exception("Erro ao conectar ao banco de dados")
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE horarios_funcionamento
            SET dia_semana = %s, abre = %s, fecha = %s, fechado = %s
            WHERE id = %s
            """,
            (horario.dia_semana, horario.abre, horario.fecha, horario.fechado, id)
        )
        conn.commit()
    finally:
        encerra_conexao(conn)

def criar_horario(horario):
    conn = conectar()
    if not conn:
        raise Exception("Erro ao conectar ao banco de dados")
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO horarios_funcionamento (dia_semana, abre, fecha, fechado)
            VALUES (%s, %s, %s, %s)
            RETURNING id, dia_semana, abre, fecha, fechado
            """,
            (horario.dia_semana, horario.abre, horario.fecha, horario.fechado)
        )
        row = cursor.fetchone()
        conn.commit()
        return {
            "id": row[0],
            "dia_semana": row[1],
            "abre": str(row[2]) if row[2] else None,
            "fecha": str(row[3]) if row[3] else None,
            "fechado": row[4]
        }
    finally:
        encerra_conexao(conn)


def deletar_horario(id: int):
    conn = conectar()
    if not conn:
        raise Exception("Erro ao conectar ao banco de dados")
    
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM horarios_funcionamento WHERE id = %s", (id,))
        conn.commit()
        return {"mensagem": "Horário removido com sucesso"}
    finally:
        encerra_conexao(conn)
