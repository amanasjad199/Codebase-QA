import logging

from openai import OpenAI

from app.config import settings

logger = logging.getLogger(__name__)


async def generate(prompt: str) -> str:
    if settings.llm_provider == "ollama":
        return _generate_ollama(prompt)
    return _generate_openai(prompt)


def _generate_openai(prompt: str) -> str:
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is required for OpenAI LLM")
    client = OpenAI(api_key=settings.openai_api_key, base_url=settings.openai_base_url)
    response = client.chat.completions.create(
        model=settings.llm_model,
        temperature=0,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content or ""


def _generate_ollama(prompt: str) -> str:
    import httpx

    response = httpx.post(
        f"{settings.ollama_base_url}/api/generate",
        json={"model": settings.llm_model, "prompt": prompt, "stream": False},
        timeout=60,
    )
    response.raise_for_status()
    return response.json()["response"]
