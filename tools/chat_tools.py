"""
LangChain tools for querying the equity analysis database in chat mode.
"""

from typing import List, Dict, Any, Optional
from langchain_core.tools import StructuredTool
from context_engineering.memory import (
    get_latest_reports,
    get_report_count_by_ticker,
    get_all_ticker_counts,
    DB_PATH
)
import sqlite3

def _get_all_analyzed_tickers() -> str:
    """
    Get a list of all tickers that have been analyzed and stored in the database.
    Returns a formatted string list.
    """
    counts = get_all_ticker_counts()
    if not counts:
        return "No tickers found in the database."
    
    result = "Analyzed Tickers:\n"
    for item in counts:
        result += f"- {item['ticker']} ({item['count']} reports)\n"
    return result

get_all_analyzed_tickers_tool = StructuredTool.from_function(
    name="get_all_analyzed_tickers",
    description="List all stock tickers that have been analyzed and are available in the database.",
    func=_get_all_analyzed_tickers,
)


def _get_ticker_report(ticker: str) -> str:
    """
    Retrieve the latest analysis report for a specific ticker.
    """
    ticker = ticker.upper().strip()
    
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT report, created_at 
            FROM analysis_reports 
            WHERE ticker = ? 
            ORDER BY created_at DESC 
            LIMIT 1
            """,
            (ticker,)
        )
        row = cur.fetchone()
    
    if not row:
        return f"No analysis report found for {ticker}. Please ask the user if they want to run an analysis first."
    
    report_text, date = row
    return f"--- Report for {ticker} (Date: {date}) ---\n\n{report_text}"

get_ticker_report_tool = StructuredTool.from_function(
    name="get_ticker_report",
    description="Retrieve the full latest analysis report for a specific stock ticker.",
    func=_get_ticker_report,
)


def _compare_tickers(tickers: List[str]) -> str:
    """
    Retrieve reports for multiple tickers to facilitate comparison.
    """
    results = []
    missing = []
    
    for ticker in tickers:
        ticker = ticker.upper().strip()
        report = _get_ticker_report(ticker)
        if "No analysis report found" in report:
            missing.append(ticker)
        else:
            results.append(report)
    
    output = ""
    if results:
        output += "\n\n".join(results)
    
    if missing:
        output += f"\n\nNote: No reports found for: {', '.join(missing)}"
        
    return output

compare_tickers_tool = StructuredTool.from_function(
    name="compare_tickers",
    description="Retrieve reports for multiple tickers to compare them. Input should be a list of ticker strings.",
    func=_compare_tickers,
)


def _search_reports_by_keyword(keyword: str) -> str:
    """
    Search for a keyword across all reports in the database.
    """
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT ticker, created_at, report 
            FROM analysis_reports 
            WHERE report LIKE ? 
            ORDER BY created_at DESC 
            LIMIT 5
            """,
            (f"%{keyword}%",)
        )
        rows = cur.fetchall()
    
    if not rows:
        return f"No reports found containing the keyword '{keyword}'."
    
    results = [f"Found {len(rows)} matches for '{keyword}':"]
    for ticker, date, report in rows:
        # Extract snippet around keyword
        try:
            idx = report.lower().find(keyword.lower())
            start = max(0, idx - 100)
            end = min(len(report), idx + 100)
            snippet = report[start:end].replace("\n", " ")
            results.append(f"- {ticker} ({date}): ...{snippet}...")
        except (AttributeError, ValueError):
            results.append(f"- {ticker} ({date}): (Match found)")
            
    return "\n".join(results)

search_reports_tool = StructuredTool.from_function(
    name="search_reports_by_keyword",
    description="Search for a specific keyword or topic across all stored analysis reports.",
    func=_search_reports_by_keyword,
)

# Export all tools
CHAT_TOOLS = [
    get_all_analyzed_tickers_tool,
    get_ticker_report_tool,
    compare_tickers_tool,
    search_reports_tool
]
