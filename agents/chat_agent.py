"""
Chat Agent for querying and analyzing equity reports from the database.
Supports hybrid information retrieval (Database + Web).
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

import config
from tools.chat_tools import CHAT_TOOLS
from tools.definitions import search_web_tool, search_google_news_tool
from context_engineering.prompts import chat_agent_prompt

def build_chat_agent():
    """Builds the Chat Agent using LangGraph."""
    llm = ChatGoogleGenerativeAI(model=config.MODEL_NAME, temperature=0.3)
    # Combine database tools with web search tools
    tools = CHAT_TOOLS + [search_web_tool, search_google_news_tool]
    agent = create_react_agent(llm, tools)
    return agent
