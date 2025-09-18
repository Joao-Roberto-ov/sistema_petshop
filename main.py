from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
import os
from bancoDeDados import criar_tabelas
from routers import cliente_router, login_router

basedir = os.path.abspath(os.path.dirname(__file__))
frontend_dir = os.path.join(basedir, "front-end")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("iniciando api")
    criar_tabelas()
    yield
    print("Encerrando api.")
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], #quando for pra nuvem, lembrar de colocar meu dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cliente_router.router)
app.include_router(login_router.router)
# app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static")