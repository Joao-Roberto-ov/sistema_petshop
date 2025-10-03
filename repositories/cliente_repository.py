
from datetime import datetime
from bancoDeDados import conectar, encerra_conexao

class RepositorioCliente:
    def conectar(self):
        return conectar()

    def encerra_conexao(self, conn):
        encerra_conexao(conn)

    def buscar_pelo_email(self, email: str):
        conn = None
        cursor = None

        try:
            conn = self.conectar()
            cursor = conn.cursor()
            sql = "SELECT id, senha FROM Clientes WHERE email = %s"
            cursor.execute(sql, (email,))
            return cursor.fetchone()

        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

    def buscar_cliente_pelo_email(self, email: str):
        """
        Método para buscar cliente completo pelo email (usado no fluxo de esqueci senha)
        """
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            sql = "SELECT id, nome, email FROM Clientes WHERE email = %s"
            cursor.execute(sql, (email,))
            return cursor.fetchone()
        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

    def buscar_pelo_cpf(self, cpf: str):
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            sql = "SELECT id FROM Clientes WHERE cpf = %s"
            cursor.execute(sql, (cpf,))
            return cursor.fetchone()  # retorna None ou (id,)
        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

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
            conn = self.conectar()
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
            if conn: self.encerra_conexao(conn)

    def procurar_pelo_id(self, user_id: int):
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            sql = "SELECT id, nome, email, telefone, endereco, cpf FROM Clientes WHERE Id = %s"
            cursor.execute(sql, (user_id,))
            return cursor.fetchone()
        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

    def cadastrar_cliente(self, nome: str, email: str, senha_hash: str, telefone: str, endereco: str, cpf: str | None):
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            sql = "INSERT INTO clientes(nome, email, senha, telefone, endereco, cpf) VALUES(%s, %s, %s, %s, %s, %s)"
            cursor.execute(sql, (nome, email, senha_hash, telefone, endereco, cpf))
            conn.commit()
        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

    def editar_cliente(self, id: int, nome: str = None, email: str = None, telefone: str = None, endereco: str = None,
                       cpf: str = None):
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
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
                sql = "UPDATE clientes SET " + ", ".join(campos) + " WHERE id = %s"
                valores.append(id)
                cursor.execute(sql, tuple(valores))
                conn.commit()

        except Exception as e:
            print(f"Erro ao editar cliente: {e}")
            if conn:
                conn.rollback()
            raise  # Re-raise the exception

        finally:
            if cursor:
                cursor.close()
            if conn:
                self.encerra_conexao(conn)

    def registrar_historico(
            self,
            cliente_id: int,
            campo: str,
            valor_antigo: str | None,
            valor_novo: str | None,
            funcionario_id: int | None = None
    ):
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            cursor.execute("""
                           INSERT INTO cliente_historico(cliente_id, funcionario_id, campo, valor_antigo, valor_novo)
                           VALUES (%s, %s, %s, %s, %s)
                           """, (cliente_id, funcionario_id, campo, valor_antigo, valor_novo))
            conn.commit()
        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

    def atualizar_cliente(self, user_id: int, campos: dict):
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            set_clause = ", ".join([f"{key} = %s" for key in campos.keys()])
            sql = f"UPDATE Clientes SET {set_clause} WHERE id = %s RETURNING id, nome, email, telefone, endereco, cpf"
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
                    "cpf": updated_user[5]
                }
            return None
        except Exception as e:
            if conn:
                conn.rollback()
            raise  # Re-raise the exception
        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

    def salvar_codigo_reset(self, user_id: int, codigo: str, expiracao: datetime):
        """
        Insere um novo código de verificação na tabela CodigosVerificacao.
        Primeiro, apaga códigos antigos do mesmo usuário para evitar duplicatas.
        """
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            # Passo 1: Apagar códigos antigos para este usuário (boa prática)
            sql_delete = "DELETE FROM CodigosVerificacao WHERE cliente_id = %s"
            cursor.execute(sql_delete, (user_id,))

            # Passo 2: Inserir o novo código
            sql_insert = "INSERT INTO CodigosVerificacao (cliente_id, codigo, expiracao) VALUES (%s, %s, %s)"
            cursor.execute(sql_insert, (user_id, codigo, expiracao))
            conn.commit()
        except Exception as e:
            if conn:
                conn.rollback()
            raise  # Re-raise the exception
        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

    def buscar_codigo_reset(self, user_id: int, codigo_fornecido: str):
        """
        Busca um código na tabela CodigosVerificacao que corresponda ao usuário e ao código.
        Retorna a linha inteira para que o serviço possa verificar a data de expiração.
        """
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            sql = "SELECT codigo, expiracao FROM CodigosVerificacao WHERE cliente_id = %s AND codigo = %s"
            cursor.execute(sql, (user_id, codigo_fornecido))
            return cursor.fetchone()
        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

    def deletar_codigo_reset(self, user_id: int, codigo_usado: str):
        """
        Deleta um código específico após ele ter sido usado com sucesso.
        """
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            sql = "DELETE FROM CodigosVerificacao WHERE cliente_id = %s AND codigo = %s"
            cursor.execute(sql, (user_id, codigo_usado))
            conn.commit()
        except Exception as e:
            if conn:
                conn.rollback()
            raise  # Re-raise the exception
        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

    def buscar_pelo_id_com_senha(self, user_id: int):
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            sql = "SELECT id, nome, email, telefone, senha FROM Clientes WHERE id = %s"
            cursor.execute(sql, (user_id,))
            return cursor.fetchone()
        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

    def salvar_token_redefinicao(self, cliente_id: int, token: str, expiracao: datetime):
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            # Inserir o token na tabela PasswordResetTokens
            cursor.execute(
                "INSERT INTO PasswordResetTokens (cliente_id, token, expiracao) VALUES (%s, %s, %s)",
                (cliente_id, token, expiracao)
            )
            conn.commit()
        except Exception as e:
            print(f"Erro ao salvar token de redefinição: {e}")
            if conn:
                conn.rollback()
            raise
        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

    def buscar_token_redefinicao(self, token: str):
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT prt.cliente_id, c.email, prt.expiracao FROM PasswordResetTokens prt JOIN Clientes c ON prt.cliente_id = c.id WHERE prt.token = %s AND prt.expiracao > NOW() AND prt.cliente_id IS NOT NULL",
                (token,)
            )
            resultado = cursor.fetchone()
            return resultado
        except Exception as e:
            print(f"Erro ao buscar token de redefinição: {e}")
            raise
        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

    def invalidar_token_redefinicao(self, token: str):
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            cursor.execute(
                "DELETE FROM PasswordResetTokens WHERE token = %s",
                (token,)
            )
            conn.commit()
        except Exception as e:
            print(f"Erro ao invalidar token de redefinição: {e}")
            if conn:
                conn.rollback()
            raise
        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

    def atualizar_senha_cliente(self, cliente_id: int, nova_senha_hash: str):
        conn = None
        cursor = None
        try:
            conn = self.conectar()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE Clientes SET senha = %s WHERE id = %s",
                (nova_senha_hash, cliente_id)
            )
            conn.commit()
        except Exception as e:
            print(f"Erro ao atualizar senha do cliente: {e}")
            if conn:
                conn.rollback()
            raise
        finally:
            if cursor: cursor.close()
            if conn: self.encerra_conexao(conn)

