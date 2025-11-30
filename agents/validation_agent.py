from typing import Dict, Any
from tools.validation import validate_data_completeness, format_validation_report

def build_validation_agent():
    """
    The Validation Agent is simpler: it's a deterministic function 
    that checks the data quality using the existing validation logic.
    """
    pass

async def run_validation(ticker: str, data_agent_output: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run the validation process.
    """
    print(f"--- Starting Validation for {ticker} ---")
    
    financial_data = data_agent_output.get("financial_data", {})
    
    # print(f"DEBUG VALIDATION: financial_data type: {type(financial_data)}")
    # print(f"DEBUG VALIDATION: financial_data empty: {not financial_data}")
    # if financial_data:
    #     print(f"DEBUG VALIDATION: financial_data keys: {list(financial_data.keys())[:10]}")
    
    if not financial_data:
        # print(f"DEBUG VALIDATION: No financial data found!")
        return {
            "ticker": ticker,
            "validation_report": "⚠️ No financial data found to validate.",
            "completeness_score": 0,
            "confidence_level": "Low"
        }
        
    validation_result = validate_data_completeness(financial_data)
    validation_report = format_validation_report(validation_result, ticker)
    
    return {
        "ticker": ticker,
        "validation_report": validation_report,
        "completeness_score": validation_result["completeness_score"],
        "confidence_level": validation_result["confidence_level"]
    }
