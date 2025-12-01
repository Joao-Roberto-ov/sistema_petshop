from bancoDeDados import conectar, encerra_conexao

class NotificacaoRepository:
    def criar(self, mensagem: str, tipo: str = 'info'):
        conn = conectar()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO notificacoes (mensagem, tipo) VALUES (%s, %s) RETURNING id",
                (mensagem, tipo)
            )
            conn.commit()
            return cursor.fetchone()[0]
        finally:
            encerra_conexao(conn)

    def listar_nao_lidas(self):
        conn = conectar()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id, mensagem, lida, criado_em, tipo FROM notificacoes WHERE lida = FALSE ORDER BY criado_em DESC")
            rows = cursor.fetchall()
            return [
                {"id": r[0], "mensagem": r[1], "lida": r[2], "criado_em": r[3], "tipo": r[4]}
                for r in rows
            ]
        finally:
            encerra_conexao(conn)

    def marcar_como_lida(self, notificacao_id: int):
        conn = conectar()
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE notificacoes SET lida = TRUE WHERE id = %s", (notificacao_id,))
            conn.commit()
        finally:
            encerra_conexao(conn)