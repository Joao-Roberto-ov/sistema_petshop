from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
import os
import threading
from bancoDeDados import criar_tabelas
import sync_data
from routers import cliente_router, pet_router, login_router, funcionario_router, produto_router

basedir = os.path.abspath(os.path.dirname(__file__))
frontend_dir = os.path.join(basedir, "build")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando aplicação...")
    criar_tabelas()

    #inicia a sincronizaçao com a API em outra thread
    print("Iniciando a sincronizaçao de dados externos em segundo plano...")
    sync_thread = threading.Thread(target=sync_data.run_sync)
    sync_thread.start()

    yield #a aplicação vai ficar rodando aqui

    print("Encerrando aplicação.")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cliente_router.router)
app.include_router(funcionario_router.router)
app.include_router(login_router.router)
app.include_router(pet_router.router)
app.include_router(produto_router.router)
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static")