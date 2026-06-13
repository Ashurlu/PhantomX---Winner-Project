from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "SENTRIX"
    DATA_SOURCE: str = "mock"  # "mock" | "live"

    JWT_SECRET: str = "change-me-in-production-super-secret-key"
    JWT_ALG: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480

    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Live upstreams (kept server-side only; never sent to the frontend)
    N8N_BASE_URL: str = ""
    N8N_API_KEY: str = ""
    PENTEST_BASE_URL: str = ""
    PENTEST_API_KEY: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
