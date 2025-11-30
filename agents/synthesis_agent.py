from typing import Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser
from context_engineering.prompts import synthesis_agent_prompt
import config

def build_synthesis_agent():
    """
    Builds the Synthesis Agent.
    This agent compiles the final report.
    """
    llm = ChatGoogleGenerativeAI(model=config.MODEL_NAME, temperature=0)
    
    prompt = synthesis_agent_prompt
    
    chain = prompt | llm | StrOutputParser()
    
    return chain

async def run_synthesis(ticker: str, analysis_result: Dict[str, Any], validation_result: Dict[str, Any], data_result: Dict[str, Any]) -> str:
    """
    Run the synthesis process.
    """
    chain = build_synthesis_agent()
    
    print(f"--- Starting Synthesis for {ticker} ---")
    
    # Extract relevant parts
    analysis_output = analysis_result.get("analysis_output", "No analysis provided.")
    validation_report = validation_result.get("validation_report", "No validation report.")
    data_summary = data_result.get("raw_output", "No data summary.")
    
    final_report = await chain.ainvoke({
        "ticker": ticker,
        "analysis_output": analysis_output,
        "validation_report": validation_report,
        "data_summary": data_summary
    })
    
    return final_report
