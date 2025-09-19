from bancoDeDados import conectar, encerra_conexao
from modelos import PetUpdate

class RepositorioPet:
    def cadastrar_pet(self, pet_dados, cliente_id: int):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = """
                  INSERT INTO Pets (nome, tipo, raca, idade, peso, cliente_id)
                  VALUES (%s, %s, %s, %s, %s, %s)
                  """
            cursor.execute(sql, (pet_dados.nome, pet_dados.tipo, pet_dados.raca, pet_dados.idade, pet_dados.peso,
                                 cliente_id))
            conn.commit()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_pets_por_cliente_id(self, cliente_id: int):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT id, nome, tipo, raca, idade, peso FROM Pets WHERE cliente_id = %s ORDER BY nome"
            cursor.execute(sql, (cliente_id,))
            return cursor.fetchall()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_pet_por_id_e_cliente_id(self, pet_id: int, cliente_id: int):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT id FROM Pets WHERE id = %s AND cliente_id = %s"
            cursor.execute(sql, (pet_id, cliente_id))
            return cursor.fetchone()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_consultas_por_pet_id(self, pet_id: int):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT servico_realizado, funcionario, data_hora, valor FROM HistoricoConsultas WHERE pet_id = %s ORDER BY data_hora DESC"
            cursor.execute(sql, (pet_id,))
            return cursor.fetchall()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_servicos_por_pet_id(self, pet_id: int):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT servico_realizado, funcionario, data_hora, valor FROM HistoricoServicos WHERE pet_id = %s ORDER BY data_hora DESC"
            cursor.execute(sql, (pet_id,))
            return cursor.fetchall()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def atualizar_pet(self, pet_id: int, pet_dados: PetUpdate):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            update_data = pet_dados.model_dump(exclude_unset=True)

            if not update_data:
                cursor.execute("SELECT id, nome, tipo, raca, idade, peso FROM Pets WHERE id = %s", (pet_id,))
                return cursor.fetchone()

            set_clause = ", ".join([f"{key} = %s" for key in update_data.keys()])
            sql = f"UPDATE Pets SET {set_clause} WHERE id = %s RETURNING id, nome, tipo, raca, idade, peso"
            valores = list(update_data.values()) + [pet_id]

            cursor.execute(sql, valores)
            pet_atualizado = cursor.fetchone()
            conn.commit()
            return pet_atualizado
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)