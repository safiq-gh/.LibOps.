from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    app_name: str
    app_version: str
    database_url: str
    debug: bool
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    backend_url: str = "http://localhost:8000"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:80",
    ]

    # S3 Settings
    s3_bucket: str = "libops-book-covers"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
