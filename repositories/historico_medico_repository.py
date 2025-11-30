from datetime import date, datetime, time
from bancoDeDados import conectar, encerra_conexao
from modelos import HistoricoMedico

def adicionar_historico(historico: HistoricoMedico):
    conn = None
    cursor = None
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO historico_medico (pet_id, tipo_servico, data_hora, resumo, detalhes, funcionario_id, valor) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (historico.pet_id, historico.tipo_servico, historico.data_hora, historico.resumo, historico.detalhes,
             historico.funcionario_id, historico.valor)
        )
        historico_id = cursor.fetchone()[0]
        conn.commit()
        return historico_id
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao adicionar histórico: {e}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            encerra_conexao(conn)


def obter_historico_por_pet_id(pet_id: int):
    conn = None
    cursor = None
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute("""
                       SELECT h.id,
                              h.pet_id,
                              h.tipo_servico,
                              h.data_hora,
                              h.resumo,
                              h.detalhes,
                              h.funcionario_id,
                              h.valor,
                              f.nome as funcionario_nome
                       FROM historico_medico h
                                LEFT JOIN funcionarios f ON h.funcionario_id = f.id
                       WHERE h.pet_id = %s
                       ORDER BY h.data_hora DESC
                       """, (pet_id,))

        rows = cursor.fetchall()
        historico = []
        for row in rows:
            historico_item = {
                "id": row[0],
                "pet_id": row[1],
                "tipo_servico": row[2],
                "data_hora": row[3],
                "resumo": row[4],
                "detalhes": row[5],
                "funcionario_id": row[6],
                "valor": float(row[7]) if row[7] else None,
                "funcionario_nome": row[8]
            }
            historico.append(historico_item)
        return historico
    except Exception as e:
        print(f"Erro ao obter histórico do pet {pet_id}: {e}")
        return []
    finally:
        if cursor:
            cursor.close()
        if conn:
            encerra_conexao(conn)


def obter_detalhes_historico(historico_id: int):
    conn = None
    cursor = None
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute("""
                       SELECT h.id,
                              h.pet_id,
                              h.tipo_servico,
                              h.data_hora,
                              h.resumo,
                              h.detalhes,
                              h.funcionario_id,
                              h.valor,
                              f.nome as funcionario_nome
                       FROM historico_medico h
                                LEFT JOIN funcionarios f ON h.funcionario_id = f.id
                       WHERE h.id = %s
                       """, (historico_id,))

        row = cursor.fetchone()
        if row:
            return {
                "id": row[0],
                "pet_id": row[1],
                "tipo_servico": row[2],
                "data_hora": row[3],
                "resumo": row[4],
                "detalhes": row[5],
                "funcionario_id": row[6],
                "valor": float(row[7]) if row[7] else None,
                "funcionario_nome": row[8]
            }
        return None
    except Exception as e:
        print(f"Erro ao obter detalhes do histórico {historico_id}: {e}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            encerra_conexao(conn)

def deletar_historico(historico_id: int):
    conn = None
    cursor = None
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM historico_medico WHERE id = %s", (historico_id,))
        conn.commit()
        return True
    except Exception as e:
        if conn: conn.rollback()
        print(f"Erro ao deletar histórico: {e}")
        return False
    finally:
        if cursor: cursor.close()
        if conn: encerra_conexao(conn)


def obter_historico_por_funcionario_id(funcionario_id: int, data_inicio: date = None, data_fim: date = None):
    conn = None
    cursor = None
    try:
        conn = conectar()
        cursor = conn.cursor()

        query = """
                SELECT h.id,
                       h.pet_id,
                       p.nome as pet_nome,
                       h.tipo_servico,
                       h.data_hora,
                       h.resumo,
                       h.valor,
                       c.nome as cliente_nome
                FROM historico_medico h
                         JOIN pets p ON h.pet_id = p.id
                         JOIN clientes c ON p.cliente_id = c.id
                WHERE h.funcionario_id = %s \
                """

        params = [funcionario_id]

        if data_inicio and data_fim:
            # Ajusta para pegar o dia inteiro (00:00 até 23:59)
            query += " AND h.data_hora BETWEEN %s AND %s"

            # Converte date para datetime se necessário para garantir comparação correta
            dt_inicio = datetime.combine(data_inicio, time.min)
            dt_fim = datetime.combine(data_fim, time.max)

            params.append(dt_inicio)
            params.append(dt_fim)

        query += " ORDER BY h.data_hora DESC LIMIT 100"

        cursor.execute(query, tuple(params))

        rows = cursor.fetchall()
        historico = []
        for row in rows:
            historico.append({
                "id": row[0],
                "pet_id": row[1],
                "pet_nome": row[2],
                "tipo_servico": row[3],
                "data_hora": row[4],
                "resumo": row[5],
                "valor": float(row[6]) if row[6] else 0.0,
                "cliente_nome": row[7]
            })
        return historico
    except Exception as e:
        print(f"Erro ao obter histórico do funcionário {funcionario_id}: {e}")
        return []
    finally:
        if cursor: cursor.close()
        if conn: encerra_conexao(conn)