from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .config import settings
from .routers import admin, ai_court, attack, auth, overview, pentest, rules

app = FastAPI(title=f"{settings.APP_NAME} BFF", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    db.init_db()


app.include_router(auth.router)
app.include_router(overview.router)
app.include_router(ai_court.router)
app.include_router(rules.router)
app.include_router(pentest.router)
app.include_router(admin.router)
app.include_router(attack.router)


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
