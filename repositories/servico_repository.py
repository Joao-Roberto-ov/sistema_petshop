from bancoDeDados import conectar, encerra_conexao

class RepositorioCatalogoServico:
    def cadastrar_servico(self, nome: str, descricao: str | None, duracao: int, preco: float, criador_id: int | None = None):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = """
                INSERT INTO catalogo_servicos(nome, descricao, duracao, preco, criador_id)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, nome, descricao, duracao, preco, criador_id
            """
            cursor.execute(sql, (nome, descricao, duracao, preco, criador_id))
            conn.commit()
            return cursor.fetchone()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_todos(self):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            cursor.execute("SELECT id, nome, descricao, duracao, preco, criador_id FROM catalogo_servicos ORDER BY id")
            servicos = cursor.fetchall()
            return [
                {
                    "id": s[0],
                    "nome": s[1],
                    "descricao": s[2],
                    "duracao": s[3],
                    "preco": s[4],
                    "criador_id": s[5]
                } for s in servicos
            ]
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_por_id(self, servico_id: int):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            cursor.execute("SELECT id, nome, descricao, duracao, preco, criador_id FROM catalogo_servicos WHERE id = %s", (servico_id,))
            return cursor.fetchone()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def atualizar_servico(self, servico_id: int, campos: dict):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            set_clause = ", ".join([f"{key} = %s" for key in campos.keys()])
            sql = f"UPDATE catalogo_servicos SET {set_clause} WHERE id = %s RETURNING id, nome, descricao, duracao, preco, criador_id"
            valores = list(campos.values()) + [servico_id]
            cursor.execute(sql, valores)
            servico_atualizado = cursor.fetchone()
            conn.commit()
            return servico_atualizado
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def deletar_servico(self, servico_id: int):
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM catalogo_servicos WHERE id = %s", (servico_id,))
            conn.commit()
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)
