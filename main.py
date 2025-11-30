from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
import os
import threading
import time
from services.pet_service import ServicosPet
from services import vacina_service
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

# --- Montagem de Arquivos Estáticos ---
app.mount("/static", StaticFiles(directory=os.path.join(frontend_dir, "static")), name="static")


# --- Rota Catch-All para o Frontend React ---
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    else:
        raise HTTPException(status_code=404, detail="Interface não encontrada.")