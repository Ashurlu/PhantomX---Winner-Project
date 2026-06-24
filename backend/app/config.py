from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE) if _ENV_FILE.exists() else ".env",
        extra="ignore",
    )

    APP_NAME: str = "SENTRIX"
    DATA_SOURCE: str = "mock"  # "mock" | "live"

    JWT_SECRET: str = "change-me-in-production-super-secret-key"
    JWT_ALG: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480

    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,https://frontend-seven-chi-25.vercel.app,https://frontend-6qpzqgxah-phantom-x-s-projects.vercel.app"

    # Live upstreams (kept server-side only; never sent to the frontend)
    N8N_BASE_URL: str = ""
    N8N_API_KEY: str = ""
    PENTEST_BASE_URL: str = ""
    PENTEST_API_KEY: str = ""

    # Web Pentest Agent — embedded (default) or proxy to standalone service
    WEB_PENTEST_URL: str = ""  # e.g. http://127.0.0.1:18000 when running agent separately
    AI_PROVIDER: str = "local_mock"  # local_mock | groq | openrouter | openai | anthropic | gemini
    AI_MODEL: str = ""
    GROQ_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    ALLOW_PRIVATE_IPS: str = "false"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
