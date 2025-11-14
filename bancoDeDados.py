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
            dbname=database,
            user=usuario,
            password=pwd,
            host=hosting,
            port=porta
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
        curs.execute("""CREATE TABLE IF NOT EXISTS Clientes
                        (
                            id       SERIAL PRIMARY KEY,
                            nome     VARCHAR(150)        NOT NULL,
                            email    VARCHAR(150) UNIQUE NOT NULL,
                            senha    TEXT                NOT NULL,
                            telefone VARCHAR(20)         NOT NULL,
                            nome_pet VARCHAR(80)  DEFAULT 'Não informado',
                            endereco VARCHAR(400) DEFAULT 'Não informado',
                            cpf      VARCHAR(14) UNIQUE,
                            is_ativo BOOLEAN      DEFAULT TRUE
                        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS Cargos
                        (
                            Id   SERIAL PRIMARY KEY,
                            Nome VARCHAR(50) UNIQUE NOT NULL
                        );""")

        curs.execute("INSERT INTO Cargos (Nome) VALUES ('gestor') ON CONFLICT (Nome) DO NOTHING;")
        curs.execute("INSERT INTO Cargos (Nome) VALUES ('funcionario') ON CONFLICT (Nome) DO NOTHING;")

        curs.execute("""CREATE TABLE IF NOT EXISTS produtos_externos
                        (
                            barcode          VARCHAR(50) PRIMARY KEY,
                            product_name     TEXT,
                            brands           TEXT,
                            categories       TEXT,
                            image_url        TEXT,
                            ingredients_text TEXT,
                            nutriscore_grade VARCHAR(20),
                            ecoscore_grade   VARCHAR(20),
                            data_sync        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS Funcionarios
                        (
                            Id             SERIAL PRIMARY KEY,
                            Nome           VARCHAR(150)        NOT NULL,
                            CPF            VARCHAR(14) UNIQUE,
                            Email          VARCHAR(150) UNIQUE NOT NULL,
                            Senha          TEXT                NOT NULL,
                            Telefone       VARCHAR(20)         NOT NULL,
                            Endereco       VARCHAR(400)             DEFAULT 'Não informado',
                            Cargo_funcao   VARCHAR(100)        NOT NULL,
                            Horario_inicio TIME                NOT NULL,
                            Horario_fim    TIME                NOT NULL,
                            Dias_trabalho  TEXT                NOT NULL,
                            Cargo_id       INT                 NOT NULL REFERENCES Cargos (Id),
                            Is_ativo       BOOLEAN                  DEFAULT TRUE,
                            Data_cadastro  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS produtos_cadastrados
                        (
                            id                 SERIAL PRIMARY KEY,
                            barcode            VARCHAR(50) UNIQUE NOT NULL,
                            nome               TEXT               NOT NULL,
                            marca              TEXT,
                            categoria          TEXT,
                            descricao          TEXT,
                            url_imagem         TEXT,
                            preco_venda        NUMERIC(10, 2)     NOT NULL,
                            estoque            INT                NOT NULL DEFAULT 0,
                            animais_alvo       VARCHAR(20)                 DEFAULT 'Todos',
                            cadastrado_por_id  INT REFERENCES funcionarios (id),
                            data_cadastro      TIMESTAMP WITH TIME ZONE    DEFAULT CURRENT_TIMESTAMP,
                            ultima_atualizacao TIMESTAMP WITH TIME ZONE    DEFAULT CURRENT_TIMESTAMP
                        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS Pets
                        (
                            id         SERIAL PRIMARY KEY,
                            nome       VARCHAR(80) NOT NULL,
                            tipo       VARCHAR(80) NOT NULL,
                            raca       VARCHAR(50) NOT NULL,
                            idade      SMALLINT    NOT NULL,
                            peso       FLOAT,
                            cliente_id INTEGER REFERENCES Clientes (id) ON DELETE CASCADE
                        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS vacinas
                        (
                            id                SERIAL PRIMARY KEY,
                            pet_id            INTEGER      NOT NULL REFERENCES Pets (id) ON DELETE CASCADE,
                            nome_vacina       VARCHAR(100) NOT NULL,
                            data_aplicacao    DATE         NOT NULL,
                            data_proxima_dose DATE,
                            funcionario_id    INTEGER      REFERENCES Funcionarios (id) ON DELETE SET NULL,
                            criado_em         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS historico_medico
                        (
                            id             SERIAL PRIMARY KEY,
                            pet_id         INTEGER                  NOT NULL REFERENCES Pets (id) ON DELETE CASCADE,
                            tipo_servico   VARCHAR(50)              NOT NULL,
                            data_hora      TIMESTAMP WITH TIME ZONE NOT NULL,
                            resumo         TEXT                     NOT NULL,
                            detalhes       TEXT,
                            funcionario_id INTEGER                  REFERENCES Funcionarios (id) ON DELETE SET NULL,
                            valor          NUMERIC(10, 2)
                        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS Cliente_historico
                        (
                            id             SERIAL PRIMARY KEY,
                            cliente_id     INT       NOT NULL,
                            funcionario_id INT REFERENCES funcionarios (id),
                            campo          TEXT      NOT NULL,
                            valor_antigo   TEXT,
                            valor_novo     TEXT,
                            data_hora      TIMESTAMP NOT NULL DEFAULT NOW()
                        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS CodigosVerificacao
                        (
                            id         SERIAL PRIMARY KEY,
                            cliente_id INTEGER                  NOT NULL REFERENCES Clientes (id) ON DELETE CASCADE,
                            codigo     VARCHAR(6)               NOT NULL,
                            expiracao  TIMESTAMP WITH TIME ZONE NOT NULL,
                            criado_em  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS PasswordResetTokens
                        (
                            id             SERIAL PRIMARY KEY,
                            cliente_id     INTEGER REFERENCES Clientes (id) ON DELETE CASCADE,
                            funcionario_id INTEGER REFERENCES Funcionarios (id) ON DELETE CASCADE,
                            token          VARCHAR(64) UNIQUE       NOT NULL,
                            expiracao      TIMESTAMP WITH TIME ZONE NOT NULL,
                            criado_em      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            CONSTRAINT check_user_type CHECK (
                                (cliente_id IS NOT NULL AND funcionario_id IS NULL) OR
                                (cliente_id IS NULL AND funcionario_id IS NOT NULL)
                                )
                        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS catalogo_servicos
                        (
                            id            SERIAL PRIMARY KEY,
                            nome          VARCHAR(255)   NOT NULL,
                            descricao     TEXT,
                            duracao       INTEGER        NOT NULL CHECK (duracao > 0),
                            preco         NUMERIC(10, 2) NOT NULL CHECK (preco > 0),
                            criador_id    INTEGER        REFERENCES Funcionarios (id) ON DELETE SET NULL,
                            criado_em     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS Agendamentos
                        (
                            id               SERIAL PRIMARY KEY,
                            cliente_id       INTEGER                  NOT NULL REFERENCES Clientes (id) ON DELETE CASCADE,
                            pet_id           INTEGER                  NOT NULL REFERENCES Pets (id) ON DELETE CASCADE,
                            servico_id       INTEGER                  NOT NULL REFERENCES catalogo_servicos (id) ON DELETE RESTRICT,
                            funcionario_id   INTEGER                  REFERENCES Funcionarios (id) ON DELETE SET NULL,
                            data_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
                            data_hora_fim    TIMESTAMP WITH TIME ZONE NOT NULL,
                            status           VARCHAR(50)              DEFAULT 'Agendado',
                            observacoes      TEXT,
                            criado_em        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            UNIQUE (funcionario_id, data_hora_inicio),
                            UNIQUE (pet_id, data_hora_inicio)
                        );""")

        curs.execute("""
                     CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora
                         ON Agendamentos (data_hora_inicio, data_hora_fim);
                     """)

        curs.execute("""CREATE TABLE IF NOT EXISTS Funcionario_Especialidades
                        (
                            funcionario_id INTEGER NOT NULL REFERENCES Funcionarios (Id) ON DELETE CASCADE,
                            servico_id     INTEGER NOT NULL REFERENCES catalogo_servicos (id) ON DELETE CASCADE,
                            PRIMARY KEY (funcionario_id, servico_id)
                        );
                     """)

        curs.execute("""CREATE TABLE IF NOT EXISTS Vendas
                        (
                            id               SERIAL PRIMARY KEY,
                            funcionario_id   INTEGER REFERENCES Funcionarios (id),
                            cliente_id       INTEGER REFERENCES Clientes (id),
                            total            NUMERIC(10, 2) NOT NULL,
                            forma_pagamento  VARCHAR(50)    NOT NULL,
                            status_pagamento VARCHAR(20) DEFAULT 'pendente',
                            criado_em        TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
                        );""")

        curs.execute("""CREATE TABLE IF NOT EXISTS ItensVenda
                        (
                            id             SERIAL PRIMARY KEY,
                            venda_id       INTEGER REFERENCES Vendas (id) ON DELETE CASCADE,
                            tipo           VARCHAR(20)    NOT NULL,
                            id_item        INTEGER        NOT NULL,
                            nome           VARCHAR(255)   NOT NULL,
                            quantidade     INTEGER        NOT NULL,
                            preco_unitario NUMERIC(10, 2) NOT NULL
                        );""")

        curs.execute("""
                     CREATE TABLE IF NOT EXISTS EnderecosEntrega
                     (
                         id         SERIAL PRIMARY KEY,
                         cliente_id INTEGER      NOT NULL REFERENCES Clientes (id) ON DELETE CASCADE,
                         rua        VARCHAR(255) NOT NULL,
                         numero     VARCHAR(20)  NOT NULL,
                         bairro     VARCHAR(100) NOT NULL,
                         cidade     VARCHAR(100) NOT NULL,
                         estado     VARCHAR(50)  NOT NULL,
                         cep        VARCHAR(20)  NOT NULL
                     );
                     """)

        curs.execute("""
                     CREATE TABLE IF NOT EXISTS Checkouts
                     (
                         id                  SERIAL PRIMARY KEY,
                         cliente_id          INTEGER     NOT NULL REFERENCES Clientes (id) ON DELETE CASCADE,
                         endereco_entrega_id INTEGER     REFERENCES EnderecosEntrega (id) ON DELETE SET NULL,
                         retirada_na_loja    BOOLEAN                  DEFAULT FALSE,
                         forma_pagamento     VARCHAR(20) NOT NULL,
                         status_pagamento    VARCHAR(20)              DEFAULT 'pendente',
                         total               NUMERIC(10, 2)           DEFAULT 0.00,
                         criado_em           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                     );
                     """)

        curs.execute("""
                     CREATE TABLE IF NOT EXISTS ItensCheckout
                     (
                         id             SERIAL PRIMARY KEY,
                         checkout_id    INTEGER        NOT NULL REFERENCES Checkouts (id) ON DELETE CASCADE,
                         tipo           VARCHAR(20)    NOT NULL,
                         id_item        INTEGER        NOT NULL,
                         nome           VARCHAR(255)   NOT NULL,
                         quantidade     INTEGER        NOT NULL CHECK (quantidade > 0),
                         preco_unitario NUMERIC(10, 2) NOT NULL
                     );
                     """)

        curs.execute("""
                     CREATE TABLE IF NOT EXISTS despesas
                     (
                         id        SERIAL PRIMARY KEY,
                         descricao VARCHAR(255)   NOT NULL,
                         valor     NUMERIC(10, 2) NOT NULL,
                         data      DATE           NOT NULL
                     );
                     """)

        curs.execute("""CREATE TABLE IF NOT EXISTS configuracao_empresa
                        (
                            id       SERIAL PRIMARY KEY,
                            endereco VARCHAR(255),
                            telefone VARCHAR(50),
                            email    VARCHAR(150)
                        );""")

        try:
            curs.execute("ALTER TABLE configuracao_empresa ADD COLUMN IF NOT EXISTS email VARCHAR(150);")
            curs.execute("ALTER TABLE configuracao_empresa DROP COLUMN IF EXISTS logo_url;")
        except Exception as e:
            print(f"Aviso ao alterar estrutura da tabela config: {e}")
            conectado.rollback()

        # garante que existe pelo menos uma linha (id 1) com valores padrão
        curs.execute("""
                     INSERT INTO configuracao_empresa (id, endereco, telefone, email)
                     SELECT 1, '', '', 'contato@petlife.com'
                     WHERE NOT EXISTS (SELECT 1 FROM configuracao_empresa WHERE id = 1);
                     """)

        # --- ATUALIZAÇÃO NA TABELA DE HORÁRIOS ---
        # Verifica se a tabela antiga existe e se ela NAO tem a nova coluna.
        # Se for a tabela antiga, dropamos para recriar com a estrutura correta.
        curs.execute("""
                     SELECT column_name
                     FROM information_schema.columns
                     WHERE table_name = 'horarios_funcionamento'
                       AND column_name = 'inicio_manha';
                     """)
        if not curs.fetchone():
            print("Atualizando estrutura da tabela de horários (migração)...")
            curs.execute("DROP TABLE IF EXISTS horarios_funcionamento;")

        # Cria a tabela com suporte a Manhã/Tarde e Ativo/Inativo
        curs.execute("""
                     CREATE TABLE IF NOT EXISTS horarios_funcionamento
                     (
                         id           SERIAL PRIMARY KEY,
                         dia_semana   VARCHAR(20) UNIQUE NOT NULL,
                         inicio_manha TIME    DEFAULT '08:00',
                         fim_manha    TIME    DEFAULT '12:00',
                         manha_ativa  BOOLEAN DEFAULT TRUE,
                         inicio_tarde TIME    DEFAULT '13:00',
                         fim_tarde    TIME    DEFAULT '18:00',
                         tarde_ativa  BOOLEAN DEFAULT TRUE
                     );
                     """)

        # Inserir os 7 dias da semana automaticamente se não existirem
        dias = [
            'Segunda-feira', 'Terça-feira', 'Quarta-feira',
            'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'
        ]

        for dia in dias:
            curs.execute("""
                         INSERT INTO horarios_funcionamento (dia_semana)
                         VALUES (%s)
                         ON CONFLICT (dia_semana) DO NOTHING;
                         """, (dia,))

        try:
            curs.execute("""
                         ALTER TABLE Agendamentos
                             ADD COLUMN IF NOT EXISTS status_motivo TEXT;
                         """)

        except pg.Error as e:
            print(f"Ignorando erro ao adicionar coluna (provavelmente já existe): {e}")
            conectado.rollback()

        conectado.commit()
        print("Verificação e criação de tabelas concluída com sucesso.")
        curs.close()
    finally:
        encerra_conexao(conectado)


obter_conexao = conectar
if __name__ == '__main__':
    print("Iniciando a criação das tabelas no banco de dados...")
    criar_tabelas()