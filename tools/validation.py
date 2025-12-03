"""
Data Validation Tool for Stock Analysis

Validates the completeness and quality of financial data
to provide confidence scores and flag missing critical metrics.
"""

from typing import Dict, Any, List


# Define critical metrics (required for reliable analysis)
CRITICAL_METRICS = [
    "current_price",
    "market_cap",
    "revenue_growth",
    "profit_margins",
    "trailing_pe",
    "debt_to_equity",
    "free_cash_flow",
    "return_on_equity",
]

# Define optional metrics (nice to have, but not essential)
OPTIONAL_METRICS = [
    "forward_pe",
    "peg_ratio",
    "dividend_yield",
    "payout_ratio",
    "return_on_assets",
    "operating_cashflow",
]

# Define advanced metrics
ADVANCED_METRICS = [
    "technicals",
    "risk_metrics",
    "financial_trends",
    "volume_trends",
    "dividend_trends",
]


def _check_metric_availability(data: Dict[str, Any], metric_name: str) -> bool:
    """Check if a metric is available and not None/empty."""
    value = data.get(metric_name)
    
    # Handle nested dictionaries (technicals, risk_metrics, etc.)
    if isinstance(value, dict):
        return len(value) > 0 and any(v is not None for v in value.values())
    
    # Handle lists
    if isinstance(value, list):
        return len(value) > 0
    
    # Handle regular values
    return value is not None


def validate_data_completeness(financial_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate the completeness of financial data.
    
    Args:
        financial_data: Dictionary returned by get_deep_financials
        
    Returns:
        Dictionary containing:
        - completeness_score: 0-100 (percentage of available metrics)
        - confidence_level: "High" / "Medium" / "Low"
        - missing_critical: List of missing critical metrics
        - missing_optional: List of missing optional metrics
        - available_critical: Count of available critical metrics
        - available_optional: Count of available optional metrics
        - warnings: List of warning messages
    """
    
    # Check critical metrics
    missing_critical = []
    available_critical = 0
    
    for metric in CRITICAL_METRICS:
        if _check_metric_availability(financial_data, metric):
            available_critical += 1
        else:
            missing_critical.append(metric)
    
    # Check optional metrics
    missing_optional = []
    available_optional = 0
    
    for metric in OPTIONAL_METRICS:
        if _check_metric_availability(financial_data, metric):
            available_optional += 1
        else:
            missing_optional.append(metric)
    
    # Check advanced metrics
    available_advanced = 0
    missing_advanced = []
    
    for metric in ADVANCED_METRICS:
        if _check_metric_availability(financial_data, metric):
            available_advanced += 1
        else:
            missing_advanced.append(metric)
    
    # Calculate completeness score
    total_metrics = len(CRITICAL_METRICS) + len(OPTIONAL_METRICS) + len(ADVANCED_METRICS)
    available_metrics = available_critical + available_optional + available_advanced
    completeness_score = int((available_metrics / total_metrics) * 100)
    
    # Determine confidence level
    critical_percentage = (available_critical / len(CRITICAL_METRICS)) * 100
    
    if critical_percentage >= 90 and completeness_score >= 80:
        confidence_level = "High"
    elif critical_percentage >= 70 and completeness_score >= 60:
        confidence_level = "Medium"
    else:
        confidence_level = "Low"
    
    # Generate warnings
    warnings = []
    
    if len(missing_critical) > 0:
        warnings.append(f"⚠️ Missing {len(missing_critical)} critical metric(s): {', '.join(missing_critical[:3])}")
    
    if critical_percentage < 70:
        warnings.append(f"⚠️ Only {int(critical_percentage)}% of critical metrics available - analysis may be unreliable")
    
    if "technicals" in missing_advanced:
        warnings.append("⚠️ Technical analysis not available (no historical price data)")
    
    if "financial_trends" in missing_advanced:
        warnings.append("⚠️ Trend analysis not available (no quarterly data)")
    
    return {
        "completeness_score": completeness_score,
        "confidence_level": confidence_level,
        "critical_percentage": int(critical_percentage),
        "missing_critical": missing_critical,
        "missing_optional": missing_optional,
        "missing_advanced": missing_advanced,
        "available_critical": available_critical,
        "available_optional": available_optional,
        "available_advanced": available_advanced,
        "total_metrics": total_metrics,
        "available_metrics": available_metrics,
        "warnings": warnings,
    }


def format_validation_report(validation_result: Dict[str, Any], ticker: str) -> str:
    """
    Format validation results into a readable report.
    
    Args:
        validation_result: Output from validate_data_completeness
        ticker: Stock ticker symbol
        
    Returns:
        Formatted markdown report
    """
    report = f"## 📊 Data Quality Report for {ticker}\n\n"
    
    # Completeness score
    score = validation_result["completeness_score"]
    confidence = validation_result["confidence_level"]
    
    report += f"**Completeness Score:** {score}% | **Confidence Level:** {confidence}\n\n"
    
    # Metrics breakdown
    report += f"- Critical Metrics: {validation_result['available_critical']}/{len(CRITICAL_METRICS)} available\n"
    report += f"- Optional Metrics: {validation_result['available_optional']}/{len(OPTIONAL_METRICS)} available\n"
    report += f"- Advanced Metrics: {validation_result['available_advanced']}/{len(ADVANCED_METRICS)} available\n\n"
    
    # Warnings
    if validation_result["warnings"]:
        report += "### Warnings\n\n"
        for warning in validation_result["warnings"]:
            report += f"{warning}\n\n"
    
    # Missing critical metrics
    if validation_result["missing_critical"]:
        report += "### Missing Critical Metrics\n\n"
        for metric in validation_result["missing_critical"]:
            report += f"- `{metric}`\n"
        report += "\n"
    
    return report


def verify_data_accuracy(primary_data: Dict[str, Any], reference_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compare primary data (Yahoo) with reference data (Alpha Vantage).
    
    Returns:
        Dict containing:
        - conflicts: List of Dicts with 'metric', 'primary_value', 'reference_value', 'diff_percent'
        - verification_report: Text summary of the comparison
    """
    conflicts = []
    report_lines = ["### 🛡️ Data Verification (Yahoo vs Alpha Vantage)"]
    
    # Helper to clean and parse float
    def parse_val(val):
        if val is None: return None
        try:
            return float(val)
        except:
            return None

    # 1. Compare Current Price
    y_price = parse_val(primary_data.get("current_price"))
    
    # AV data structure: data -> quote -> 05. price
    av_quote = reference_data.get("quote", {})
    av_price = parse_val(av_quote.get("05. price"))
    
    if y_price and av_price:
        diff = abs(y_price - av_price) / ((y_price + av_price) / 2) * 100
        if diff > 1.0: # > 1% difference
            conflicts.append({
                "metric": "current_price",
                "primary_value": y_price,
                "reference_value": av_price,
                "diff_percent": diff
            })
            report_lines.append(f"❌ **Price Mismatch**: Yahoo=${y_price}, AV=${av_price} (Diff: {diff:.2f}%)")
        else:
            report_lines.append(f"✅ Price Verified: ${y_price} vs ${av_price}")
            
    # 2. Compare Market Cap
    y_cap = parse_val(primary_data.get("market_cap"))
    av_overview = reference_data.get("overview", {})
    av_cap = parse_val(av_overview.get("MarketCapitalization"))
    
    if y_cap and av_cap:
        diff = abs(y_cap - av_cap) / ((y_cap + av_cap) / 2) * 100
        if diff > 5.0: # > 5% difference (Market cap can vary more due to share counts)
            conflicts.append({
                "metric": "market_cap",
                "primary_value": y_cap,
                "reference_value": av_cap,
                "diff_percent": diff
            })
            report_lines.append(f"❌ **Market Cap Mismatch**: Yahoo={y_cap:,.0f}, AV={av_cap:,.0f} (Diff: {diff:.2f}%)")
        else:
            report_lines.append(f"✅ Market Cap Verified")

    # 3. Compare P/E Ratio
    y_pe = parse_val(primary_data.get("trailing_pe"))
    av_pe = parse_val(av_overview.get("PERatio"))
    
    if y_pe and av_pe:
        diff = abs(y_pe - av_pe) / ((y_pe + av_pe) / 2) * 100
        if diff > 10.0: # > 10% difference (P/E often varies due to earnings calculation)
            conflicts.append({
                "metric": "trailing_pe",
                "primary_value": y_pe,
                "reference_value": av_pe,
                "diff_percent": diff
            })
            report_lines.append(f"❌ **P/E Mismatch**: Yahoo={y_pe}, AV={av_pe} (Diff: {diff:.2f}%)")
        else:
            report_lines.append(f"✅ P/E Verified")
            
    # 4. Compare Revenue (TTM)
    # Yahoo usually provides TTM revenue in 'totalRevenue' or similar, but our get_deep_financials might not have TTM explicitly
    # Let's check 'revenue_growth' as a proxy for data freshness/alignment if direct revenue isn't easy to map
    
    if not conflicts:
        report_lines.append("\n✨ No significant discrepancies found.")
    else:
        report_lines.append(f"\n⚠️ **{len(conflicts)} Conflict(s) Detected** - User Review Required.")

    return {
        "conflicts": conflicts,
        "verification_report": "\n".join(report_lines)
    }
