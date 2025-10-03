
import os
from dotenv import load_dotenv
from bancoDeDados import conectar, encerra_conexao

load_dotenv()

def deletar_usuario_admin(email):
    conectado = conectar()
    if not conectado:
        print("Não foi possível conectar ao banco de dados.")
        return

    try:
        curs = conectado.cursor()
        
        # Deletar o funcionário com base no email
        curs.execute("DELETE FROM Funcionarios WHERE Email = %s RETURNING Id;", (email,))
        deleted_id = curs.fetchone()
        
        if deleted_id:
            conectado.commit()
            print(f"Usuário com email \'{email}\' (ID: {deleted_id[0]}) deletado com sucesso!")
        else:
            conectado.rollback()
            print(f"Nenhum usuário encontrado com o email \'{email}\' para deletar.")

    except Exception as e:
        conectado.rollback()
        print(f"Erro ao deletar usuário: {e}")
    finally:
        encerra_conexao(conectado)

if __name__ == '__main__':
    print("Este script requer que as variáveis de ambiente do banco de dados estejam configuradas (.env).")
    
    email_para_deletar = input("Digite o email do administrador a ser deletado: ")
    deletar_usuario_admin(email_para_deletar)

