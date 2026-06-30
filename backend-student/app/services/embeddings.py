import httpx
from openai import OpenAI

from app.core.config import get_settings


_client: OpenAI | None = None


def get_openai_client() -> OpenAI:
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured.")
        http_client = httpx.Client(timeout=30.0, trust_env=False)
        _client = OpenAI(api_key=settings.openai_api_key, http_client=http_client)
    return _client


def embed_texts(texts: list[str]) -> list[list[float]]:
    settings = get_settings()
    client = get_openai_client()
    response = client.embeddings.create(
        model=settings.openai_embed_model,
        input=texts,
    )
    return [item.embedding for item in response.data]
