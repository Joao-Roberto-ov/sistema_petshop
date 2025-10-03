
import os
from dotenv import load_dotenv
from bancoDeDados import conectar, encerra_conexao
from seguranca import cria_hash_senha

load_dotenv()

def criar_usuario_admin(nome, email, senha, telefone, cpf, endereco):
    conectado = conectar()
    if not conectado:
        print("Não foi possível conectar ao banco de dados.")
        return

    try:
        curs = conectado.cursor()
        
        # Garantir que o cargo 'Gestor' exista e obter seu ID
        curs.execute("INSERT INTO Cargos (Nome) VALUES ('Gestor') ON CONFLICT (Nome) DO UPDATE SET Nome = EXCLUDED.Nome RETURNING Id;")
        conectado.commit()
        curs.execute("SELECT Id FROM Cargos WHERE Nome = %s", ('Gestor',))
        resultado_cargo = curs.fetchone()
        
        if resultado_cargo:
            cargo_id = resultado_cargo[0]
        else:
            print("Erro: Não foi possível obter o ID do cargo 'Gestor' após a tentativa de criação.")
            return

        # Gerar hash da senha
        senha_hash = cria_hash_senha(senha)

        # Inserir o funcionário com cargo de Gestor (administrador)
        curs.execute("""INSERT INTO Funcionarios (
            Nome, Email, Senha, Telefone, CPF, Endereco, Cargo_id, Is_ativo
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE) RETURNING Id;""",
        (nome, email, senha_hash, telefone, cpf, endereco, cargo_id))
        
        user_id = curs.fetchone()[0]
        conectado.commit()
        print(f"Usuário administrador '{nome}' criado com sucesso! ID: {user_id}")

    except Exception as e:
        conectado.rollback()
        print(f"Erro ao criar usuário administrador: {e}")
    finally:
        encerra_conexao(conectado)

if __name__ == '__main__':
    # Exemplo de uso: substitua pelos dados desejados
    print("Este script requer que as variáveis de ambiente do banco de dados estejam configuradas (.env).")
    print("Certifique-se de que as tabelas do banco de dados foram criadas (executando main.py uma vez).")
    
    nome_admin = input("Digite o nome do administrador: ")
    email_admin = input("Digite o email do administrador: ")
    senha_admin = input("Digite a senha do administrador: ")
    telefone_admin = input("Digite o telefone do administrador: ")
    cpf_admin = input("Digite o CPF do administrador (opcional, deixe em branco se não tiver): ")
    endereco_admin = input("Digite o endereço do administrador (opcional, deixe em branco se não tiver): ")

    criar_usuario_admin(nome_admin, email_admin, senha_admin, telefone_admin, cpf_admin, endereco_admin)

