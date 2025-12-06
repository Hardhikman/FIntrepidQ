from typing import Dict, Any
from tools.validation import validate_data_completeness, format_validation_report, verify_data_accuracy, fill_missing_from_alpha_vantage
from tools.alpha_vantage_client import get_alpha_vantage_data_tool

def build_validation_agent():
    """
    The Validation Agent is simpler: it's a deterministic function 
    that checks the data quality using the existing validation logic.
    """
    pass

async def run_validation(ticker: str, data_agent_output: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run the validation process:
    1. Fetch Alpha Vantage data
    2. Fill missing Yahoo data with Alpha Vantage data
    3. Validate completeness of the enriched data
    4. Verify accuracy between sources
    """
    print(f"--- Starting Validation for {ticker} ---")
    
    financial_data = data_agent_output.get("financial_data", {})
    
    if not financial_data:
        return {
            "ticker": ticker,
            "validation_report": "⚠️ No financial data found to validate.",
            "completeness_score": 0,
            "confidence_level": "Low",
            "conflicts": [],
            "enriched_data": {}
        }
    
    # 1. Fetch Alpha Vantage data first
    print(f" [Validation] Verifying data with Alpha Vantage...")
    av_result = get_alpha_vantage_data_tool.func(ticker)
    
    enrichment_report = ""
    enriched_data = financial_data.copy()
    filled_metrics = []
    
    if av_result["status"] == "success":
        av_data = av_result["data"]
        
        # 2. Fill missing Yahoo data with Alpha Vantage data
        print(f" [Validation] Filling missing data from Alpha Vantage...")
        fill_result = fill_missing_from_alpha_vantage(financial_data, av_data)
        enriched_data = fill_result["filled_data"]
        filled_metrics = fill_result["filled_metrics"]
        enrichment_report = fill_result["fill_report"]
        
        if filled_metrics:
            print(f" [Validation] Filled {len(filled_metrics)} missing metric(s): {', '.join(filled_metrics[:5])}")
    else:
        enrichment_report = "\n### ⚠️ Data Enrichment Skipped\nCould not fetch data from Alpha Vantage."
        if "error" in av_result:
            enrichment_report += f"\nError: {av_result['error']}"
    
    # 3. Validate completeness of the ENRICHED data
    validation_result = validate_data_completeness(enriched_data)
    completeness_report = format_validation_report(validation_result, ticker)
    
    # 4. Verify accuracy between sources (using original Yahoo data for comparison)
    verification_report = ""
    conflicts = []
    
    if av_result["status"] == "success":
        av_data = av_result["data"]
        verification_result = verify_data_accuracy(financial_data, av_data)
        conflicts = verification_result["conflicts"]
        verification_report = verification_result["verification_report"]
    else:
        verification_report = "\n### ⚠️ Verification Skipped\nCould not fetch data from Alpha Vantage for verification."
    
    # Combine all reports
    final_report = completeness_report + "\n\n" + enrichment_report + "\n\n" + verification_report
    
    return {
        "ticker": ticker,
        "validation_report": final_report,
        "completeness_score": validation_result["completeness_score"],
        "confidence_level": validation_result["confidence_level"],
        "conflicts": conflicts,
        "av_data": av_result.get("data"),
        "enriched_data": enriched_data,  # Return the enriched data for downstream agents
        "filled_metrics": filled_metrics
    }
