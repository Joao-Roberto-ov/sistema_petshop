import psycopg2
from datetime import datetime, timezone, timedelta

def conectar_banco():
    """Conecta ao banco de dados PostgreSQL"""
    try:
        conn = psycopg2.connect(
            host="host",
            database="postgres",  # Altere se necessário
            user="usuario",     # Altere se necessário
            password="senha", # ⚠️ ALTERE PARA SUA SENHA!
            port="5432"
        )
        print("✅ Conectado ao banco de dados!")
        return conn
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        return None

def verificar_tabela_historico(conn):
    """Verifica se a tabela historico_medico existe"""
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'historico_medico'
            );
        """)
        existe = cursor.fetchone()[0]
        cursor.close()
        
        if existe:
            print("✅ Tabela 'historico_medico' encontrada!")
        else:
            print("❌ Tabela 'historico_medico' não existe!")
        
        return existe
    except Exception as e:
        print(f"❌ Erro ao verificar tabela: {e}")
        return False

def verificar_pet_existe(conn, pet_id):
    """Verifica se o pet com ID 4 existe"""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, nome FROM Pets WHERE id = %s", (pet_id,))
        pet = cursor.fetchone()
        cursor.close()
        
        if pet:
            print(f"✅ Pet encontrado: {pet[1]} (ID: {pet[0]})")
            return True
        else:
            print(f"❌ Pet com ID {pet_id} não encontrado!")
            return False
    except Exception as e:
        print(f"❌ Erro ao verificar pet: {e}")
        return False

def verificar_funcionario_existe(conn, funcionario_id):
    """Verifica se o funcionário com ID 29 existe"""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, nome FROM Funcionarios WHERE id = %s", (funcionario_id,))
        func = cursor.fetchone()
        cursor.close()
        
        if func:
            print(f"✅ Funcionário encontrado: {func[1]} (ID: {func[0]})")
            return True
        else:
            print(f"❌ Funcionário com ID {funcionario_id} não encontrado!")
            return False
    except Exception as e:
        print(f"❌ Erro ao verificar funcionário: {e}")
        return False

def inserir_registros_teste(conn):
    """Insere registros de teste no histórico médico"""
    
    print("\n📝 Inserindo registros de teste...")
    
    registros = [
        {
            "pet_id": 4, #id de um pet (laika de eric natan)
            "tipo_servico": "Consulta",
            "data_hora": datetime.now(timezone.utc),
            "resumo": "Consulta de rotina - check-up geral",
            "detalhes": """Consulta de rotina realizada para check-up geral do pet.

EXAME FÍSICO:
- Temperatura: 38.2°C (normal)
- Peso: 12.5 kg
- Frequência cardíaca: 120 bpm
- Frequência respiratória: 25 rpm

ACHADOS:
- Pelagem em bom estado
- Mucosas rosadas  
- Hidratação adequada
- Nódulos linfáticos normais

RECOMENDAÇÕES:
- Manter alimentação atual
- Retorno em 6 meses para próximo check-up
- Observar comportamento alimentar""",
            "funcionario_id": 29,
            "valor": 120.00
        },
        {
            "pet_id": 4,
            "tipo_servico": "Vacinação", 
            "data_hora": datetime.now(timezone.utc) - timedelta(days=7),
            "resumo": "Aplicação de vacina V8 e antirrábica",
            "detalhes": """Vacinação anual realizada conforme protocolo.

VACINAS APLICADAS:
- V8 (Óctupla): 1 dose - Lote V8-2024-BR-001
- Antirrábica: 1 dose - Lote AR-2024-BR-015

OBSERVAÇÕES:
- Pet comportou-se bem durante aplicação
- Sem reações adversas imediatas
- Orientado observar possíveis reações nas próximas 24h

PRÓXIMAS VACINAS:
- Reforço em 1 ano
- Verificar carteirinha de vacinação""",
            "funcionario_id": 29,
            "valor": 85.50
        },
        {
            "pet_id": 4,
            "tipo_servico": "Banho e Tosa",
            "data_hora": datetime.now(timezone.utc) - timedelta(days=3),
            "resumo": "Banho higiênico e tosa na máquina", 
            "detalhes": """Serviço completo de banho e tosa realizado.

PROCEDIMENTOS REALIZADOS:
- Banho com shampoo hipoalergênico
- Secagem com temperatura controlada
- Tosa na máquina (pelo corpo)
- Corte de unhas
- Limpeza de ouvidos
- Escovação dental

PRODUTOS UTILIZADOS:
- Shampoo Hipoalergênico PetClean
- Condicionador PetSoft
- Lâmina de tosa nº 4

OBSERVAÇÕES:
- Pelagem bastante embaraçada na região dorsal
- Recomendado escovação 3x por semana
- Agendar próximo banho em 30 dias""",
            "funcionario_id": 29,
            "valor": 65.00
        },
        {
            "pet_id": 4,
            "tipo_servico": "Exame",
            "data_hora": datetime.now(timezone.utc) - timedelta(days=1),
            "resumo": "Exame de sangue completo e urina",
            "detalhes": """Exames laboratoriais de rotina solicitados.

EXAMES SOLICITADOS:
- Hemograma completo
- Função renal (ureia e creatinina) 
- Função hepática (TGO, TGP, FA)
- Glicemia
- Exame de urina tipo I

RESULTADOS OBTIDOS:
- Hemograma: Dentro dos limites normais
- Ureia: 45 mg/dL (normal: 20-60)
- Creatinina: 1.2 mg/dL (normal: 0.5-1.8)
- TGO: 35 UI/L (normal: 10-50)
- TGP: 28 UI/L (normal: 10-55)
- Glicemia: 95 mg/dL (normal: 70-120)
- Urina: Densidade 1.025, pH 6.5, sem alterações

CONCLUSÃO:
- Exames dentro da normalidade
- Função renal e hepática preservadas
- Sem evidências de processos infecciosos""",
            "funcionario_id": 29,
            "valor": 150.00
        }
    ]
    
    try:
        cursor = conn.cursor()
        registros_inseridos = 0
        
        for registro in registros:
            cursor.execute("""
                INSERT INTO historico_medico 
                (pet_id, tipo_servico, data_hora, resumo, detalhes, funcionario_id, valor)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                registro["pet_id"],
                registro["tipo_servico"],
                registro["data_hora"],
                registro["resumo"], 
                registro["detalhes"],
                registro["funcionario_id"],
                registro["valor"]
            ))
            
            novo_id = cursor.fetchone()[0]
            registros_inseridos += 1
            print(f"✅ {registro['tipo_servico']} inserido - ID: {novo_id}")
        
        conn.commit()
        cursor.close()
        print(f"\n🎉 {registros_inseridos} registros inseridos com sucesso!")
        return registros_inseridos
        
    except Exception as e:
        print(f"❌ Erro ao inserir registros: {e}")
        conn.rollback()
        return 0

def verificar_registros_inseridos(conn):
    """Verifica os registros inseridos"""
    
    print("\n🔍 Verificando registros inseridos...")
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, tipo_servico, resumo, data_hora, valor 
            FROM historico_medico 
            WHERE pet_id = 4 
            ORDER BY data_hora DESC
        """)
        
        registros = cursor.fetchall()
        cursor.close()
        
        print(f"📊 Total de registros encontrados: {len(registros)}")
        
        for registro in registros:
            print(f"\n--- Registro ID: {registro[0]} ---")
            print(f"Tipo: {registro[1]}")
            print(f"Resumo: {registro[2]}")
            print(f"Data: {registro[3]}")
            print(f"Valor: R$ {registro[4]}")
        
        return registros
        
    except Exception as e:
        print(f"❌ Erro ao verificar registros: {e}")
        return []

def main():
    print("🗄️  INSERÇÃO DIRETA NO BANCO DE DADOS")
    print("=" * 50)
    
    # Conectar ao banco
    conn = conectar_banco()
    if not conn:
        return
    
    try:
        # Verificar pré-requisitos
        if not verificar_tabela_historico(conn):
            return
            
        if not verificar_pet_existe(conn, 4):
            return
            
        if not verificar_funcionario_existe(conn, 29):
            return
        
        # Inserir registros
        inserir_registros_teste(conn)
        
        # Verificar resultado
        verificar_registros_inseridos(conn)
        
    finally:
        conn.close()
        print("\n🔒 Conexão com o banco fechada.")
    
    print("\n" + "=" * 50)
    print("✅ Processo concluído!")
    print("\n💡 Agora volte ao frontend e verifique o histórico do pet Laika (ID: 4)")

if __name__ == "__main__":
    main()