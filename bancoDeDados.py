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

        curs.execute("""CREATE TABLE IF NOT EXISTS Cargos (
            Id SERIAL PRIMARY KEY,
            Nome VARCHAR(50) UNIQUE NOT NULL
        );""")

        curs.execute("INSERT INTO Cargos (Nome) VALUES ('gestor') ON CONFLICT (Nome) DO NOTHING;")
        curs.execute("INSERT INTO Cargos (Nome) VALUES ('funcionario') ON CONFLICT (Nome) DO NOTHING;")

        curs.execute("""CREATE TABLE IF NOT EXISTS produtos_externos (
                barcode VARCHAR(50) PRIMARY KEY,
                product_name TEXT,
                brands TEXT,
                categories TEXT,
                image_url TEXT,
                ingredients_text TEXT,
                nutriscore_grade VARCHAR(20),
                ecoscore_grade VARCHAR(20),
                data_sync TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS produtos_cadastrados (
                id SERIAL PRIMARY KEY,
                barcode VARCHAR(50) UNIQUE NOT NULL,
                nome TEXT NOT NULL,
                marca TEXT,
                categoria TEXT,
                descricao TEXT,
                url_imagem TEXT,
                preco_venda NUMERIC(10, 2) NOT NULL,
                estoque INT NOT NULL DEFAULT 0,
                cadastrado_por_id INT REFERENCES funcionarios (id),
                data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );""")

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

        curs.execute("""CREATE TABLE IF NOT EXISTS Cliente_historico (
            id SERIAL PRIMARY KEY,
            cliente_id INT NOT NULL,
            funcionario_id INT REFERENCES funcionarios(id),
            campo TEXT NOT NULL,
            valor_antigo TEXT,
            valor_novo TEXT,
            data_hora TIMESTAMP NOT NULL DEFAULT NOW()
        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS CodigosVerificacao (
            id SERIAL PRIMARY KEY,
            cliente_id INTEGER NOT NULL REFERENCES Clientes(id) ON DELETE CASCADE,
            codigo VARCHAR(6) NOT NULL,
            expiracao TIMESTAMP WITH TIME ZONE NOT NULL,
            criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS PasswordResetTokens (
            id SERIAL PRIMARY KEY,
            cliente_id INTEGER REFERENCES Clientes(id) ON DELETE CASCADE,
            funcionario_id INTEGER REFERENCES Funcionarios(id) ON DELETE CASCADE,
            token VARCHAR(64) UNIQUE NOT NULL,
            expiracao TIMESTAMP WITH TIME ZONE NOT NULL,
            criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT check_user_type CHECK (
                (cliente_id IS NOT NULL AND funcionario_id IS NULL) OR
                (cliente_id IS NULL AND funcionario_id IS NOT NULL)
            )
        );""")

        conectado.commit()
        print("Verificação e criação de tabelas concluída com sucesso.")
        curs.close()
    finally:
        encerra_conexao(conectado)

if __name__ == '__main__':
    print("Iniciando a criação das tabelas no banco de dados...")
    criar_tabelas()
