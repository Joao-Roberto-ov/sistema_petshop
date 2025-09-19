from datetime import datetime

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

    def buscar_pelo_cpf(self, cpf: str):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT id FROM Clientes WHERE cpf = %s"
            cursor.execute(sql, (cpf,))
            return cursor.fetchone()  # retorna None ou (id,)
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)


    def buscar_todos(self):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            cursor.execute("SELECT id, nome, email, telefone, endereco, cpf FROM clientes ORDER BY id")
            clientes = cursor.fetchall()
            return [
                {
                    "id": c[0],
                    "nome": c[1],
                    "email": c[2],
                    "telefone": c[3],
                    "endereco": c[4],
                    "cpf": c[5]
                } for c in clientes
            ]
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

    def editar_cliente(self, id: int, nome: str = None, email: str = None, telefone: str = None, endereco: str = None,
                       cpf: str = None):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()

            # Pega os dados atuais para registrar no histórico
            cursor.execute("SELECT nome, email, telefone, endereco, cpf FROM clientes WHERE id = %s", (id,))
            antigo = cursor.fetchone()
            if not antigo:
                raise Exception("Cliente não encontrado")

            campos = []
            valores = []

            if nome is not None:
                campos.append("nome = %s")
                valores.append(nome)
            if email is not None:
                campos.append("email = %s")
                valores.append(email)
            if telefone is not None:
                campos.append("telefone = %s")
                valores.append(telefone)
            if endereco is not None:
                campos.append("endereco = %s")
                valores.append(endereco)
            if cpf is not None:
                campos.append("cpf = %s")
                valores.append(cpf)

            if campos:
                sql = f"UPDATE clientes SET {', '.join(campos)} WHERE id = %s"
                valores.append(id)
                cursor.execute(sql, tuple(valores))
                conn.commit()

        except Exception as e:
            print(f"Erro ao editar cliente: {e}")
            if conn:
                conn.rollback()
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def registrar_historico(
            self,
            cliente_id: int,
            campo: str,
            valor_antigo: str | None,
            valor_novo: str | None,
            funcionario_id: int | None = None
    ):
        conn = conectar()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                           INSERT INTO cliente_historico(cliente_id, funcionario_id, campo, valor_antigo, valor_novo)
                           VALUES (%s, %s, %s, %s, %s)
                           """, (cliente_id, funcionario_id, campo, valor_antigo, valor_novo))
            conn.commit()
        finally:
            cursor.close()
            conn.close()