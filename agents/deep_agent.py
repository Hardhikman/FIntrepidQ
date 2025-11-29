from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

import config
from tools import ALL_TOOLS
from context_engineering import deep_prompt


# =============================================================================
# LLM CONFIG (Gemini)
# =============================================================================

llm = ChatGoogleGenerativeAI(
    model=config.MODEL_NAME,
    temperature=config.TEMPERATURE,
    # Uses GOOGLE_API_KEY from environment by default
)


def build_deep_agent():
    """
    Create a single deep agent that can plan, call tools,
    and use skills to produce a full equity report.
    """
    # In LangGraph, create_react_agent takes model and tools
    # The prompt is handled by binding it to the model or passing messages
    # For now, we'll create the agent and handle the prompt in main.py
    agent = create_react_agent(
        model=llm,
        tools=ALL_TOOLS,
    )
    
    return agent
