"""
Chat Agent for querying and analyzing equity reports from the database.
Supports hybrid information retrieval (Database + Web).
"""

from langgraph.prebuilt import create_react_agent

from tools.chat_tools import CHAT_TOOLS
from tools.definitions import search_web_tool, search_google_news_tool
from context_engineering.prompts import chat_agent_prompt
from utils.config import get_llm_with_fallback

def build_chat_agent(use_fallback: bool = False):
    """Builds the Chat Agent using LangGraph."""
    llm = get_llm_with_fallback(temperature=0.3, use_fallback=use_fallback)
    # Combine database tools with web search tools
    tools = CHAT_TOOLS + [search_web_tool, search_google_news_tool]
    agent = create_react_agent(llm, tools)
    return agent
