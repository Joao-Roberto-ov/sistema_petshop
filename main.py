from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from bancoDeDados import criar_tabelas
from routers import cliente_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    criar_tabelas()
    yield

app = FastAPI(lifespan=lifespan)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cliente_router.router)

@app.get("/", response_class=RedirectResponse, include_in_schema=False)
async def raiz():
    return "/index.html"

app.mount("/", StaticFiles(directory="front-end", html=True), name="static")