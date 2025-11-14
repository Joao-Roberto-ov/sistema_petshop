from models.config_model import ConfigEmpresa
from bancoDeDados import conectar, encerra_conexao

def carregar_config():
    conn = conectar()
    if not conn:
        return None

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT endereco, telefone, email FROM configuracao_empresa WHERE id = 1")
        row = cursor.fetchone()

        if row:
            return {
                "endereco": row[0] or "",
                "telefone": row[1] or "",
                "email": row[2] or ""
            }
        else:
            return {
                "endereco": "",
                "telefone": "",
                "email": ""
            }
    finally:
        encerra_conexao(conn)


def salvar_config(config: ConfigEmpresa):
    conn = conectar()
    if not conn:
        raise Exception("Erro de conexão com o banco")

    try:
        cursor = conn.cursor()
        cursor.execute("""
                       UPDATE configuracao_empresa
                       SET endereco = %s,
                           telefone = %s,
                           email    = %s
                       WHERE id = 1
                       """, (config.endereco, config.telefone, config.email))
        conn.commit()
    finally:
        encerra_conexao(conn)


# horários de funcionamento

def listar_horarios():
    conn = conectar()
    if not conn:
        raise Exception("Erro ao conectar ao banco de dados")

    try:
        cursor = conn.cursor()
        # A ordem é importante para o frontend: Segunda a Domingo
        # Vamos usar um CASE para ordenar corretamente ou confiar na ordem de inserção (ID)
        cursor.execute("""
                       SELECT id,
                              dia_semana,
                              inicio_manha,
                              fim_manha,
                              manha_ativa,
                              inicio_tarde,
                              fim_tarde,
                              tarde_ativa
                       FROM horarios_funcionamento
                       ORDER BY id ASC
                       """)
        rows = cursor.fetchall()
        return [
            {
                "id": r[0],
                "dia_semana": r[1],
                "inicio_manha": str(r[2])[:5] if r[2] else "",
                "fim_manha": str(r[3])[:5] if r[3] else "",
                "manha_ativa": r[4],
                "inicio_tarde": str(r[5])[:5] if r[5] else "",
                "fim_tarde": str(r[6])[:5] if r[6] else "",
                "tarde_ativa": r[7]
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
            SET inicio_manha = %s,
                fim_manha    = %s,
                manha_ativa  = %s,
                inicio_tarde = %s,
                fim_tarde    = %s,
                tarde_ativa  = %s
            WHERE id = %s
            """,
            (
                horario.inicio_manha, horario.fim_manha, horario.manha_ativa,
                horario.inicio_tarde, horario.fim_tarde, horario.tarde_ativa,
                id
            )
        )
        conn.commit()
    finally:
        encerra_conexao(conn)


 # def criar_horario(horario):
 #    conn = conectar()
 #    if not conn:
 #        raise Exception("Erro ao conectar ao banco de dados")
 #
 #    try:
 #        cursor = conn.cursor()
 #        cursor.execute(
 #            """
 #            INSERT INTO horarios_funcionamento (dia_semana, abre, fecha, fechado)
 #            VALUES (%s, %s, %s, %s)
 #            RETURNING id, dia_semana, abre, fecha, fechado
 #            """,
 #            (horario.dia_semana, horario.abre, horario.fecha, horario.fechado)
 #        )
 #        row = cursor.fetchone()
 #        conn.commit()
 #        return {
 #            "id": row[0],
 #            "dia_semana": row[1],
 #            "abre": str(row[2]) if row[2] else None,
 #            "fecha": str(row[3]) if row[3] else None,
 #            "fechado": row[4]
 #        }
 #    finally:
 #        encerra_conexao(conn)


# def deletar_horario(id: int):
#     conn = conectar()
#     if not conn:
#         raise Exception("Erro ao conectar ao banco de dados")
#
#     try:
#         cursor = conn.cursor()
#         cursor.execute("DELETE FROM horarios_funcionamento WHERE id = %s", (id,))
#         conn.commit()
#         return {"mensagem": "Horário removido com sucesso"}
#     finally:
#         encerra_conexao(conn)