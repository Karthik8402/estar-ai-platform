"""Google Gemini AI provider — FREE for development."""

import google.generativeai as genai
from typing import Optional

from google.generativeai.types import HarmCategory, HarmBlockThreshold
from shared_ai.provider_interface import AIProvider
from config.settings import get_settings


class GeminiProvider(AIProvider):
    """Uses google-generativeai SDK with gemini-2.5-flash (free tier)."""

    def __init__(self):
        settings = get_settings()
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required for Gemini provider")
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Disable safety settings that flag security/audit terms as dangerous
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
        
        self._model = genai.GenerativeModel(
            "gemini-2.5-flash", 
            safety_settings=safety_settings
        )

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 8192,
    ) -> str:
        full_prompt = prompt
        if system_instruction:
            full_prompt = f"{system_instruction}\n\n{prompt}"

        response = await self._model.generate_content_async(
            full_prompt,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        return response.text

    def get_provider_name(self) -> str:
        return "gemini"
