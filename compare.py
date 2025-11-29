"""
Stock comparison tool for IntrepidQ Equity Analysis.

Allows comparing multiple stocks side-by-side based on their latest analysis reports.
"""

import asyncio
from typing import List, Dict, Any
from pathlib import Path
from datetime import datetime

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.markdown import Markdown

from context_engineering import memory
from agents import build_deep_agent
from context_engineering import deep_prompt
import config


app = typer.Typer()
console = Console(width=120)


# =============================================================================
# COMPARISON FUNCTIONS
# =============================================================================


def _extract_metrics_from_report(report: str) -> Dict[str, Any]:
    """
    Extract key metrics from an analysis report.
    
    Returns a dict with extracted metrics for comparison.
    """
    metrics = {
        "verdict": "N/A",
        "green_flags_count": 0,
        "red_flags_count": 0,
        "revenue_growth": None,
        "profit_margins": None,
        "debt_to_equity": None,
        "roe": None,
        "free_cash_flow": None,
    }
    
    # Extract verdict
    if "**Buy**" in report or "Buy." in report:
        metrics["verdict"] = "🟢 Buy"
    elif "**Sell**" in report or "Sell." in report:
        metrics["verdict"] = "🔴 Sell"
    elif "**Hold**" in report or "Hold." in report:
        metrics["verdict"] = "🟡 Hold"
    
    # Count flags
    green_section = report.split("🟢 GREEN FLAGS")
    if len(green_section) > 1:
        green_text = green_section[1].split("🚩")[0] if "🚩" in green_section[1] else green_section[1].split("💡")[0]
        metrics["green_flags_count"] = green_text.count("*")
    
    red_section = report.split("🚩 RED FLAGS")
    if len(red_section) > 1:
        red_text = red_section[1].split("💡")[0]
        metrics["red_flags_count"] = red_text.count("*")
    
    # Extract specific metrics (simple pattern matching)
    import re
    
    # Revenue growth
    revenue_match = re.search(r'revenue growth of ([\d.]+)%', report, re.IGNORECASE)
    if revenue_match:
        metrics["revenue_growth"] = f"{revenue_match.group(1)}%"
    
    # Profit margins
    margin_match = re.search(r'profit margins? (?:at |of )([\d.]+)%', report, re.IGNORECASE)
    if margin_match:
        metrics["profit_margins"] = f"{margin_match.group(1)}%"
    
    # Debt to equity
    debt_match = re.search(r'debt-to-equity ratio of ([\d.]+)', report, re.IGNORECASE)
    if debt_match:
        metrics["debt_to_equity"] = debt_match.group(1)
    
    # ROE
    roe_match = re.search(r'ROE\)? of ([\d.]+)%', report, re.IGNORECASE)
    if roe_match:
        metrics["roe"] = f"{roe_match.group(1)}%"
    
    # Free cash flow
    fcf_match = re.search(r'free cash flow of \$?([\d.]+)\s*(billion|million|B|M)', report, re.IGNORECASE)
    if fcf_match:
        metrics["free_cash_flow"] = f"${fcf_match.group(1)}{fcf_match.group(2)[0]}"
    
    return metrics


async def _get_or_create_analysis(ticker: str, user_id: str) -> str:
    """Get existing analysis from DB or create a new one."""
    # Try to get latest report from database
    reports = memory.get_latest_reports(user_id, limit=100)
    
    for report_meta in reports:
        if report_meta["ticker"] == ticker.upper():
            session_id = report_meta["session_id"]
            report = memory.get_report(session_id)
            if report:
                console.print(f"[dim]Using existing analysis for {ticker}[/dim]")
                return report
    
    # If not found, create new analysis
    console.print(f"[yellow]Analyzing {ticker}...[/yellow]")
    
    agent = build_deep_agent()
    system_message_content = deep_prompt.messages[0].prompt.template
    user_message = f"Perform a deep equity analysis for ticker {ticker}."
    
    result = await agent.ainvoke({
        "messages": [
            {"role": "system", "content": system_message_content},
            {"role": "user", "content": user_message}
        ]
    })
    
    # Extract the final message
    if isinstance(result, dict) and "messages" in result:
        last_msg = result["messages"][-1]
        from main import _normalize_content
        final_text = _normalize_content(last_msg.content)
    else:
        from main import _normalize_content
        final_text = _normalize_content(result)
    
    # Save to database
    import uuid
    session_id = f"analysis_{ticker}_{uuid.uuid4().hex[:6]}"
    await memory.save_analysis_to_memory(
        session_id=session_id,
        user_id=user_id,
        ticker=ticker.upper(),
        report=final_text,
    )
    
    return final_text


# =============================================================================
# CLI COMMANDS
# =============================================================================


@app.command()
def compare(
    tickers: List[str] = typer.Argument(..., help="Stock tickers to compare (e.g., TSLA AAPL MSFT)"),
    user_id: str = typer.Option(None, help="User ID for tracking"),
    force_refresh: bool = typer.Option(False, "--refresh", help="Force new analysis instead of using cached")
):
    """
    Compare multiple stocks side-by-side.
    
    Examples:
        python compare.py compare TSLA AAPL MSFT
        python compare.py compare GOOGL AMZN --refresh
    """
    user_id = user_id or config.DEFAULT_USER_ID
    tickers = [t.upper().strip() for t in tickers]
    
    if len(tickers) < 2:
        console.print("[red]Please provide at least 2 tickers to compare.[/red]")
        return
    
    console.print(f"\n[bold blue]📊 Comparing {len(tickers)} stocks: {', '.join(tickers)}[/bold blue]\n")
    
    async def _run():
        # Get or create analyses
        reports = {}
        for ticker in tickers:
            try:
                if force_refresh:
                    # Force new analysis
                    console.print(f"[yellow]Analyzing {ticker}...[/yellow]")
                    agent = build_deep_agent()
                    system_message_content = deep_prompt.messages[0].prompt.template
                    user_message = f"Perform a deep equity analysis for ticker {ticker}."
                    
                    result = await agent.ainvoke({
                        "messages": [
                            {"role": "system", "content": system_message_content},
                            {"role": "user", "content": user_message}
                        ]
                    })
                    
                    if isinstance(result, dict) and "messages" in result:
                        from main import _normalize_content
                        final_text = _normalize_content(result["messages"][-1].content)
                    else:
                        from main import _normalize_content
                        final_text = _normalize_content(result)
                    
                    import uuid
                    session_id = f"analysis_{ticker}_{uuid.uuid4().hex[:6]}"
                    await memory.save_analysis_to_memory(
                        session_id=session_id,
                        user_id=user_id,
                        ticker=ticker,
                        report=final_text,
                    )
                    reports[ticker] = final_text
                else:
                    reports[ticker] = await _get_or_create_analysis(ticker, user_id)
            except Exception as e:
                console.print(f"[red]Error analyzing {ticker}: {e}[/red]")
                reports[ticker] = None
        
        # Extract metrics from reports
        comparison_data = {}
        for ticker, report in reports.items():
            if report:
                comparison_data[ticker] = _extract_metrics_from_report(report)
            else:
                comparison_data[ticker] = None
        
        # Create comparison table
        table = Table(title="Stock Comparison", show_header=True, header_style="bold cyan")
        table.add_column("Metric", style="yellow", width=20)
        
        for ticker in tickers:
            table.add_column(ticker, style="white", width=15)
        
        # Add rows
        metrics_to_show = [
            ("Verdict", "verdict"),
            ("Green Flags", "green_flags_count"),
            ("Red Flags", "red_flags_count"),
            ("Revenue Growth", "revenue_growth"),
            ("Profit Margins", "profit_margins"),
            ("Debt/Equity", "debt_to_equity"),
            ("ROE", "roe"),
            ("Free Cash Flow", "free_cash_flow"),
        ]
        
        for metric_name, metric_key in metrics_to_show:
            row = [metric_name]
            for ticker in tickers:
                if comparison_data[ticker]:
                    value = comparison_data[ticker].get(metric_key)
                    if value is None:
                        row.append("N/A")
                    else:
                        row.append(str(value))
                else:
                    row.append("Error")
            table.add_row(*row)
        
        console.print("\n")
        console.print(table)
        console.print("\n")
        
        # Show detailed verdicts
        console.print(Panel(
            "\n".join([
                f"**{ticker}**: {comparison_data[ticker]['verdict'] if comparison_data[ticker] else 'Error'}"
                for ticker in tickers
            ]),
            title="[bold cyan]Investment Verdicts[/bold cyan]",
            border_style="cyan"
        ))
        console.print("\n")
    
    asyncio.run(_run())


@app.command()
def export(
    ticker: str = typer.Argument(..., help="Stock ticker to export"),
    format: str = typer.Option("md", "--format", "-f", help="Export format: md, txt, or json"),
    user_id: str = typer.Option(None, help="User ID")
):
    """
    Export a stock analysis report to a file.
    
    Examples:
        python compare.py export TSLA --format md
        python compare.py export AAPL --format json
    """
    user_id = user_id or config.DEFAULT_USER_ID
    ticker = ticker.upper().strip()
    
    # Get latest report
    reports = memory.get_latest_reports(user_id, limit=100)
    report_text = None
    
    for report_meta in reports:
        if report_meta["ticker"] == ticker:
            session_id = report_meta["session_id"]
            report_text = memory.get_report(session_id)
            break
    
    if not report_text:
        console.print(f"[red]No report found for {ticker}[/red]")
        return
    
    # Export based on format
    export_dir = Path("exports")
    export_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if format == "md":
        filepath = export_dir / f"{ticker}_{timestamp}.md"
        filepath.write_text(report_text, encoding='utf-8')
    elif format == "txt":
        filepath = export_dir / f"{ticker}_{timestamp}.txt"
        # Strip markdown formatting
        import re
        plain_text = re.sub(r'[#*_`]', '', report_text)
        filepath.write_text(plain_text, encoding='utf-8')
    elif format == "json":
        import json
        filepath = export_dir / f"{ticker}_{timestamp}.json"
        metrics = _extract_metrics_from_report(report_text)
        data = {
            "ticker": ticker,
            "timestamp": timestamp,
            "metrics": metrics,
            "full_report": report_text
        }
        filepath.write_text(json.dumps(data, indent=2), encoding='utf-8')
    else:
        console.print(f"[red]Unknown format: {format}. Use md, txt, or json[/red]")
        return
    
    console.print(f"[green]✅ Exported to: {filepath}[/green]")


if __name__ == "__main__":
    app()
