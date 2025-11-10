import sys
import os
from datetime import datetime, timedelta

# Adicionar o diretório raiz ao path para importar os módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bancoDeDados import conectar, encerra_conexao

def corrigir_datas_vacinas_para_passado():
    """
    Script para corrigir as datas das vacinas, colocando-as no PASSADO
    para que algumas fiquem como "concluídas" e outras como "atrasadas"
    """
    conn = None
    cursor = None
    
    try:
        # Conectar ao banco de dados
        conn = conectar()
        cursor = conn.cursor()
        
        print("🔄 Conectado ao banco de dados...")
        
        # Buscar todas as vacinas existentes
        cursor.execute("""
            SELECT id, pet_id, nome_vacina, data_aplicacao, data_proxima_dose 
            FROM vacinas 
            ORDER BY pet_id, data_aplicacao
        """)
        
        vacinas = cursor.fetchall()
        
        if not vacinas:
            print("❌ Nenhuma vacina encontrada!")
            return
        
        print(f"✅ Encontradas {len(vacinas)} vacinas:")
        
        # ✅ CORREÇÃO: Datas realistas no PASSADO
        datas_corrigidas = [
            {   # Vacina 1: Aplicada há mais de 1 ano, próxima dose já passou -> ATRASADA
                "data_aplicacao": datetime(2023, 6, 15),  # 1.5 anos atrás
                "data_proxima_dose": datetime(2024, 6, 15),  # 5 meses atrás
            },
            {   # Vacina 2: Aplicada há 1 ano, próxima dose no futuro -> PENDENTE
                "data_aplicacao": datetime(2023, 11, 10),  # 1 ano atrás
                "data_proxima_dose": datetime(2024, 11, 10),  # 5 dias no futuro
            },
            {   # Vacina 3: Aplicada recentemente, sem próxima dose -> CONCLUÍDA
                "data_aplicacao": datetime(2024, 8, 20),  # 2.5 meses atrás
                "data_proxima_dose": None,  # Sem próxima dose
            }
        ]
        
        vacinas_atualizadas = 0
        
        for i, vacina in enumerate(vacinas):
            vacina_id, pet_id, nome_vacina, data_aplicacao, data_proxima_dose = vacina
            
            # Usar datas corrigidas baseadas no índice
            if i < len(datas_corrigidas):
                nova_data_aplicacao = datas_corrigidas[i]["data_aplicacao"]
                nova_data_proxima = datas_corrigidas[i]["data_proxima_dose"]
                
                print(f"\n🔄 Corrigindo vacina ID {vacina_id}:")
                print(f"   Nome: {nome_vacina}")
                print(f"   Pet ID: {pet_id}")
                print(f"   Data aplicação: {data_aplicacao} → {nova_data_aplicacao.strftime('%d/%m/%Y')}")
                print(f"   Próxima dose: {data_proxima_dose} → {nova_data_proxima.strftime('%d/%m/%Y') if nova_data_proxima else 'None'}")
                
                # Atualizar a vacina
                cursor.execute("""
                    UPDATE vacinas 
                    SET data_aplicacao = %s, data_proxima_dose = %s
                    WHERE id = %s
                """, (nova_data_aplicacao, nova_data_proxima, vacina_id))
                
                vacinas_atualizadas += 1
        
        # Commit das alterações
        conn.commit()
        print(f"\n🎉 {vacinas_atualizadas} vacinas atualizadas com sucesso!")
        
        # Mostrar resumo das vacinas corrigidas
        print("\n📊 RESUMO DAS VACINAS CORRIGIDAS:")
        cursor.execute("""
            SELECT p.nome as pet_nome, v.nome_vacina, v.data_aplicacao, v.data_proxima_dose,
                   CASE 
                       WHEN v.data_proxima_dose IS NULL THEN '🟢 CONCLUÍDA'
                       WHEN v.data_proxima_dose < NOW() THEN '🔴 ATRASADA' 
                       ELSE '🟡 PENDENTE'
                   END as status
            FROM vacinas v
            JOIN Pets p ON v.pet_id = p.id
            ORDER BY p.id, v.data_aplicacao
        """)
        
        vacinas_atualizadas = cursor.fetchall()
        for vacina in vacinas_atualizadas:
            pet_nome, nome_vacina, data_app, data_prox, status = vacina
            print(f"🐾 {pet_nome}: {nome_vacina}")
            print(f"   📅 Aplicação: {data_app.strftime('%d/%m/%Y')}")
            print(f"   🔄 Próxima: {data_prox.strftime('%d/%m/%Y') if data_prox else 'N/A'}")
            print(f"   📊 Status: {status}")
            print()
        
    except Exception as e:
        print(f"❌ Erro ao corrigir datas das vacinas: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            encerra_conexao(conn)
        print("\n🔚 Conexão com o banco encerrada.")

def verificar_status_vacinas():
    """
    Verificar o status atual das vacinas
    """
    conn = None
    cursor = None
    
    try:
        conn = conectar()
        cursor = conn.cursor()
        
        print("\n🔍 STATUS ATUAL DAS VACINAS:")
        
        cursor.execute("""
            SELECT 
                p.nome as pet_nome,
                v.nome_vacina,
                v.data_aplicacao,
                v.data_proxima_dose,
                CASE 
                    WHEN v.data_proxima_dose IS NULL THEN 'concluida'
                    WHEN v.data_proxima_dose < NOW() THEN 'atrasada' 
                    ELSE 'pendente'
                END as status
            FROM vacinas v
            JOIN Pets p ON v.pet_id = p.id
            ORDER BY p.nome, v.data_aplicacao
        """)
        
        resultados = cursor.fetchall()
        
        status_count = {'concluida': 0, 'atrasada': 0, 'pendente': 0}
        
        if resultados:
            for resultado in resultados:
                pet_nome, nome_vacina, data_app, data_prox, status = resultado
                status_count[status] += 1
                print(f"🐾 {pet_nome}: {nome_vacina}")
                print(f"   📅 Aplicação: {data_app.strftime('%d/%m/%Y')}")
                print(f"   🔄 Próxima: {data_prox.strftime('%d/%m/%Y') if data_prox else 'N/A'}")
                print(f"   📊 Status: {status.upper()}")
                print()
            
            print(f"📈 RESUMO DE STATUS:")
            print(f"   🟢 Concluídas: {status_count['concluida']}")
            print(f"   🔴 Atrasadas: {status_count['atrasada']}")
            print(f"   🟡 Pendentes: {status_count['pendente']}")
        else:
            print("Nenhuma vacina encontrada.")
            
    except Exception as e:
        print(f"Erro ao verificar status: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            encerra_conexao(conn)

if __name__ == "__main__":
    print("=" * 60)
    print("📅 SCRIPT DE CORREÇÃO DE DATAS DE VACINAS - PASSADO")
    print("=" * 60)
    
    # Primeiro verificar o status atual
    verificar_status_vacinas()
    
    # Perguntar se deseja corrigir as datas
    resposta = input("\n❓ Deseja corrigir as datas das vacinas para o PASSADO? (s/N): ").strip().lower()
    
    if resposta in ['s', 'sim', 'y', 'yes']:
        print("\n" + "=" * 50)
        corrigir_datas_vacinas_para_passado()
        
        # Verificar o novo status
        print("\n" + "=" * 50)
        verificar_status_vacinas()
    else:
        print("Operação cancelada.")