"""Abstract AI provider interface — all providers must implement this."""

from abc import ABC, abstractmethod
from typing import Optional


class AIProvider(ABC):
    """Abstract base class for AI text generation providers."""

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """Generate text from a prompt. Returns the generated string."""
        ...

    @abstractmethod
    def get_provider_name(self) -> str:
        """Return the provider name (e.g. 'gemini', 'openai')."""
        ...
