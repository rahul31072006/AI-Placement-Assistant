from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from database import create_tables

from routes.chat import router as chat_router
from routes.history import router as history_router
from routes.news import router as news_router

create_tables()

app = FastAPI(
    title="AI Placement Assistant"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(history_router)
app.include_router(news_router)

app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)


@app.get("/")
async def home():
    return FileResponse("templates/index.html")


@app.get("/health")
async def health_check():
    return {
        "status": "running",
        "message": "AI Placement Assistant is healthy and serving requests."
    }