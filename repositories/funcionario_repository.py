from bancoDeDados import conectar, encerra_conexao

class RepositorioFuncionario:

    def buscar_pelo_email(self, email: str):
        """
        Retorna (id, senha) do funcionário pelo email
        """
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT id, senha FROM Funcionarios WHERE email = %s"
            cursor.execute(sql, (email,))
            return cursor.fetchone()

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def procurar_pelo_id(self, user_id: int):
        """
        Retorna os dados completos do funcionário pelo id
        """
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = """
                  SELECT f.id, \
                         f.nome, \
                         f.email, \
                         f.telefone, \
                         f.endereco, \
                         f.cpf,
                         c.id   as cargo_id, \
                         c.nome as cargo, \
                         f.is_ativo
                  FROM Funcionarios f
                           JOIN Cargos c ON f.Cargo_id = c.id
                  WHERE f.id = %s \
                  """
            cursor.execute(sql, (user_id,))
            row = cursor.fetchone()
            if row:
                return {
                    "id": row[0],
                    "nome": row[1],
                    "email": row[2],
                    "telefone": row[3],
                    "endereco": row[4],
                    "cpf": row[5],
                    "cargo_id": row[6],  # <- ID do cargo
                    "cargo": row[7],  # <- Nome do cargo
                    "is_ativo": row[8]
                }
            return None
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def cadastrar_funcionario(self, nome, email, senha_hash, telefone, endereco, cpf, cargo_id, is_ativo=True):
        """
        Insere um novo funcionário
        """
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = """
                INSERT INTO Funcionarios
                (nome, email, senha, telefone, endereco, cpf, cargo_id, Is_ativo)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            cursor.execute(sql, (nome, email, senha_hash, telefone, endereco, cpf, cargo_id, is_ativo))
            user_id = cursor.fetchone()[0]
            conn.commit()
            return user_id

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)
