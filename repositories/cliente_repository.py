from bancoDeDados import conectar, encerra_conexao

class RepositorioCliente:
    def buscar_pelo_email(self, email: str):

        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT id, senha FROM Clientes WHERE email = %s"
            cursor.execute(sql, (email,))
            return cursor.fetchone()

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def procurar_pelo_id(self, user_id: int):
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT id, nome, email, telefone, endereco, cpf FROM Clientes WHERE Id = %s"
            cursor.execute(sql, (user_id,))
            return cursor.fetchone()

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def cadastrar_cliente(self, nome: str, email: str, senha_hash: str, telefone: str, endereco: str, cpf: str | None):
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "INSERT INTO clientes(nome, email, senha, telefone, endereco, cpf) VALUES(%s, %s, %s, %s, %s, %s)"
            cursor.execute(sql, (nome, email, senha_hash, telefone, endereco, cpf))
            conn.commit()

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)