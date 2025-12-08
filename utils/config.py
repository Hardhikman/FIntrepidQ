"""
Configuration for IntrepidQ Equity Analysis System.
Centralized configuration for LLM, API keys, and system settings.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# LLM Configuration
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash")

# Temperature (0 = deterministic, higher = more creative)
TEMPERATURE = 0.0

# API Keys
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Alpha Vantage (data enrichment)
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")

# Application Settings
DEFAULT_USER_ID = os.getenv("DEFAULT_USER_ID", "default_analyst")
APP_NAME = os.getenv("APP_NAME", "intrepidq_equity_deep_agent")

# Database Retention Policy
DB_RETENTION = {
    "ACTIVE_REPORTS_PER_TICKER": 3,  # Keep latest 3 reports per ticker
    "AUTO_CLEANUP_ENABLED": True      # Cleanup after each save
}

# Logging
VERBOSE = os.getenv("VERBOSE", "false").lower() == "true"