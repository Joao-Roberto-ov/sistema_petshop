from bancoDeDados import conectar, encerra_conexao
from modelos import ObservacaoCreate


class RepositorioObservacao:
    def criar(self, obs: ObservacaoCreate):
        conn = conectar()
        cursor = conn.cursor()
        try:
            sql = """
                  INSERT INTO observacoes_pet (pet_id, titulo, descricao, funcionario_id)
                  VALUES (%s, %s, %s, %s)
                  RETURNING id, data_criacao \
                  """
            cursor.execute(sql, (obs.pet_id, obs.titulo, obs.descricao, obs.funcionario_id))
            resultado = cursor.fetchone()
            conn.commit()
            return resultado  # (id, data_criacao)
        except Exception as e:
            if conn: conn.rollback()
            raise e
        finally:
            if conn: encerra_conexao(conn)

    def listar_por_pet(self, pet_id: int):
        conn = conectar()
        cursor = conn.cursor()
        try:
            sql = """
                  SELECT o.id, o.pet_id, o.titulo, o.descricao, o.funcionario_id, o.data_criacao, f.nome
                  FROM observacoes_pet o
                           LEFT JOIN Funcionarios f ON o.funcionario_id = f.id
                  WHERE o.pet_id = %s
                  ORDER BY o.data_criacao DESC \
                  """
            cursor.execute(sql, (pet_id,))
            rows = cursor.fetchall()

            lista = []
            for row in rows:
                lista.append({
                    "id": row[0],
                    "pet_id": row[1],
                    "titulo": row[2],
                    "descricao": row[3],
                    "funcionario_id": row[4],
                    "data_criacao": row[5],
                    "funcionario_nome": row[6]
                })
            return lista
        finally:
            if conn: encerra_conexao(conn)

    def deletar(self, obs_id: int):
        conn = conectar()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM observacoes_pet WHERE id = %s", (obs_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            if conn: encerra_conexao(conn)