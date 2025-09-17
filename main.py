from fastapi import FastAPI
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

app.include_router(cliente_router.router)

@app.get("/", response_class=RedirectResponse, include_in_schema=False)
async def raiz():
    return "/login.html"

app.mount("/", StaticFiles(directory="front-end", html=True), name="static")