from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.routes import health, auth, memories, agents, training, chat, slang, survey, feedback

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🧠 {settings.APP_NAME} API starting")
    yield
    print("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(memories.router, prefix="/api/memories", tags=["memories"])
app.include_router(training.router, prefix="/api/training", tags=["training"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(survey.router, prefix="/api/survey", tags=["survey"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])
app.include_router(slang.router, prefix="/api/slang", tags=["slang"])