from bancoDeDados import conectar, encerra_conexao

class RepositorioPet:
    def cadastrar_pet(self, pet_dados, cliente_id: int):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = """
                INSERT INTO Pets (Nome, Tipo, Raça, Idade, Peso, Cliente_id)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (pet_dados.nome,pet_dados.tipo,pet_dados.raca,pet_dados.idade,pet_dados.peso,cliente_id))
            conn.commit()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)