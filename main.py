from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
import os
import threading
from bancoDeDados import criar_tabelas
import sync_data
from routers import cliente_router, pet_router, login_router, funcionario_router, admin_router, produto_router, servico_router, admin_pet_router, agendamento_router, venda_router, checkout_router, despesa_router
from fastapi.responses import FileResponse
from fastapi import HTTPException

basedir = os.path.abspath(os.path.dirname(__file__))
frontend_dir = os.path.join(basedir, "build")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando aplicação...")
    criar_tabelas()

    print("Iniciando a sincronizaçao de dados externos em segundo plano...")
    sync_thread = threading.Thread(target=sync_data.run_sync)
    sync_thread.start()

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

app.mount("/static", StaticFiles(directory=os.path.join(frontend_dir, "static")), name="static")

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    else:
        raise HTTPException(status_code=404, detail="Interface não encontrada.")