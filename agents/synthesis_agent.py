from typing import Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from context_engineering.prompts import synthesis_agent_prompt
from utils.config import get_llm_with_fallback
from datetime import datetime

def build_synthesis_agent(use_fallback: bool = False):
    """
    Builds the Synthesis Agent.
    This agent compiles the final report.
    """
    llm = get_llm_with_fallback(temperature=0, use_fallback=use_fallback)
    
    prompt = synthesis_agent_prompt
    
    chain = prompt | llm | StrOutputParser()
    
    return chain

async def run_synthesis(ticker: str, analysis_result: Dict[str, Any], validation_result: Dict[str, Any], data_result: Dict[str, Any]) -> str:
    """
    Run the synthesis process.
    """
    from utils.cli_logger import logger
    
    chain = build_synthesis_agent()
    
    logger.log_step(f"Synthesizing final report for {ticker}...", emoji="✍️")
    
    # Extract relevant parts
    analysis_output = analysis_result.get("analysis_output", "No analysis provided.")
    validation_report = validation_result.get("validation_report", "No validation report.")
    
    # Enrich data summary with structured news data if available
    raw_output = data_result.get("raw_output", "")
    news_data = data_result.get("news_data", {})
    
    import json
    data_parts = [f"RAW TOOL OUTPUTS:\n{raw_output}"]
    if news_data:
        try:
            news_str = json.dumps(news_data, indent=2)
            data_parts.append(f"STRUCTURED NEWS DATA:\n{news_str}")
        except (TypeError, ValueError):
            data_parts.append(f"STRUCTURED NEWS DATA: {str(news_data)}")
            
    data_summary = "\n\n".join(data_parts)
    
    # Get current date for the report
    current_date = datetime.now().strftime("%B %d, %Y")

    # Extract company name from financial data, fallback to ticker
    financial_data = data_result.get("financial_data", {})
    # Handle case where financial_data might be None
    if not financial_data:
        financial_data = {}
    company_name = financial_data.get("company_name") or ticker
    
    final_report = await chain.ainvoke({
        "ticker": ticker,
        "company_name": company_name,
        "current_date": current_date,
        "analysis_output": analysis_output,
        "validation_report": validation_report,
        "data_summary": data_summary
    })
    
    return final_report
