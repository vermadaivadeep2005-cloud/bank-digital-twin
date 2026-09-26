import os
from pydantic_settings import BaseSettings
from typing import List


from pydantic import ConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Bank Digital Twin API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./bank_twin.db")

    # AI & Groq Configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    model_config = ConfigDict(env_file=".env", extra="ignore")


settings = Settings()
