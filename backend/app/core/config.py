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
