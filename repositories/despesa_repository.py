from bancoDeDados import conectar
from models.despesa_model import DespesaModel
from datetime import date
from typing import List

class DespesaRepository:
    @staticmethod
    def listar_todas() -> List[DespesaModel]:
        conn = conectar()
        cur = conn.cursor()
        cur.execute("SELECT id, descricao, valor, data FROM despesas ORDER BY data DESC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [DespesaModel(id=r[0], descricao=r[1], valor=r[2], data=r[3]) for r in rows]

    @staticmethod
    def buscar_por_id(despesa_id: int) -> DespesaModel | None:
        conn = conectar()
        cur = conn.cursor()
        cur.execute("SELECT id, descricao, valor, data FROM despesas WHERE id = %s", (despesa_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return None
        return DespesaModel(id=row[0], descricao=row[1], valor=row[2], data=row[3])

    @staticmethod
    def criar(despesa: DespesaModel):
        conn = conectar()
        cur = conn.cursor()
        cur.execute("INSERT INTO despesas (descricao, valor, data) VALUES (%s, %s, %s)", 
                    (despesa.descricao, despesa.valor, despesa.data))
        conn.commit()
        cur.close()
        conn.close()

    @staticmethod
    def editar(despesa_id: int, despesa: DespesaModel):
        conn = conectar()
        cur = conn.cursor()
        cur.execute("""
            UPDATE despesas
            SET descricao = %s, valor = %s, data = %s
            WHERE id = %s
        """, (despesa.descricao, despesa.valor, despesa.data, despesa_id))
        conn.commit()
        cur.close()
        conn.close()

    @staticmethod
    def deletar(despesa_id: int):
        conn = conectar()
        cur = conn.cursor()
        cur.execute("DELETE FROM despesas WHERE id = %s", (despesa_id,))
        conn.commit()
        cur.close()
        conn.close()

    @staticmethod
    def get_by_periodo(inicio: date, fim: date) -> List[DespesaModel]:
        conn = conectar()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, descricao, valor, data
            FROM despesas
            WHERE data BETWEEN %s AND %s
            ORDER BY data ASC
        """, (inicio, fim))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [DespesaModel(id=r[0], descricao=r[1], valor=r[2], data=r[3]) for r in rows]
