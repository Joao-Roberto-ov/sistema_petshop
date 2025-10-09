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
            cursor.execute(sql, (pet_dados.nome, pet_dados.tipo, pet_dados.raca, pet_dados.idade, pet_dados.peso, cliente_id))
            conn.commit()

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_pet_por_dados(self, cliente_id: int, nome: str, tipo: str, raca: str, pet_id_excluir: int = None):

        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql_base = "SELECT id FROM Pets WHERE cliente_id = %s AND nome ILIKE %s AND tipo ILIKE %s AND raca ILIKE %s"
            params = [cliente_id, nome, tipo, raca]

            if pet_id_excluir is not None:
                sql_base += " AND id != %s"
                params.append(pet_id_excluir)

            cursor.execute(sql_base, params)
            return cursor.fetchone()

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_dados_atuais_pet(self, pet_id: int):
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT nome, tipo, raca FROM Pets WHERE id = %s"
            cursor.execute(sql, (pet_id,))
            resultado = cursor.fetchone()

            if resultado:
                return {"nome": resultado[0], "tipo": resultado[1], "raca": resultado[2]}
            return None

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
    def buscar_todos_pets_com_cliente(self):
        """
        Busca todos os pets do sistema com informações do cliente para gestores.
        """
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = """
                SELECT p.id, p.nome, p.tipo, p.raca, p.idade, p.peso, p.cliente_id, c.nome as cliente_nome
                FROM Pets p
                INNER JOIN Clientes c ON p.cliente_id = c.id
                ORDER BY p.nome, c.nome
            """
            cursor.execute(sql)
            return cursor.fetchall()

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def verificar_pet_existe(self, pet_id: int):
        """
        Verifica se um pet existe no sistema.
        """
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT id FROM Pets WHERE id = %s"
            cursor.execute(sql, (pet_id,))
            return cursor.fetchone() is not None

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_dados_atuais_pet(self, pet_id: int):
        """
        Busca dados atuais do pet incluindo cliente_id para gestores.
        """
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT nome, tipo, raca, cliente_id FROM Pets WHERE id = %s"
            cursor.execute(sql, (pet_id,))
            resultado = cursor.fetchone()

            if resultado:
                return {
                    "nome": resultado[0], 
                    "tipo": resultado[1], 
                    "raca": resultado[2],
                    "cliente_id": resultado[3]
                }
            return None

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)
