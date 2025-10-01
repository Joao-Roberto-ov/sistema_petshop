from bancoDeDados import conectar, encerra_conexao

class RepositorioProduto:

    def buscar_produto_externo(self, query: str):
        """Busca produtos na tabela externa por nome ou código de barras."""
        conn = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            #procura pelo nome ou codigo de barras
            sql = """
                SELECT barcode, product_name, brands
                FROM produtos_externos
                WHERE product_name ILIKE %s OR barcode = %s
                LIMIT 10;
            """
            #aqui ele procura alguns dados por coluna
            cursor.execute(sql, (f"%{query}%", query))
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
        #salva um novo produto na tabela de produtos cadastrados.
        conn = None
        try:
            conn = conectar()
            cursor = conn.cursor()

            sql = """INSERT INTO produtos_cadastrados
                    (
                    barcode, nome, marca, categoria, descricao, url_imagem,
                    preco_venda, estoque, cadastrado_por_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id;
                    """

            cursor.execute(sql, (
                dados_produto.barcode, dados_produto.nome, dados_produto.marca,
                dados_produto.categoria, dados_produto.descricao, dados_produto.url_imagem,
                dados_produto.preco_venda, dados_produto.estoque, gestor_id
            ))

            produto_id = cursor.fetchone()[0]
            conn.commit()
            return produto_id
        finally:
            if conn:
                encerra_conexao(conn)