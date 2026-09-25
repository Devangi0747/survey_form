from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "JobApply AI API"
    database_url: str = "sqlite:///./jobapply.db"
    jwt_secret: str = "change-this-in-development"
    upload_dir: str = "./data/resumes"
    frontend_origin: str = "http://localhost:3000"
    llm_api_key: str | None = None
    llm_base_url: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
