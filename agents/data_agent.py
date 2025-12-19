from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent

from tools.definitions import (
    get_deep_financials_tool,
    check_strategic_triggers_tool,
    search_web_tool,
    search_google_news_tool,
    _sanitize_for_json  # Use centralized sanitization function
)
from context_engineering.prompts import data_agent_prompt
from utils.config import get_llm_with_fallback

def build_data_agent(use_fallback: bool = False):
    """
    Builds the Data Collection Agent using LangGraph.
    """
    llm = get_llm_with_fallback(temperature=0, use_fallback=use_fallback)
    
    tools = [
        get_deep_financials_tool,
        check_strategic_triggers_tool,
        search_web_tool,
        search_google_news_tool
    ]
    
    # create_react_agent returns a CompiledGraph
    agent = create_react_agent(llm, tools)
    return agent

async def run_data_collection(ticker: str) -> Dict[str, Any]:
    """
    Run the data collection process for a ticker.
    """
    from utils.cli_logger import logger
    
    agent = build_data_agent()
    
    # Start phase tracking with spinner
    logger.tracker.start_phase("Data Collection")
    logger.phase_detail("Data Collection", f"Collecting data for {ticker}")
    
    # Extract system message from the prompt template
    system_message = data_agent_prompt.messages[0].prompt.template
    
    user_input = f"Collect all available data for {ticker}. Get financials, strategic triggers, and recent news."
    
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_input}
    ]
        
    result = await agent.ainvoke({"messages": messages})
    
    # Result from LangGraph agent is usually a dict with 'messages'
    # The last message is the AI response
    last_message = result["messages"][-1]
    output_content = last_message.content
    
    # Extract financial AND news data from tool messages in history AND log tool usage
    financial_data = {}
    news_data = {
        "strategic_signals": [],
        "google_news": [],
        "web_search": []
    }
    from langchain_core.messages import ToolMessage, AIMessage

    # Log tool usage from history
    for msg in result["messages"]:
        if isinstance(msg, AIMessage) and msg.tool_calls:
             for tool_call in msg.tool_calls:
                 logger.log_tool_used(tool_call['name'], tool_call['args'])
    
    import json
    import ast
    import re

    for msg in result["messages"]:
        if not isinstance(msg, ToolMessage):
            continue

        # Helper to parse message content
        def parse_content(content):
            if isinstance(content, (dict, list)):
                return content
            if not isinstance(content, str):
                return None
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                fixed_str = re.sub(r'\bnp\.nan\b', 'None', content)
                fixed_str = re.sub(r'\bnp\.inf\b', 'None', fixed_str)
                fixed_str = re.sub(r'\bfloat\([\'"]inf[\'"]\)', 'None', fixed_str)
                fixed_str = re.sub(r'\bfloat\([\'"]nan[\'"]\)', 'None', fixed_str)
                fixed_str = re.sub(r'(?<![a-zA-Z_])\binf\b(?![a-zA-Z_])', 'None', fixed_str)
                fixed_str = re.sub(r'(?<![a-zA-Z_])\bnan\b(?![a-zA-Z_])', 'None', fixed_str)
                fixed_str = re.sub(r'(?<![a-zA-Z_])\bNaN\b(?![a-zA-Z_])', 'None', fixed_str)
                try:
                    return ast.literal_eval(fixed_str)
                except (ValueError, SyntaxError):
                    return None

        if msg.name == "get_deep_financials":
            data = parse_content(msg.content)
            if data and isinstance(data, dict) and data.get("status") == "success":
                financial_data = data.get("data", {})
                logger.log_success(f"Successfully extracted financial data for {ticker}")
        
        elif msg.name == "check_strategic_triggers":
            data = parse_content(msg.content)
            if data and isinstance(data, dict) and data.get("status") == "success":
                signals = data.get("data", {}).get("signals", [])
                news_data["strategic_signals"].extend(signals)
                logger.log_success(f"Successfully extracted {len(signals)} strategic signals for {ticker}")

        elif msg.name == "search_google_news":
            data = parse_content(msg.content)
            if isinstance(data, list):
                news_data["google_news"].extend(data)
                logger.log_success(f"Successfully extracted {len(data)} Google News items for {ticker}")

        elif msg.name == "search_web":
            data = parse_content(msg.content)
            if isinstance(data, list):
                news_data["web_search"].extend(data)
                logger.log_success(f"Successfully extracted {len(data)} web search items for {ticker}")

    # Sanitize data for JSON serialization (handles numpy types, NaN, etc.)
    financial_data = _sanitize_for_json(financial_data)
    news_data = _sanitize_for_json(news_data)
    
    if not financial_data:
        logger.log_warning("No financial_data extracted from tool outputs!")
    else:
        # Log financial data to CLI with Rich table
        logger.log_financial_data(financial_data)
    
    return {
        "ticker": ticker,
        "raw_output": output_content,
        "financial_data": financial_data,
        "news_data": news_data
    }
