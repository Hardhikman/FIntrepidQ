from typing import Dict, Any
from tools.validation import validate_data_completeness, format_validation_report, verify_data_accuracy
from tools.alpha_vantage_client import get_alpha_vantage_data_tool

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
    
    if not financial_data:
        return {
            "ticker": ticker,
            "validation_report": "⚠️ No financial data found to validate.",
            "completeness_score": 0,
            "confidence_level": "Low",
            "conflicts": []
        }
        
    # 1. Standard Completeness Check
    validation_result = validate_data_completeness(financial_data)
    completeness_report = format_validation_report(validation_result, ticker)
    
    # 2. Alpha Vantage Verification
    print(f" [Validation] Verifying data with Alpha Vantage...")
    av_result = get_alpha_vantage_data_tool.func(ticker)
    
    verification_report = ""
    conflicts = []
    
    if av_result["status"] == "success":
        av_data = av_result["data"]
        verification_result = verify_data_accuracy(financial_data, av_data)
        conflicts = verification_result["conflicts"]
        verification_report = verification_result["verification_report"]
    else:
        verification_report = "\n### ⚠️ Verification Skipped\nCould not fetch data from Alpha Vantage for verification."
        if "error" in av_result:
             verification_report += f"\nError: {av_result['error']}"

    # Combine reports
    final_report = completeness_report + "\n\n" + verification_report
    
    return {
        "ticker": ticker,
        "validation_report": final_report,
        "completeness_score": validation_result["completeness_score"],
        "confidence_level": validation_result["confidence_level"],
        "conflicts": conflicts,
        "av_data": av_result.get("data") # Pass AV data along just in case
    }
