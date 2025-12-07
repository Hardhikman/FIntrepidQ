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
        except (ValueError, TypeError):
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


def fill_missing_from_alpha_vantage(primary_data: Dict[str, Any], av_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fill missing metrics in primary (Yahoo) data using Alpha Vantage data.
    
    Args:
        primary_data: Financial data from Yahoo Finance (may have missing fields)
        av_data: Data from Alpha Vantage API
        
    Returns:
        Dict containing:
        - filled_data: Updated financial data with missing fields filled
        - filled_metrics: List of metrics that were filled from Alpha Vantage
        - fill_report: Text summary of what was filled
    """
    filled_data = primary_data.copy()
    filled_metrics = []
    report_lines = ["### 🔄 Data Enrichment (Alpha Vantage)"]
    
    # Helper to safely extract float values
    def parse_val(val):
        if val is None:
            return None
        try:
            return float(val)
        except (ValueError, TypeError):
            return None
    
    # Get AV data sections
    av_overview = av_data.get("overview", {})
    av_quote = av_data.get("quote", {})
    av_balance_sheet = av_data.get("balance_sheet", {})
    av_income = av_data.get("income_statement", {})
    av_cash_flow = av_data.get("cash_flow", {})
    
    # Get latest quarterly/annual reports if available
    bs_reports = av_balance_sheet.get("quarterlyReports", []) or av_balance_sheet.get("annualReports", [])
    latest_bs = bs_reports[0] if bs_reports else {}
    
    income_reports = av_income.get("quarterlyReports", []) or av_income.get("annualReports", [])
    latest_income = income_reports[0] if income_reports else {}
    
    cf_reports = av_cash_flow.get("quarterlyReports", []) or av_cash_flow.get("annualReports", [])
    latest_cf = cf_reports[0] if cf_reports else {}
    
    # --- Mapping: Yahoo field -> (AV source, AV field name, optional calculation) ---
    
    # 1. debt_to_equity - calculate from balance sheet
    if not _check_metric_availability(filled_data, "debt_to_equity"):
        total_debt = parse_val(latest_bs.get("shortLongTermDebtTotal")) or parse_val(latest_bs.get("longTermDebt"))
        total_equity = parse_val(latest_bs.get("totalShareholderEquity"))
        
        if total_debt is not None and total_equity and total_equity != 0:
            debt_to_equity = total_debt / total_equity
            filled_data["debt_to_equity"] = round(debt_to_equity, 4)
            filled_metrics.append("debt_to_equity")
            report_lines.append(f"✅ Filled `debt_to_equity`: {debt_to_equity:.4f} (calculated from AV balance sheet)")
        elif total_debt == 0 or total_debt is None:
            # Check if there's any debt mentioned
            short_debt = parse_val(latest_bs.get("shortTermDebt")) or 0
            long_debt = parse_val(latest_bs.get("longTermDebt")) or 0
            total_debt = short_debt + long_debt
            if total_equity and total_equity != 0:
                debt_to_equity = total_debt / total_equity
                filled_data["debt_to_equity"] = round(debt_to_equity, 4)
                filled_metrics.append("debt_to_equity")
                report_lines.append(f"✅ Filled `debt_to_equity`: {debt_to_equity:.4f} (calculated from AV short+long term debt)")
    
    # 2. trailing_pe - from overview
    if not _check_metric_availability(filled_data, "trailing_pe"):
        av_pe = parse_val(av_overview.get("PERatio"))
        if av_pe:
            filled_data["trailing_pe"] = av_pe
            filled_metrics.append("trailing_pe")
            report_lines.append(f"✅ Filled `trailing_pe`: {av_pe}")
    
    # 3. forward_pe - from overview
    if not _check_metric_availability(filled_data, "forward_pe"):
        av_fwd_pe = parse_val(av_overview.get("ForwardPE"))
        if av_fwd_pe:
            filled_data["forward_pe"] = av_fwd_pe
            filled_metrics.append("forward_pe")
            report_lines.append(f"✅ Filled `forward_pe`: {av_fwd_pe}")
    
    # 4. peg_ratio - from overview
    if not _check_metric_availability(filled_data, "peg_ratio"):
        av_peg = parse_val(av_overview.get("PEGRatio"))
        if av_peg:
            filled_data["peg_ratio"] = av_peg
            filled_metrics.append("peg_ratio")
            report_lines.append(f"✅ Filled `peg_ratio`: {av_peg}")
    
    # 5. return_on_equity - from overview
    if not _check_metric_availability(filled_data, "return_on_equity"):
        av_roe = parse_val(av_overview.get("ReturnOnEquityTTM"))
        if av_roe:
            filled_data["return_on_equity"] = av_roe
            filled_metrics.append("return_on_equity")
            report_lines.append(f"✅ Filled `return_on_equity`: {av_roe}")
    
    # 6. return_on_assets - from overview
    if not _check_metric_availability(filled_data, "return_on_assets"):
        av_roa = parse_val(av_overview.get("ReturnOnAssetsTTM"))
        if av_roa:
            filled_data["return_on_assets"] = av_roa
            filled_metrics.append("return_on_assets")
            report_lines.append(f"✅ Filled `return_on_assets`: {av_roa}")
    
    # 7. profit_margins - from overview
    if not _check_metric_availability(filled_data, "profit_margins"):
        av_pm = parse_val(av_overview.get("ProfitMargin"))
        if av_pm:
            filled_data["profit_margins"] = av_pm
            filled_metrics.append("profit_margins")
            report_lines.append(f"✅ Filled `profit_margins`: {av_pm}")
    
    # 8. dividend_yield - from overview
    if not _check_metric_availability(filled_data, "dividend_yield"):
        av_div = parse_val(av_overview.get("DividendYield"))
        if av_div:
            filled_data["dividend_yield"] = av_div
            filled_metrics.append("dividend_yield")
            report_lines.append(f"✅ Filled `dividend_yield`: {av_div}")
    
    # 9. free_cash_flow - calculate from cash flow statement
    if not _check_metric_availability(filled_data, "free_cash_flow"):
        operating_cf = parse_val(latest_cf.get("operatingCashflow"))
        capex = parse_val(latest_cf.get("capitalExpenditures"))
        
        if operating_cf is not None:
            # CapEx is typically negative, but AV might report it as positive
            capex = abs(capex) if capex else 0
            fcf = operating_cf - capex
            filled_data["free_cash_flow"] = fcf
            filled_metrics.append("free_cash_flow")
            report_lines.append(f"✅ Filled `free_cash_flow`: ${fcf:,.0f} (OCF - CapEx from AV)")
    
    # 10. operating_cashflow - from cash flow statement
    if not _check_metric_availability(filled_data, "operating_cashflow"):
        operating_cf = parse_val(latest_cf.get("operatingCashflow"))
        if operating_cf:
            filled_data["operating_cashflow"] = operating_cf
            filled_metrics.append("operating_cashflow")
            report_lines.append(f"✅ Filled `operating_cashflow`: ${operating_cf:,.0f}")
    
    # 11. revenue_growth - from overview
    if not _check_metric_availability(filled_data, "revenue_growth"):
        # AV has "QuarterlyRevenueGrowthYOY" 
        av_rev_growth = parse_val(av_overview.get("QuarterlyRevenueGrowthYOY"))
        if av_rev_growth:
            filled_data["revenue_growth"] = av_rev_growth
            filled_metrics.append("revenue_growth")
            report_lines.append(f"✅ Filled `revenue_growth`: {av_rev_growth}")
    
    # 12. current_price - from quote
    if not _check_metric_availability(filled_data, "current_price"):
        av_price = parse_val(av_quote.get("05. price"))
        if av_price:
            filled_data["current_price"] = av_price
            filled_metrics.append("current_price")
            report_lines.append(f"✅ Filled `current_price`: ${av_price}")
    
    # 13. market_cap - from overview
    if not _check_metric_availability(filled_data, "market_cap"):
        av_mc = parse_val(av_overview.get("MarketCapitalization"))
        if av_mc:
            filled_data["market_cap"] = av_mc
            filled_metrics.append("market_cap")
            report_lines.append(f"✅ Filled `market_cap`: ${av_mc:,.0f}")
    
    # Summary
    if filled_metrics:
        report_lines.append(f"\n📊 **{len(filled_metrics)} metric(s) enriched from Alpha Vantage**")
    else:
        report_lines.append("\nℹ️ No missing metrics could be filled from Alpha Vantage.")
    
    return {
        "filled_data": filled_data,
        "filled_metrics": filled_metrics,
        "fill_report": "\n".join(report_lines)
    }
