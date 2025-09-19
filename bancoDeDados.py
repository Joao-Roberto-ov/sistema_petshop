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
        return connected
    except Error as e:
        print(f"Ocorreu um erro ao tentar conectar ao banco de dados: {e}")
        return None

def encerra_conexao(connected):
    if connected:
        connected.close()

def criar_tabelas():
    conectado = conectar()
    if not conectado:
        return
    try:
        curs = conectado.cursor()
        curs.execute("""CREATE TABLE IF NOT EXISTS Clientes (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(150) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            telefone VARCHAR(20)NOT NULL,
            nome_pet VARCHAR(80) DEFAULT 'Não informado',
            endereco VARCHAR(400) DEFAULT 'Não informado',
            cpf VARCHAR(14) UNIQUE
        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS Pets (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(80) NOT NULL,
            tipo VARCHAR(80) NOT NULL,
            raca VARCHAR(50) NOT NULL,
            idade SMALLINT NOT NULL,
            peso FLOAT,
            cliente_id INTEGER REFERENCES Clientes(id) ON DELETE CASCADE
        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS HistoricoConsultas (
            id SERIAL PRIMARY KEY,
            servico_realizado VARCHAR(200) NOT NULL,
            funcionario VARCHAR(150) NOT NULL,
            data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            valor NUMERIC(10, 2) NOT NULL,
            pet_id INTEGER REFERENCES Pets(id) ON DELETE CASCADE
        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS HistoricoServicos (
            id SERIAL PRIMARY KEY,
            servico_realizado VARCHAR(200) NOT NULL,
            funcionario VARCHAR(150) NOT NULL,
            data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            valor NUMERIC(10, 2) NOT NULL,
            pet_id INTEGER REFERENCES Pets(id) ON DELETE CASCADE
        );""")

        conectado.commit()
        curs.close()
    finally:
        encerra_conexao(conectado)