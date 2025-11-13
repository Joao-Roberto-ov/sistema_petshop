# adicionar_vacinas_exemplo.py
import sys
import os
from datetime import datetime, timedelta

# Adicionar o diretório raiz ao path para importar os módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bancoDeDados import conectar, encerra_conexao
from seguranca import cria_hash_senha

def adicionar_vacinas_exemplo():
    """
    Script para adicionar vacinas de exemplo nos pets com ID 4 e 2
    usando o funcionário ID 29 como responsável
    """
    conn = None
    cursor = None
    
    try:
        # Conectar ao banco de dados
        conn = conectar()
        cursor = conn.cursor()
        
        print("🔄 Conectado ao banco de dados...")
        
        # Primeiro, vamos verificar se os pets existem e obter suas informações
        cursor.execute("SELECT id, nome, tipo FROM Pets WHERE id IN (2, 4)")
        pets = cursor.fetchall()
        
        if not pets:
            print("❌ Pets com ID 2 e 4 não encontrados!")
            return
        
        print(f"✅ Pets encontrados: {[f'ID {p[0]} - {p[1]} ({p[2]})' for p in pets]}")
        
        # Verificar se o funcionário ID 29 existe
        cursor.execute("SELECT id, nome, cargo_id FROM Funcionarios WHERE id = 29")
        funcionario = cursor.fetchone()
        
        if not funcionario:
            print("❌ Funcionário com ID 29 não encontrado!")
            
            # Tentar encontrar outro funcionário como fallback
            cursor.execute("SELECT id, nome, cargo_id FROM Funcionarios WHERE cargo_id IN (1, 3) LIMIT 1")
            funcionario = cursor.fetchone()
            
            if not funcionario:
                print("❌ Nenhum funcionário (veterinário/gestor) encontrado!")
                return
            else:
                print(f"⚠️  Usando funcionário alternativo: {funcionario[1]} (ID: {funcionario[0]})")
        else:
            print(f"✅ Funcionário responsável: {funcionario[1]} (ID: {funcionario[0]}, Cargo: {funcionario[2]})")
        
        funcionario_id = funcionario[0]
        
        # Vacinas de exemplo para cada pet
        vacinas_exemplo = [
            # Pet ID 2 (presumivelmente um cão)
            {
                "pet_id": 2,
                "vacinas": [
                    {
                        "nome_vacina": "Polivalente V10",
                        "data_aplicacao": datetime.now() - timedelta(days=180),  # 6 meses atrás
                        "data_proxima_dose": None,  # Será calculada automaticamente
                        "funcionario_id": funcionario_id
                    },
                    {
                        "nome_vacina": "Antirrábica",
                        "data_aplicacao": datetime.now() - timedelta(days=150),  # 5 meses atrás
                        "data_proxima_dose": None,
                        "funcionario_id": funcionario_id
                    },
                    {
                        "nome_vacina": "Gripe Canina (Bordetella)",
                        "data_aplicacao": datetime.now() - timedelta(days=120),  # 4 meses atrás
                        "data_proxima_dose": None,
                        "funcionario_id": funcionario_id
                    },
                    {
                        "nome_vacina": "Giárdia",
                        "data_aplicacao": datetime.now() - timedelta(days=90),  # 3 meses atrás
                        "data_proxima_dose": None,
                        "funcionario_id": funcionario_id
                    }
                ]
            },
            # Pet ID 4 (presumivelmente um gato)
            {
                "pet_id": 4,
                "vacinas": [
                    {
                        "nome_vacina": "Polivalente V4",
                        "data_aplicacao": datetime.now() - timedelta(days=200),  # ~6.5 meses atrás
                        "data_proxima_dose": None,
                        "funcionario_id": funcionario_id
                    },
                    {
                        "nome_vacina": "Antirrábica",
                        "data_aplicacao": datetime.now() - timedelta(days=170),  # ~5.5 meses atrás
                        "data_proxima_dose": None,
                        "funcionario_id": funcionario_id
                    },
                    {
                        "nome_vacina": "Leucemia Felina (FeLV)",
                        "data_aplicacao": datetime.now() - timedelta(days=140),  # ~4.5 meses atrás
                        "data_proxima_dose": None,
                        "funcionario_id": funcionario_id
                    }
                ]
            }
        ]
        
        # Função para calcular próxima dose automaticamente
        def calcular_proxima_dose_auto(nome_vacina, data_aplicacao, especie_pet):
            nome_vacina_lower = nome_vacina.lower()
            especie_lower = especie_pet.lower()
            
            # Todas as vacinas têm reforço anual
            return data_aplicacao.replace(year=data_aplicacao.year + 1)
        
        total_vacinas_adicionadas = 0
        
        # Inserir as vacinas
        for pet_vacinas in vacinas_exemplo:
            pet_id = pet_vacinas["pet_id"]
            
            # Obter a espécie do pet
            cursor.execute("SELECT tipo FROM Pets WHERE id = %s", (pet_id,))
            pet_info = cursor.fetchone()
            
            if not pet_info:
                print(f"❌ Pet ID {pet_id} não encontrado!")
                continue
            
            especie_pet = pet_info[0]
            print(f"\n🐾 Adicionando vacinas para Pet ID {pet_id} ({especie_pet}):")
            
            for vacina in pet_vacinas["vacinas"]:
                # Calcular próxima dose se não foi fornecida
                data_proxima_dose = vacina["data_proxima_dose"]
                if not data_proxima_dose:
                    data_proxima_dose = calcular_proxima_dose_auto(
                        vacina["nome_vacina"],
                        vacina["data_aplicacao"],
                        especie_pet
                    )
                
                # Inserir a vacina
                cursor.execute("""
                    INSERT INTO vacinas (pet_id, nome_vacina, data_aplicacao, data_proxima_dose, funcionario_id)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    pet_id,
                    vacina["nome_vacina"],
                    vacina["data_aplicacao"],
                    data_proxima_dose,
                    vacina["funcionario_id"]
                ))
                
                total_vacinas_adicionadas += 1
                print(f"   ✅ {vacina['nome_vacina']}")
                print(f"      Aplicada: {vacina['data_aplicacao'].strftime('%d/%m/%Y')}")
                print(f"      Próxima: {data_proxima_dose.strftime('%d/%m/%Y')}")
                print(f"      Responsável: Funcionário ID {funcionario_id}")
        
        # Commit das alterações
        conn.commit()
        print(f"\n🎉 {total_vacinas_adicionadas} vacinas adicionadas com sucesso!")
        
        # Mostrar resumo detalhado
        print("\n📊 RESUMO DETALHADO DAS VACINAS ADICIONADAS:")
        for pet_vacinas in vacinas_exemplo:
            pet_id = pet_vacinas["pet_id"]
            cursor.execute("""
                SELECT p.nome, p.tipo, v.nome_vacina, v.data_aplicacao, v.data_proxima_dose, 
                       f.nome as funcionario_nome, f.id as funcionario_id
                FROM vacinas v 
                JOIN Pets p ON v.pet_id = p.id
                LEFT JOIN funcionarios f ON v.funcionario_id = f.id 
                WHERE v.pet_id = %s
                ORDER BY v.data_aplicacao DESC
            """, (pet_id,))
            
            vacinas_pet = cursor.fetchall()
            if vacinas_pet:
                print(f"\n📋 Pet: {vacinas_pet[0][0]} ({vacinas_pet[0][1]}) - ID {pet_id}:")
                for vac in vacinas_pet:
                    status = "🟢 Concluída" if not vac[4] else "🟡 Pendente" if vac[4] > datetime.now() else "🔴 Atrasada"
                    print(f"   💉 {vac[2]}:")
                    print(f"      📅 Aplicação: {vac[3].strftime('%d/%m/%Y')}")
                    print(f"      🔄 Próxima: {vac[4].strftime('%d/%m/%Y') if vac[4] else 'N/A'}")
                    print(f"      👨‍⚕️  Responsável: {vac[5]} (ID: {vac[6]})")
                    print(f"      📊 Status: {status}")
        
        print(f"\n👨‍⚕️ TODAS AS VACINAS FORAM REGISTRADAS PELO FUNCIONÁRIO ID {funcionario_id}")
        
    except Exception as e:
        print(f"❌ Erro ao adicionar vacinas: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            encerra_conexao(conn)
        print("\n🔚 Conexão com o banco encerrada.")

def verificar_vacinas_existentes():
    """
    Função para verificar vacinas já existentes nos pets
    """
    conn = None
    cursor = None
    
    try:
        conn = conectar()
        cursor = conn.cursor()
        
        print("\n🔍 VERIFICANDO VACINAS EXISTENTES:")
        
        for pet_id in [2, 4]:
            cursor.execute("""
                SELECT p.nome, p.tipo, COUNT(v.id) as total_vacinas
                FROM Pets p 
                LEFT JOIN vacinas v ON p.id = v.pet_id 
                WHERE p.id = %s
                GROUP BY p.id, p.nome, p.tipo
            """, (pet_id,))
            
            resultado = cursor.fetchone()
            if resultado:
                nome, tipo, total = resultado
                status = f"✅ {total} vacinas" if total > 0 else "❌ Nenhuma vacina"
                print(f"Pet ID {pet_id}: {nome} ({tipo}) - {status}")
            else:
                print(f"Pet ID {pet_id}: ❌ Não encontrado")
                
    except Exception as e:
        print(f"Erro ao verificar vacinas: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            encerra_conexao(conn)

def verificar_funcionario_29():
    """
    Função para verificar informações do funcionário ID 29
    """
    conn = None
    cursor = None
    
    try:
        conn = conectar()
        cursor = conn.cursor()
        
        print("\n🔍 VERIFICANDO FUNCIONÁRIO ID 29:")
        
        cursor.execute("""
            SELECT id, nome, email, cargo_id, cargo_funcao 
            FROM Funcionarios 
            WHERE id = 29
        """)
        
        funcionario = cursor.fetchone()
        if funcionario:
            print(f"✅ Funcionário encontrado:")
            print(f"   ID: {funcionario[0]}")
            print(f"   Nome: {funcionario[1]}")
            print(f"   Email: {funcionario[2]}")
            print(f"   Cargo ID: {funcionario[3]}")
            print(f"   Função: {funcionario[4]}")
        else:
            print("❌ Funcionário ID 29 não encontrado!")
            
    except Exception as e:
        print(f"Erro ao verificar funcionário: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            encerra_conexao(conn)

if __name__ == "__main__":
    print("=" * 60)
    print("💉 SCRIPT DE ADIÇÃO DE VACINAS EXEMPLO")
    print("👨‍⚕️  RESPONSÁVEL: FUNCIONÁRIO ID 29")
    print("=" * 60)
    
    # Primeiro verificar o funcionário
    verificar_funcionario_29()
    
    # Verificar vacinas existentes
    verificar_vacinas_existentes()
    
    # Perguntar se deseja continuar
    resposta = input("\n❓ Deseja adicionar as vacinas de exemplo com o funcionário ID 29? (s/N): ").strip().lower()
    
    if resposta in ['s', 'sim', 'y', 'yes']:
        print("\n" + "=" * 50)
        adicionar_vacinas_exemplo()
    else:
        print("Operação cancelada.")