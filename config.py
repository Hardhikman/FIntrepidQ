"""
Configuration for LangChain-based deep equity agent using Google Gemini.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Gemini model name: can be set via MODEL_NAME env var
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash-preview-05-20")
# Alternatives: "gemini-2.5-flash-lite", "gemini-2.0-flash"

# Temperature (0 = deterministic, higher = more creative)
TEMPERATURE = 0.0

# API Keys
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")

# Session/User defaults
DEFAULT_USER_ID = "default_analyst"
APP_NAME = "intrepidq_equity_deep_agent"

# Database Retention Policy
DB_RETENTION = {
    "ACTIVE_REPORTS_PER_TICKER": 3,  # Keep latest 3 reports per ticker
    "AUTO_CLEANUP_ENABLED": True      # Cleanup after each save
}

