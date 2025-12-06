from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

from tools.definitions import (
    get_deep_financials_tool,
    check_strategic_triggers_tool,
    search_web_tool,
    search_google_news_tool
)
from context_engineering.prompts import data_agent_prompt
import config
import numpy as np

def _convert_numpy_types(obj):
    """Recursively convert numpy types to native Python types for serialization."""
    if isinstance(obj, dict):
        return {k: _convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_convert_numpy_types(item) for item in obj]
    elif isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating,)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return _convert_numpy_types(obj.tolist())
    elif isinstance(obj, np.bool_):
        return bool(obj)
    else:
        return obj

def build_data_agent():
    """
    Builds the Data Collection Agent using LangGraph.
    """
    llm = ChatGoogleGenerativeAI(model=config.MODEL_NAME, temperature=0)
    
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
    agent = build_data_agent()
    
    print(f"--- Starting Data Collection for {ticker} ---")
    
    # Extract system message from the prompt template
    # data_agent_prompt[0] is SystemMessagePromptTemplate
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
    
    # Extract financial data from tool messages in history
    financial_data = {}
    for msg in result["messages"]:
        if hasattr(msg, "tool_calls") and len(msg.tool_calls) > 0:
            pass # This is the AI calling the tool
        if hasattr(msg, "name") and msg.name == "get_deep_financials":
             # This is a ToolMessage, but LangGraph might structure it differently depending on version.
             # Usually ToolMessage has 'content' which is the tool output string/json.
             pass
             
    # Better approach for extracting tool outputs in LangGraph:
    # Iterate through messages, find ToolMessage corresponding to get_deep_financials
    from langchain_core.messages import ToolMessage
    
    for msg in result["messages"]:
        if isinstance(msg, ToolMessage) and msg.name == "get_deep_financials":
            # The content is usually a string representation of the dict
            # We might need to parse it or rely on the fact that we just want to pass it to validation
            # But validation expects a dict.
            # Let's try to eval it if it's a string, or check if it's already a dict (unlikely for ToolMessage content)
            import json
            import ast
            import re
            
            # Debug: print content to see what we are dealing with
            # print(f"DEBUG: Tool output for {msg.name}")
            # print(f"DEBUG: Content type: {type(msg.content)}")
            # print(f"DEBUG: Content preview: {str(msg.content)[:200]}...")
            
            data = None
            try:
                if isinstance(msg.content, dict):
                    # Already a dict
                    data = msg.content
                    # print(f"DEBUG: Content is already a dict")
                elif isinstance(msg.content, str):
                    # String - try parsing
                    # print(f"DEBUG: Content is a string, attempting to parse...")
                    content_str = msg.content
                    
                    # Try JSON first
                    try:
                        data = json.loads(content_str)
                        # print(f"DEBUG: JSON parsing succeeded")
                    except json.JSONDecodeError as e_json:
                        # print(f"DEBUG: JSON parsing failed: {e_json}")
                        
                        # Try to fix common issues for ast.literal_eval
                        # Replace numpy references with None
                        fixed_str = re.sub(r'\bnp\.nan\b', 'None', content_str)
                        fixed_str = re.sub(r'\bnp\.inf\b', 'None', fixed_str)
                        fixed_str = re.sub(r'\binf\b', 'None', fixed_str)
                        fixed_str = re.sub(r'\bnan\b', 'None', fixed_str)
                        
                        try:
                            data = ast.literal_eval(fixed_str)
                            # print(f"DEBUG: ast.literal_eval succeeded (after fixing)")
                        except Exception as e_ast:
                            # print(f"DEBUG: ast.literal_eval failed: {e_ast}")
                            # Last resort: try eval with numpy context
                            try:
                                # Only use eval if the string looks safe (starts with {)
                                if content_str.strip().startswith('{'):
                                    # Import numpy for eval context
                                    import numpy as np
                                    # Provide safe eval context with numpy
                                    eval_context = {'np': np, 'nan': float('nan'), 'inf': float('inf')}
                                    data = eval(content_str, {"__builtins__": {}}, eval_context)
                                    # print(f"DEBUG: eval succeeded with numpy context")
                            except Exception as e_eval:
                                print(f"Warning: Failed to parse tool output: {e_eval}")
                
                if data and isinstance(data, dict) and data.get("status") == "success":
                    financial_data = data.get("data", {})
                    # print(f"DEBUG: Successfully extracted financial data for {ticker}")
                    # print(f"DEBUG: Financial data keys: {list(financial_data.keys())[:10]}")
                    break
            except Exception as e:
                print(f"Error parsing financial data: {e}")

    # Convert numpy types to native Python types for LangGraph serialization
    financial_data = _convert_numpy_types(financial_data)
    
    return {
        "ticker": ticker,
        "raw_output": output_content,
        "financial_data": financial_data
    }
