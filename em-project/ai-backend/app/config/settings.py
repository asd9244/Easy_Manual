"""환경 변수 기반 설정 (pydantic-settings). 기본값은 기존 ``os.getenv`` 사용처와 동일."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    neo4j_uri: str | None = None
    neo4j_user: str | None = None
    neo4j_password: str | None = None

    postgres_checkpoint_url: str = Field(
        default="",
        description="LangGraph PostgresSaver 연결 문자열",
    )

    ollama_base_url: str = Field(default="http://127.0.0.1:11434")
    answer_model: str = Field(default="gemma4:e4b")
    router_model: str | None = None
    embed_model: str = Field(default="bge-m3")

    def router_model_resolved(self) -> str:
        return self.router_model if self.router_model else self.answer_model


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
