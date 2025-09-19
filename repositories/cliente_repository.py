from bancoDeDados import conectar, encerra_conexao
from datetime import datetime

class RepositorioCliente:
    def buscar_pelo_email(self, email: str):
        conn = None; cursor = None
        try:
            conn = conectar(); cursor = conn.cursor()
            sql = "SELECT id, senha FROM Clientes WHERE email = %s"
            cursor.execute(sql, (email,)); return cursor.fetchone()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def procurar_pelo_id(self, user_id: int):
        conn = None; cursor = None
        try:
            conn = conectar(); cursor = conn.cursor()
            sql = "SELECT id, nome, email, telefone, endereco, cpf FROM Clientes WHERE id = %s"
            cursor.execute(sql, (user_id,)); return cursor.fetchone()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_pelo_id_com_senha(self, user_id: int):
        conn = None; cursor = None
        try:
            conn = conectar(); cursor = conn.cursor()
            sql = "SELECT id, nome, email, telefone, senha FROM Clientes WHERE id = %s"
            cursor.execute(sql, (user_id,)); return cursor.fetchone()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def cadastrar_cliente(self, nome: str, email: str, senha_hash: str, telefone: str, endereco: str, cpf: str | None):
        conn = None; cursor = None
        try:
            conn = conectar(); cursor = conn.cursor()
            sql = "INSERT INTO clientes(nome, email, senha, telefone, endereco, cpf) VALUES(%s, %s, %s, %s, %s, %s)"
            cursor.execute(sql, (nome, email, senha_hash, telefone, endereco, cpf)); conn.commit()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def atualizar_cliente(self, user_id: int, campos: dict):
        conn = None; cursor = None
        try:
            conn = conectar(); cursor = conn.cursor()
            set_clause = ", ".join([f"{key} = %s" for key in campos.keys()])
            sql = f"UPDATE Clientes SET {set_clause} WHERE id = %s RETURNING id, nome, email, telefone, endereco, cpf"
            valores = list(campos.values()) + [user_id]
            cursor.execute(sql, valores)
            updated_user = cursor.fetchone(); conn.commit()
            if updated_user:
                return {"id": updated_user[0], "nome": updated_user[1], "email": updated_user[2], "telefone": updated_user[3], "endereco": updated_user[4], "cpf": updated_user[5]}
            return None
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    # --- MÉTODOS MODIFICADOS PARA USAR A NOVA TABELA ---

    def salvar_codigo_reset(self, user_id: int, codigo: str, expiracao: datetime):
        """
        Insere um novo código de verificação na tabela CodigosVerificacao.
        Primeiro, apaga códigos antigos do mesmo usuário para evitar duplicatas.
        """
        conn = None; cursor = None
        try:
            conn = conectar(); cursor = conn.cursor()
            # Passo 1: Apagar códigos antigos para este usuário (boa prática)
            sql_delete = "DELETE FROM CodigosVerificacao WHERE cliente_id = %s"
            cursor.execute(sql_delete, (user_id,))
            
            # Passo 2: Inserir o novo código
            sql_insert = "INSERT INTO CodigosVerificacao (cliente_id, codigo, expiracao) VALUES (%s, %s, %s)"
            cursor.execute(sql_insert, (user_id, codigo, expiracao))
            conn.commit()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_codigo_reset(self, user_id: int, codigo_fornecido: str):
        """
        Busca um código na tabela CodigosVerificacao que corresponda ao usuário e ao código.
        Retorna a linha inteira para que o serviço possa verificar a data de expiração.
        """
        conn = None; cursor = None
        try:
            conn = conectar(); cursor = conn.cursor()
            sql = "SELECT codigo, expiracao FROM CodigosVerificacao WHERE cliente_id = %s AND codigo = %s"
            cursor.execute(sql, (user_id, codigo_fornecido))
            return cursor.fetchone()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def deletar_codigo_reset(self, user_id: int, codigo_usado: str):
        """
        Deleta um código específico após ele ter sido usado com sucesso.
        """
        conn = None; cursor = None
        try:
            conn = conectar(); cursor = conn.cursor()
            sql = "DELETE FROM CodigosVerificacao WHERE cliente_id = %s AND codigo = %s"
            cursor.execute(sql, (user_id, codigo_usado))
            conn.commit()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

def buscar_cliente_pelo_email(self, email: str):
        """ Busca um cliente completo pelo seu endereço de e-mail. """
        conn = None; cursor = None
        try:
            conn = conectar(); cursor = conn.cursor()
            sql = "SELECT id, nome, email FROM Clientes WHERE email = %s"
            cursor.execute(sql, (email,))
            return cursor.fetchone()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)