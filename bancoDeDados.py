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

def criar_tabelas():
    conectado = conectar()
    if not conectado:
        print("Falha ao conectar ao banco de dados")
        return

    try:
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

        curs.execute("""CREATE TABLE IF NOT EXISTS Cargos (
        Id SERIAL PRIMARY KEY,
        Nome VARCHAR(50) UNIQUE NOT NULL
    );""")

        curs.execute("INSERT INTO Cargos (Nome) VALUES ('gestor') ON CONFLICT (Nome) DO NOTHING;")
        # cargo funcionario como placeholder
        curs.execute("INSERT INTO Cargos (Nome) VALUES ('funcionario') ON CONFLICT (Nome) DO NOTHING;")

        curs.execute("""CREATE TABLE IF NOT EXISTS Funcionarios (
        Id SERIAL PRIMARY KEY,
        Nome VARCHAR(150) NOT NULL,
        CPF VARCHAR(14) UNIQUE,
        Email VARCHAR(150) UNIQUE NOT NULL,
        Senha TEXT NOT NULL,
        Telefone VARCHAR(20)NOT NULL,
        Endereco VARCHAR(400) DEFAULT 'Não informado',
        Cargo_id INT NOT NULL REFERENCES Cargos(Id),
        Is_ativo BOOLEAN DEFAULT TRUE
        );
                     """)

        curs.execute("""CREATE TABLE IF NOT EXISTS Pets (
        Id SERIAL PRIMARY KEY,
        Nome  VARCHAR(80) NOT NULL,
        Tipo  VARCHAR(80) NOT NULL,
        Raça  VARCHAR(50) NOT NULL,
        Idade SMALLINT NOT NULL,
        Peso  FLOAT,
        Cliente_id INTEGER REFERENCES Clientes(Id)
        );""")

        conectado.commit()
        curs.close()

    finally:
        encerra_conexao(conectado)