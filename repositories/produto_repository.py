from bancoDeDados import conectar, encerra_conexao
class RepositorioProduto:

    def buscar_produto_externo(self, query: str):
        conn = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            # --- CORREÇÃO AQUI ---
            # A consulta foi alterada para procurar o texto da busca tanto no nome do produto
            # quanto no código de barras, permitindo buscas parciais em ambos.
            sql = """
                SELECT barcode, product_name, brands
                FROM produtos_externos
                WHERE product_name ILIKE %s OR barcode ILIKE %s
                LIMIT 10;
            """
            # Adicionamos os wildcards (%) em ambos os parâmetros da busca
            search_term = f"%{query}%"
            cursor.execute(sql, (search_term, search_term))
            # --- FIM DA CORREÇÃO ---

            resultados = cursor.fetchall()
            return [
                {"barcode": row[0], "nome": row[1], "marca": row[2]}
                for row in resultados
            ]
        finally:
            if conn:
                encerra_conexao(conn)

    def buscar_detalhes_produto_externo(self, barcode: str):
        #procura todos os detalhes de um produto externo pelo código de barras
        conn = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = """
                SELECT barcode, product_name, brands, categories, image_url, ingredients_text
                FROM produtos_externos
                WHERE barcode = %s;
            """
            cursor.execute(sql, (barcode,))
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "barcode": row[0], "nome": row[1], "marca": row[2],
                "categoria": row[3], "url_imagem": row[4], "descricao": row[5]
            }
        finally:
            if conn:
                encerra_conexao(conn)

    def cadastrar_produto(self, dados_produto, gestor_id):
        """Salva um novo produto na tabela de produtos cadastrados."""
        conn = None
        try:
            conn = conectar()
            cursor = conn.cursor()

            sql = """INSERT INTO produtos_cadastrados
                     (barcode, nome, marca, categoria, descricao, url_imagem, \
                      preco_venda, estoque, animais_alvo, cadastrado_por_id) \
                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                     RETURNING id; \
                  """

            cursor.execute(sql, (
                dados_produto.barcode, dados_produto.nome, dados_produto.marca,
                dados_produto.categoria, dados_produto.descricao, dados_produto.url_imagem,
                dados_produto.preco_venda, dados_produto.estoque,
                dados_produto.animais_alvo,
                gestor_id
            ))

            produto_id = cursor.fetchone()[0]
            conn.commit()
            return produto_id
        finally:
            if conn:
                encerra_conexao(conn)

    def buscar_todos_produtos_cadastrados(self):
        conn = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = """
                  SELECT id, barcode, nome, marca, categoria, descricao, url_imagem, preco_venda, estoque, animais_alvo, cadastrado_por_id, data_cadastro
                  FROM produtos_cadastrados
                  ORDER BY nome;
                  """
            cursor.execute(sql)
            resultados = cursor.fetchall()
            return [
                {
                    "id": row[0], "barcode": row[1], "nome": row[2], "marca": row[3],
                    "categoria": row[4], "descricao": row[5], "url_imagem": row[6],
                    "preco_venda": float(row[7]), "estoque": row[8],
                    "animais_alvo": row[9],
                    "cadastrado_por_id": row[10], "data_cadastro": row[11]
                }
                for row in resultados
            ]
        finally:
            if conn:
                encerra_conexao(conn)

    def verificar_produto_externo(self, barcode: str):
        conn = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT barcode FROM produtos_externos WHERE barcode = %s;"
            cursor.execute(sql, (barcode,))
            return cursor.fetchone() is not None
        finally:
            if conn:
                encerra_conexao(conn)

    def atualizar_produto(self, produto_id: int, dados_produto):
        conn = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = """
                  UPDATE produtos_cadastrados
                  SET nome = %s, 
                      marca = %s, 
                      categoria = %s, 
                      descricao = %s,
                      url_imagem = %s, 
                      preco_venda = %s, 
                      estoque = %s,
                      animais_alvo = %s, 
                      ultima_atualizacao = CURRENT_TIMESTAMP
                  WHERE id = %s
                  RETURNING id; 
                  """
            cursor.execute(sql, (
                dados_produto.nome, dados_produto.marca, dados_produto.categoria,
                dados_produto.descricao, dados_produto.url_imagem,
                dados_produto.preco_venda, dados_produto.estoque,
                dados_produto.animais_alvo,  # NOVO CAMPO
                produto_id
            ))
            resultado = cursor.fetchone()
            conn.commit()
            return resultado[0] if resultado else None
        finally:
            if conn:
                encerra_conexao(conn)

    def excluir_produto(self, produto_id: int):
        conn = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "DELETE FROM produtos_cadastrados WHERE id = %s RETURNING id;"
            cursor.execute(sql, (produto_id,))
            resultado = cursor.fetchone()
            conn.commit()
            return resultado is not None
        finally:
            if conn:
                encerra_conexao(conn)