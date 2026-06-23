from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import db
from .config import settings
from .routers import admin, ai_court, attack, auth, cases, chat, detection, overview, pentest, profile, rules

app = FastAPI(title=f"{settings.APP_NAME} BFF", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


db.AVATAR_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/api/v1/avatars",
    StaticFiles(directory=str(db.AVATAR_DIR)),
    name="avatars",
)


@app.on_event("startup")
def _startup() -> None:
    db.init_db()


app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(overview.router)
app.include_router(detection.router)  # Alert intelligence aggregates
app.include_router(ai_court.router)
app.include_router(cases.router)
app.include_router(chat.router)
app.include_router(rules.router)
app.include_router(pentest.router)
app.include_router(admin.router)
app.include_router(attack.router)


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
