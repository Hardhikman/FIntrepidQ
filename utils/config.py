"""
Configuration for FIntrepidQ Equity Analysis System.
Centralized configuration for LLM, API keys, and system settings.
"""

import os
from dotenv import load_dotenv
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI

# Load environment variables from .env file
load_dotenv()

# LLM CONFIGURATION

MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash")
TEMPERATURE = 0.0  # 0 = deterministic, higher = more creative


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
        model=MODEL_NAME,
        temperature=temperature
    )


def get_primary_llm(temperature: float = 0.0) -> BaseChatModel:
    """Get the primary LLM (Gemini)."""
    return ChatGoogleGenerativeAI(
        model=MODEL_NAME,
        temperature=temperature
    )


GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")

# APPLICATION SETTINGS

DEFAULT_USER_ID = os.getenv("DEFAULT_USER_ID", "default_analyst")
APP_NAME = os.getenv("APP_NAME", "fintrepidq_equity_deep_agent")

# Database Retention Policy
DB_RETENTION = {
    "ACTIVE_REPORTS_PER_TICKER": 3,  # Keep latest 3 reports per ticker
    "AUTO_CLEANUP_ENABLED": True      # Cleanup after each save
}

# WhatsApp Configuration
WHATSAPP_DEFAULT_TO_NUMBER = os.getenv("WHATSAPP_DEFAULT_TO_NUMBER")

# Logging
VERBOSE = os.getenv("VERBOSE", "false").lower() == "true"