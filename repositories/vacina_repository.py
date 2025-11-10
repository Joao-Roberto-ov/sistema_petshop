from bancoDeDados import conectar, encerra_conexao
from modelos import VacinaCreate, VacinaResponse
from datetime import datetime

def adicionar_vacina(vacina: VacinaCreate):
    conn = None
    cursor = None
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO vacinas (pet_id, nome_vacina, data_aplicacao, data_proxima_dose, funcionario_id) 
            VALUES (%s, %s, %s, %s, %s) 
            RETURNING id
            """,
            (vacina.pet_id, vacina.nome_vacina, vacina.data_aplicacao, vacina.data_proxima_dose, vacina.funcionario_id)
        )
        vacina_id = cursor.fetchone()[0]
        conn.commit()
        return vacina_id
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao adicionar vacina: {e}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            encerra_conexao(conn)

def obter_vacinas_por_pet_id(pet_id: int):
    conn = None
    cursor = None
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                v.id, v.pet_id, v.nome_vacina, v.data_aplicacao, v.data_proxima_dose, v.funcionario_id, f.nome as funcionario_nome
            FROM vacinas v
            LEFT JOIN funcionarios f ON v.funcionario_id = f.id
            WHERE v.pet_id = %s
            ORDER BY v.data_aplicacao DESC
            """,
            (pet_id,)
        )
        
        rows = cursor.fetchall()
        vacinas = []
        for row in rows:
            vacina_data = {
                "id": row[0],
                "pet_id": row[1],
                "nome_vacina": row[2],
                "data_aplicacao": row[3],
                "data_proxima_dose": row[4],
                "funcionario_id": row[5],
                "funcionario_nome": row[6]
            }
            # Usar VacinaResponse para validação e tipagem
            vacinas.append(VacinaResponse(**vacina_data))
        return vacinas
    except Exception as e:
        print(f"Erro ao obter vacinas do pet {pet_id}: {e}")
        return []
    finally:
        if cursor:
            cursor.close()
        if conn:
            encerra_conexao(conn)

def obter_vacina_por_id(vacina_id: int):
    conn = None
    cursor = None
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                v.id, v.pet_id, v.nome_vacina, v.data_aplicacao, v.data_proxima_dose, v.funcionario_id, f.nome as funcionario_nome
            FROM vacinas v
            LEFT JOIN funcionarios f ON v.funcionario_id = f.id
            WHERE v.id = %s
            """,
            (vacina_id,)
        )
        
        row = cursor.fetchone()
        if row:
            vacina_data = {
                "id": row[0],
                "pet_id": row[1],
                "nome_vacina": row[2],
                "data_aplicacao": row[3],
                "data_proxima_dose": row[4],
                "funcionario_id": row[5],
                "funcionario_nome": row[6]
            }
            return VacinaResponse(**vacina_data)
        return None
    except Exception as e:
        print(f"Erro ao obter vacina {vacina_id}: {e}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            encerra_conexao(conn)
