import psycopg2 as pg
import os
from psycopg2 import Error
from dotenv import load_dotenv

load_dotenv()

def conectar():
    try:
        pwd = os.getenv('AWS_DB_PASSWORD')
        hosting = os.getenv('AWS_DB_HOST')
        database = os.getenv('AWS_DB_NAME')
        usuario = os.getenv('AWS_DB_USER')
        porta = os.getenv('AWS_DB_PORT')

        connected = pg.connect(
            dbname = database,
            user = usuario,
            password = pwd,
            host = hosting,
            port = porta
        )
        print("conectado com sucesso")
        return connected

    except Error as e:
        print(f"Ocorreu um erro ao tentar conectar ao banco de dados: {e}")
        return None

def encerra_conexao(connected):
    if connected:
        connected.close()
        print("Conexão encerrada com o banco de dados")

def criar_tabela_clientes():
    conectado = conectar()
    curs = conectado.cursor()

    curs.execute("""CREATE TABLE IF NOT EXISTS Clientes (
    Id SERIAL PRIMARY KEY,
    Nome VARCHAR(150) NOT NULL,
    Email VARCHAR(150) UNIQUE NOT NULL,
    Senha TEXT NOT NULL,
    Telefone VARCHAR(20)NOT NULL,
    Nome_pet VARCHAR(80) DEFAULT 'Não informado',
    Endereco VARCHAR(400) DEFAULT 'Não informado',
    CPF VARCHAR(14) UNIQUE
);""")

    conectado.commit()
    curs.close()
    conectado.close()