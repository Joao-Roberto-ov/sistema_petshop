from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
import os
from bancoDeDados import criar_tabelas
from routers import cliente_router, pet_router

basedir = os.path.abspath(os.path.dirname(__file__))
frontend_dir = os.path.join(basedir, "build")
# --------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando aplicação")
    criar_tabelas()
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

app.include_router(cliente_router.router)
app.include_router(pet_router.router)
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static")