from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent
from tools.definitions import load_skill_tool
from context_engineering.prompts import analysis_agent_prompt
import config

def build_analysis_agent():
    """
    Builds the Analysis Agent using LangGraph.
    """
    llm = ChatGoogleGenerativeAI(model=config.MODEL_NAME, temperature=0.1)
    
    # The analysis agent might need to load specific skills/frameworks
    tools = [load_skill_tool]
    
    agent = create_react_agent(llm, tools)
    return agent

async def run_analysis(ticker: str, collected_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run the analysis process.
    """
    agent = build_analysis_agent()
    
    print(f"--- Starting Analysis for {ticker} ---")
    
    # Convert collected data to string if it's a dict/object
    data_str = str(collected_data.get("raw_output", collected_data))
    
    # Extract system message
    system_message = analysis_agent_prompt.messages[0].prompt.template
    user_message_template = analysis_agent_prompt.messages[1].prompt.template
    
    user_input = user_message_template.format(ticker=ticker, data=data_str)
    
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_input}
    ]
    
    result = await agent.ainvoke({"messages": messages})
    
    last_message = result["messages"][-1]
    output_content = last_message.content
    
    return {
        "ticker": ticker,
        "analysis_output": output_content
    }
