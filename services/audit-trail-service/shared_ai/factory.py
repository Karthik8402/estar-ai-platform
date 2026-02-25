"""AI Provider factory — switch providers via AI_PROVIDER env var."""

from shared_ai.provider_interface import AIProvider
from config.settings import get_settings


def get_ai_provider() -> AIProvider:
    """Returns the configured AI provider instance.

    Set AI_PROVIDER env var: 'gemini' (default/free), 'openai', etc.
    """
    settings = get_settings()
    provider = settings.AI_PROVIDER.lower()

    if provider == "gemini":
        from shared_ai.gemini_provider import GeminiProvider
        return GeminiProvider()
    elif provider == "openai":
        # Future: from shared_ai.openai_provider import OpenAIProvider
        raise NotImplementedError("OpenAI provider not yet implemented")
    else:
        raise ValueError(f"Unknown AI_PROVIDER: {provider}")
