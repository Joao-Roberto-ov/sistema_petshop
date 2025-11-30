from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
import os
import threading
import time  # Adicionado para o agendador
from bancoDeDados import criar_tabelas
import sync_data
from fastapi.responses import FileResponse
from fastapi import HTTPException
from routers import (
    cliente_router,
    pet_router,
    login_router,
    funcionario_router,
    admin_router,
    produto_router,
    servico_router,
    admin_pet_router,
    agendamento_router,
    venda_router,
    checkout_router,
    config_router,
    historico_medico_router,
    vacina_router,
    despesa_router,
    user_router,
    estoque_config_router,
    notificacao_router
)

basedir = os.path.abspath(os.path.dirname(__file__))
frontend_dir = os.path.join(basedir, "build")


# --- Função do Agendador de Lembretes (AC1) ---
def agendador_lembretes():
    """
    Executa em background para verificar e enviar lembretes de agendamentos
    que ocorrerão nas próximas 24 horas.
    """
    # Importação local para evitar ciclo de importação na inicialização
    from services.agendamento_service import ServicosAgendamento

    # Aguarda um pouco para garantir que o banco esteja totalmente acessível
    time.sleep(10)

    service = ServicosAgendamento()
    print("⏰ Thread de lembretes automáticos iniciada.")

    while True:
        try:
            # Executa a verificação
            service.processar_lembretes_24h()

            # Verifica novamente a cada 1 hora (3600 segundos)
            time.sleep(3600)
        except Exception as e:
            print(f"❌ Erro no agendador de lembretes: {e}")
            # Em caso de erro, espera 5 minutos antes de tentar de novo
            time.sleep(300)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando aplicação...")
    criar_tabelas()

    print("Iniciando a sincronizaçao de dados externos em segundo plano...")
    sync_thread = threading.Thread(target=sync_data.run_sync, daemon=True)
    sync_thread.start()

    # Inicia a thread de lembretes automáticos
    print("Iniciando agendador de lembretes...")
    reminder_thread = threading.Thread(target=agendador_lembretes, daemon=True)
    reminder_thread.start()

    yield

    print("Encerrando aplicação.")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Rotas de Teste e Debug (Mantidas) ---

@app.get("/teste-historico-direto/{pet_id}")
async def teste_historico_direto(pet_id: int):
    """
    Rota direta para teste do histórico (REMOVER EM PRODUÇÃO)
    """
    from bancoDeDados import conectar, encerra_conexao
    from services import vacina_service

    conn = None
    cursor = None

    try:
        conn = conectar()
        cursor = conn.cursor()

        # Buscar dados do pet
        cursor.execute("SELECT id, nome, tipo, raca, idade, peso, sexo_biologico, observacoes FROM Pets WHERE id = %s",
                       (pet_id,))
        pet_row = cursor.fetchone()

        if not pet_row:
            return {"error": "Pet não encontrado"}

        pet_data = {
            "id": pet_row[0],
            "nome": pet_row[1],
            "tipo": pet_row[2],
            "raca": pet_row[3],
            "idade": pet_row[4],
            "peso": float(pet_row[5]) if pet_row[5] else None,
            "sexo_biologico": pet_row[6],
            "observacoes": pet_row[7]
        }

        # Buscar histórico médico
        cursor.execute("""
                       SELECT h.id,
                              h.tipo_servico,
                              h.data_hora,
                              h.resumo,
                              h.detalhes,
                              h.funcionario_id,
                              h.valor,
                              f.nome as funcionario_nome
                       FROM historico_medico h
                                LEFT JOIN funcionarios f ON h.funcionario_id = f.id
                       WHERE h.pet_id = %s
                       ORDER BY h.data_hora DESC
                       """, (pet_id,))

        historico_rows = cursor.fetchall()
        historico = []

        for row in historico_rows:
            historico.append({
                "id": row[0],
                "tipo_servico": row[1],
                "data_hora": row[2].isoformat() if row[2] else None,
                "resumo": row[3],
                "detalhes": row[4],
                "funcionario_id": row[5],
                "valor": float(row[6]) if row[6] else None,
                "funcionario_nome": row[7]
            })

        # Buscar vacinas
        vacinas = vacina_service.obter_vacinas_por_pet_id(pet_id)
        vacinas_data = [vacina.dict() for vacina in vacinas]

        return {
            "success": True,
            "dados_pet": pet_data,
            "historico": historico,
            "vacinas": vacinas_data,
            "total_registros": len(historico) + len(vacinas_data)
        }

    except Exception as e:
        return {"error": f"Erro: {str(e)}"}
    finally:
        if cursor:
            cursor.close()
        if conn:
            encerra_conexao(conn)


@app.get("/routes")
async def list_routes():
    routes = []
    for route in app.routes:
        if hasattr(route, "methods") and hasattr(route, "path"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods)
            })
    return routes


@app.get("/api/historico-completo/{pet_id}")
async def historico_completo(pet_id: int):
    """
    Rota consolidada para obter todo o histórico do pet (histórico médico + vacinas)
    """
    from bancoDeDados import conectar, encerra_conexao
    from services import vacina_service

    conn = None
    cursor = None

    try:
        conn = conectar()
        cursor = conn.cursor()

        # Buscar dados do pet
        cursor.execute("SELECT id, nome, tipo, raca, idade, peso, sexo_biologico, observacoes FROM Pets WHERE id = %s",
                       (pet_id,))
        pet_row = cursor.fetchone()

        if not pet_row:
            return {"error": "Pet não encontrado"}

        pet_data = {
            "id": pet_row[0],
            "nome": pet_row[1],
            "tipo": pet_row[2],
            "raca": pet_row[3],
            "idade": pet_row[4],
            "peso": float(pet_row[5]) if pet_row[5] else None,
            "sexo_biologico": pet_row[6],
            "observacoes": pet_row[7]
        }

        # Buscar histórico médico
        cursor.execute("""
                       SELECT h.id,
                              h.tipo_servico,
                              h.data_hora,
                              h.resumo,
                              h.detalhes,
                              h.funcionario_id,
                              h.valor,
                              f.nome as funcionario_nome
                       FROM historico_medico h
                                LEFT JOIN funcionarios f ON h.funcionario_id = f.id
                       WHERE h.pet_id = %s
                       ORDER BY h.data_hora DESC
                       """, (pet_id,))

        historico_rows = cursor.fetchall()
        historico = []

        for row in historico_rows:
            historico.append({
                "id": row[0],
                "tipo_servico": row[1],
                "data_hora": row[2].isoformat() if row[2] else None,
                "resumo": row[3],
                "detalhes": row[4],
                "funcionario_id": row[5],
                "valor": float(row[6]) if row[6] else None,
                "funcionario_nome": row[7]
            })

        # Buscar vacinas
        vacinas = vacina_service.obter_vacinas_por_pet_id(pet_id)
        vacinas_data = [{
            "id": vacina.id,
            "nome_vacina": vacina.nome_vacina,
            "data_aplicacao": vacina.data_aplicacao.isoformat() if vacina.data_aplicacao else None,
            "data_proxima_dose": vacina.data_proxima_dose.isoformat() if vacina.data_proxima_dose else None,
            "funcionario_id": vacina.funcionario_id,
            "funcionario_nome": vacina.funcionario_nome
        } for vacina in vacinas]

        return {
            "success": True,
            "dados_pet": pet_data,
            "historico": historico,
            "vacinas": vacinas_data,
            "total_registros": len(historico) + len(vacinas_data)
        }

    except Exception as e:
        return {"error": f"Erro: {str(e)}"}
    finally:
        if cursor:
            cursor.close()
        if conn:
            encerra_conexao(conn)


# routers
app.include_router(cliente_router.router)
app.include_router(funcionario_router.router)
app.include_router(login_router.router)
app.include_router(pet_router.router)
app.include_router(servico_router.router)
app.include_router(venda_router.router)
app.include_router(admin_router.router, prefix="/api")
app.include_router(admin_pet_router.router, prefix="/api")
app.include_router(produto_router.router)
app.include_router(checkout_router.router)
app.include_router(agendamento_router.router)
app.include_router(despesa_router.router)
app.include_router(config_router.router, prefix="/api")
app.include_router(user_router.router)
app.include_router(historico_medico_router.router, prefix="/api")
app.include_router(vacina_router.router, prefix="/api")
app.include_router(notificacao_router.router)
app.include_router(estoque_config_router.router)

app.mount("/static", StaticFiles(directory=os.path.join(frontend_dir, "static")), name="static")

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    else:
        raise HTTPException(status_code=404, detail="Interface não encontrada.")