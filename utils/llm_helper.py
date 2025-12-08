"""
LLM Configuration - Gemini Only
Simple LLM helper that returns the configured Gemini model.
"""

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI

from utils import config


def get_llm_with_fallback(temperature: float = 0.0, use_fallback: bool = False) -> BaseChatModel:
    """
    Get the configured LLM (Gemini).
    
    Args:
        temperature: Model temperature
        use_fallback: Ignored (kept for backward compatibility)
    
    Returns:
        Gemini LLM instance
    """
    return ChatGoogleGenerativeAI(
        model=config.MODEL_NAME,
        temperature=temperature
    )


def get_primary_llm(temperature: float = 0.0) -> BaseChatModel:
    """Get the primary LLM (Gemini)."""
    return ChatGoogleGenerativeAI(
        model=config.MODEL_NAME,
        temperature=temperature
    )


def print_llm_status():
    """Print current LLM configuration status."""
    print(f" [LLM] Model: {config.MODEL_NAME}")
