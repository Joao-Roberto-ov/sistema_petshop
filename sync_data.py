import requests
import psycopg2
from bancoDeDados import conectar, encerra_conexao
from psycopg2.extras import execute_values

API_BASE_URL = "https://world.openpetfoodfacts.org/api/v2/search"


def buscar_produtos_da_api(tag_categoria: str, page_size=100):
    params = {
        "tagtype_0": "categories",
        "tag_contains_0": "contains",
        "tag_0": tag_categoria,
        "page_size": page_size,
        "json": 1,
        "fields": "code,product_name,brands,categories,image_url,ingredients_text,nutriscore_grade,ecoscore_grade"
    }
    try:
        response = requests.get(API_BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        return data.get('products', [])
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar dados da API para a categoria '{tag_categoria}': {e}")
        return []


def salvar_produtos_no_banco(produtos: list):
    #salva uma lista de produtos na tabela produtos_externos
    if not produtos:
        return

    conn = None
    try:
        conn = conectar()
        cursor = conn.cursor()

        #on conflict evita duplicaçoes na tabela
        sql = """
              INSERT INTO produtos_externos (barcode, product_name, brands, categories, image_url, ingredients_text, nutriscore_grade, ecoscore_grade)
              VALUES %s
              ON CONFLICT (barcode)
              DO UPDATE SET
              product_name = EXCLUDED.product_name,
              brands = EXCLUDED.brands,
              categories = EXCLUDED.categories,
              image_url = EXCLUDED.image_url,
              ingredients_text = EXCLUDED.ingredients_text,
              nutriscore_grade = EXCLUDED.nutriscore_grade,
              ecoscore_grade = EXCLUDED.ecoscore_grade,
              data_sync = NOW();
              """

        dados_para_inserir = []
        for p in produtos:
            if 'code' not in p or not p['code'] or 'product_name' not in p or not p['product_name']:
                continue
            dados_para_inserir.append((
                p.get('code'),
                p.get('product_name'),
                p.get('brands'),
                p.get('categories'),
                p.get('image_url'),
                p.get('ingredients_text'),
                p.get('nutriscore_grade'),
                p.get('ecoscore_grade')
            ))
        if dados_para_inserir:
            execute_values(cursor, sql, dados_para_inserir)
            conn.commit()
            print(f"{len(dados_para_inserir)} produtos salvos ou atualizados no banco de dados.")
    except (Exception, psycopg2.Error) as error:
        print(f"Erro na operação com o banco de dados: {error}")
        if conn: conn.rollback()
    finally:
        if conn: encerra_conexao(conn)


def run_sync():
    print("Iniciando sincronização de dados de produtos...")

    print("\nBuscando produtos para CAES...")
    produtos_caes = buscar_produtos_da_api("dog-foods")
    salvar_produtos_no_banco(produtos_caes)

    print("\nBuscando produtos para GATOS...")
    produtos_gatos = buscar_produtos_da_api("cat-foods")
    salvar_produtos_no_banco(produtos_gatos)

    print("\nSincronização concluida.")


if __name__ == "__main__":
    run_sync()