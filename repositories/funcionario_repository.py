from bancoDeDados import conectar, encerra_conexao
from datetime import datetime

class RepositorioFuncionario:

    def buscar_pelo_email(self, email: str):
        """
        Retorna (id, senha) do funcionário pelo email (case-insensitive).
        """
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT id, senha FROM Funcionarios WHERE LOWER(email) = LOWER(%s)"
            cursor.execute(sql, (email,))
            return cursor.fetchone()

        except Exception as e:
            print(f"Erro ao buscar funcionário por email: {e}")
            raise  # Re-raise the exception
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
                  SELECT f.id,
                         f.nome,
                         f.email,
                         f.telefone,
                         f.endereco,
                         f.cpf,
                         c.id   as cargo_id,
                         c.nome as cargo,
                         f.is_ativo
                  FROM Funcionarios f
                           JOIN Cargos c ON f.cargo_id = c.id
                  WHERE f.id = %s
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
                    "cargo_id": row[6],
                    "cargo": row[7],
                    "is_ativo": row[8]
                }
            return None
        except Exception as e:
            print(f"Erro ao buscar funcionário por ID: {e}")
            raise  # Re-raise the exception
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
                (nome, email, senha, telefone, endereco, cpf, cargo_id, is_ativo)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            cursor.execute(sql, (nome, email, senha_hash, telefone, endereco, cpf, cargo_id, is_ativo))
            user_id = cursor.fetchone()[0]
            conn.commit()
            return user_id

        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Erro ao cadastrar funcionário: {e}")
            raise  # Re-raise the exception
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def criar_funcionario_admin(self, nome, email, senha_hash, telefone, endereco, cpf, cargo_id, is_ativo=True):
        """
        Insere um novo funcionário pelo administrador
        """
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = """
                INSERT INTO Funcionarios
                (nome, email, senha, telefone, endereco, cpf, cargo_id, is_ativo)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            cursor.execute(sql, (nome, email, senha_hash, telefone, endereco, cpf, cargo_id, is_ativo))
            user_id = cursor.fetchone()[0]
            conn.commit()
            return user_id

        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Erro ao cadastrar funcionário: {e}")
            raise  # Re-raise the exception
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_todos(self):
        """
        Retorna todos os funcionários
        """
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = """
                SELECT f.id, f.nome, f.email, f.telefone, f.endereco, f.cpf, 
                       c.id as cargo_id, c.nome as cargo, f.is_ativo
                FROM Funcionarios f
                JOIN Cargos c ON f.cargo_id = c.id
                ORDER BY f.id
            """
            cursor.execute(sql)
            funcionarios = cursor.fetchall()
            return [
                {
                    "id": f[0],
                    "nome": f[1],
                    "email": f[2],
                    "telefone": f[3],
                    "endereco": f[4],
                    "cpf": f[5],
                    "cargo_id": f[6],
                    "cargo": f[7],
                    "is_ativo": f[8]
                } for f in funcionarios
            ]
        except Exception as e:
            print(f"Erro ao buscar todos os funcionários: {e}")
            raise  # Re-raise the exception
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def atualizar_funcionario(self, user_id: int, campos: dict):
        """
        Atualiza dados do funcionário
        """
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            set_clause = ", ".join([f"{key} = %s" for key in campos.keys()])
            sql = f"""
                UPDATE Funcionarios 
                SET {set_clause} 
                WHERE id = %s 
                RETURNING id, nome, email, telefone, endereco, cpf, cargo_id, is_ativo
            """
            valores = list(campos.values()) + [user_id]
            cursor.execute(sql, valores)
            updated_user = cursor.fetchone()
            conn.commit()
            if updated_user:
                return {
                    "id": updated_user[0],
                    "nome": updated_user[1],
                    "email": updated_user[2],
                    "telefone": updated_user[3],
                    "endereco": updated_user[4],
                    "cpf": updated_user[5],
                    "cargo_id": updated_user[6],
                    "is_ativo": updated_user[7]
                }
            return None
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Erro ao atualizar funcionário: {e}")
            raise  # Re-raise the exception
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)


def buscar_funcionario_pelo_email(self, email: str):
    """
    Retorna (id, email) do funcionário pelo email (case-insensitive).
    Específico para recuperação de senha.
    """
    conn = None
    cursor = None
    try:
        conn = conectar()
        cursor = conn.cursor()
        sql = "SELECT id, email FROM Funcionarios WHERE LOWER(email) = LOWER(%s)"
        cursor.execute(sql, (email,))
        return cursor.fetchone()
    except Exception as e:
        print(f"Erro ao buscar funcionário por email: {e}")
        raise
    finally:
        if cursor: cursor.close()
        if conn: encerra_conexao(conn)

def salvar_token_redefinicao(self, user_id: int, token: str, expiracao: datetime):
    """
    Salva o token de redefinição de senha no banco
    """
    conn = None
    cursor = None
    try:
        conn = conectar()
        cursor = conn.cursor()
        sql = """
            INSERT INTO tokens_redefinicao_funcionario 
            (funcionario_id, token, expiracao) 
            VALUES (%s, %s, %s)
        """
        cursor.execute(sql, (user_id, token, expiracao))
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao salvar token de redefinição: {e}")
        raise
    finally:
        if cursor: cursor.close()
        if conn: encerra_conexao(conn)

def buscar_token_redefinicao(self, token: str):
    """
    Busca informações do token de redefinição
    """
    conn = None
    cursor = None
    try:
        conn = conectar()
        cursor = conn.cursor()
        sql = """
            SELECT tr.funcionario_id, f.email, tr.expiracao 
            FROM tokens_redefinicao_funcionario tr
            JOIN Funcionarios f ON tr.funcionario_id = f.id
            WHERE tr.token = %s AND tr.ativo = TRUE
        """
        cursor.execute(sql, (token,))
        return cursor.fetchone()
    except Exception as e:
        print(f"Erro ao buscar token de redefinição: {e}")
        raise
    finally:
        if cursor: cursor.close()
        if conn: encerra_conexao(conn)

def invalidar_token_redefinicao(self, token: str):
    """
    Invalida um token após uso
    """
    conn = None
    cursor = None
    try:
        conn = conectar()
        cursor = conn.cursor()
        sql = "UPDATE tokens_redefinicao_funcionario SET ativo = FALSE WHERE token = %s"
        cursor.execute(sql, (token,))
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao invalidar token: {e}")
        raise
    finally:
        if cursor: cursor.close()
        if conn: encerra_conexao(conn)

def atualizar_senha_funcionario(self, user_id: int, nova_senha_hash: str):
    """
    Atualiza a senha do funcionário
    """
    conn = None
    cursor = None
    try:
        conn = conectar()
        cursor = conn.cursor()
        sql = "UPDATE Funcionarios SET senha = %s WHERE id = %s"
        cursor.execute(sql, (nova_senha_hash, user_id))
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro ao atualizar senha do funcionário: {e}")
        raise
    finally:
        if cursor: cursor.close()
        if conn: encerra_conexao(conn)

