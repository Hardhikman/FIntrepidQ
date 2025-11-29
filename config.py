"""
Configuration for LangChain-based deep equity agent using Google Gemini.
"""

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Gemini model name: adjust if needed
MODEL_NAME = "gemini-2.5-flash"
# Alternatives: "gemini-1.5-pro"

# Temperature (0 = deterministic, higher = more creative)
TEMPERATURE = 0.0

# Session/User defaults
DEFAULT_USER_ID = "default_analyst"
APP_NAME = "intrepidq_equity_deep_agent"
