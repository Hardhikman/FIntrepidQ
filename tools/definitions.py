import os
import re
import time
from pathlib import Path
from typing import Dict, Any, List
from urllib.parse import urlparse


from pydantic import BaseModel, Field
from langchain_core.tools import StructuredTool
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type


import yfinance as yf
from ddgs import DDGS
from cachetools import cached, TTLCache
import pandas as pd
import numpy as np

from utils.cli_logger import api_logger, error_logger

# Import Rust accelerated functions
from rust_finance import (
    # Risk calculations
    calculate_volatility as rust_volatility,
    calculate_sharpe_ratio as rust_sharpe,
    calculate_max_drawdown as rust_max_drawdown,
    calculate_var_95 as rust_var_95,
    # Technical indicators
    calculate_sma as rust_sma,
    calculate_rsi as rust_rsi,
    calculate_macd as rust_macd,
    # Utilities
    detect_trend as rust_detect_trend,
    detect_volume_spike as rust_volume_spike,
)
print("🦀 rust_finance loaded - using Rust accelerated calculations")


# Cache for 1 hour (3600 seconds)
cache = TTLCache(maxsize=100, ttl=3600)


def _sanitize_for_json(obj):
    """
    Recursively sanitize an object for JSON/literal_eval serialization.
    Converts numpy types to native Python types and handles NaN/Inf values.
    """
    import math
    
    if obj is None:
        return None
    
    # Handle numpy types
    if isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating,)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return _sanitize_for_json(obj.tolist())
    
    # Handle standard Python float (could be inf/nan from calculations)
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    
    # Handle collections recursively
    elif isinstance(obj, dict):
        return {k: _sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_sanitize_for_json(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(_sanitize_for_json(item) for item in obj)
    
    # Handle pandas Timestamp
    elif hasattr(obj, 'strftime'):
        return obj.strftime('%Y-%m-%d')
    
    # Return as-is for other types (str, int, bool, etc.)
    return obj

# Base directory for skills
SKILLS_DIR = Path(__file__).parent.parent / "context_engineering" / "skills"


def _extract_domain(url: str) -> str:
    """
    Extract website domain from URL.
    
    Args:
        url: Full URL string
        
    Returns:
        Domain name (e.g., 'reuters.com') or 'unknown' if extraction fails
    """
    if not url:
        return "unknown"
    try:
        domain = urlparse(url).netloc
        # Remove 'www.' prefix if present
        return domain.replace('www.', '') if domain else "unknown"
    except Exception:
        return "unknown"


def _safe_trend(values: list, increasing: bool = True, use_abs: bool = False) -> str:
    """
    Detect trend using Rust. Handles None/NaN/empty lists.
    """
    if not values or len(values) < 2:
        return "unknown"
    
    # Clean values (remove None/NaN)
    clean_values = []
    for v in values:
        if v is not None:
            try:
                if not (np.isnan(v) or np.isinf(v)):
                    clean_values.append(float(abs(v) if use_abs else v))
            except (TypeError, ValueError):
                pass
    
    if len(clean_values) < 2:
        return "unknown"
    
    return rust_detect_trend(clean_values)


# SKILL LOADER TOOL


def _load_skill(name: str) -> str:
    """
    Load SKILL.md content for a given skill name.

    Args:
        name: Skill folder name under skills/, e.g. 'equity_trigger_analysis'

    The agent can then read and follow these instructions.
    """
    skill_dir = SKILLS_DIR / name
    skill_file = skill_dir / "SKILL.md"
    if not skill_file.exists():
        return f"Skill '{name}' not found at {skill_file}."
    try:
        return skill_file.read_text(encoding="utf-8")
    except Exception as e:
        return f"Failed to read SKILL.md for '{name}': {e}"



load_skill_tool = StructuredTool.from_function(
    name="load_skill",
    description=(
        "Load instructions for a named skill from a SKILL.md file on disk. "
        "Use this to get domain-specific rules, like 'equity_trigger_analysis'."
    ),
    func=_load_skill,
)



# QUANT TOOL: DEEP FINANCIALS (YFINANCE)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((ConnectionError, TimeoutError, OSError)),
    reraise=True
)
@cached(cache)
def _get_deep_financials(ticker: str) -> Dict[str, Any]:
    """
    Fetch specific quantitative metrics for a stock using yfinance.

    Args:
        ticker: Stock ticker symbol (e.g., TSLA, AAPL, GOOGL)

    Returns a structured dict; the agent should interpret it using skills.
    """
    ticker = ticker.upper().strip()
    start_time = time.time()
    print(f" [Quant Tool] Fetching Deep Financials for {ticker}...")
    api_logger.log_request("yfinance", "get_info", ticker)


    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        #1. Historical Data & Technicals 
        # Extended to 5y to support 200-week SMA (200 weeks ≈ 4 years)
        hist = stock.history(period="5y")
        technicals = {}
        risk_metrics = {}
        
        if not hist.empty:
            prices_list = hist['Close'].tolist()
            
            # Weekly data for 200-week SMA
            weekly_close = hist['Close'].resample('W').last()
            weekly_prices = weekly_close.tolist()
            
            # Helper to safely extract values
            def _safe_value(val):
                if val is None:
                    return None
                try:
                    if np.isnan(val) or np.isinf(val):
                        return None
                    return float(val)
                except (TypeError, ValueError):
                    return val
            
            #1. Technical Indicators (Rust)
            current_price = prices_list[-1] if prices_list else None
            sma_50 = rust_sma(prices_list, 50) if len(prices_list) >= 50 else None
            sma_200 = rust_sma(prices_list, 200) if len(prices_list) >= 200 else None
            sma_200_weeks = rust_sma(weekly_prices, 200) if len(weekly_prices) >= 200 else None
            rsi = rust_rsi(prices_list, 14) if len(prices_list) >= 15 else None
            macd_result = rust_macd(prices_list) if len(prices_list) >= 26 else (None, None, None)
            
            technicals = {
                "current_price": _safe_value(current_price),
                "sma_50": _safe_value(sma_50),
                "sma_200": _safe_value(sma_200),
                "sma_200_weeks": _safe_value(sma_200_weeks),
                "rsi": _safe_value(rsi),
                "macd": _safe_value(macd_result[0]) if macd_result else None,
                "macd_signal": _safe_value(macd_result[1]) if macd_result else None,
            }
            
            #2. Risk Metrics (Rust)
            daily_returns = hist['Close'].pct_change().dropna()
            returns_list = daily_returns.tolist()
            
            volatility = rust_volatility(returns_list) if returns_list else 0.0
            sharpe = rust_sharpe(returns_list, 0.0) if returns_list else 0.0
            max_drawdown = rust_max_drawdown(prices_list) if prices_list else 0.0
            var_95 = rust_var_95(returns_list) if returns_list else 0.0
            
            risk_metrics = {
                "volatility_annualized": volatility,
                "max_drawdown": max_drawdown,
                "sharpe_ratio": sharpe,
                "value_at_risk_95": var_95,
            }

        #3. Financial Trends (Quarterly & Annual)
        # Comprehensive trend analysis: both quarterly and annual
        financial_trends = {}
        try:
            #QUARTERLY TRENDS
            q_fin = stock.quarterly_financials
            q_bal = stock.quarterly_balance_sheet
            q_cf = stock.quarterly_cashflow
            
            quarterly_data = {}
            if not q_fin.empty and not q_bal.empty:
                # Extract dates and convert to string
                quarter_dates = [d.strftime('%Y-%m-%d') for d in q_fin.columns[:4]] if not q_fin.empty else []
                
                # Revenue, Debt & Interest
                recent_rev = q_fin.loc['Total Revenue'].head(4).tolist() if 'Total Revenue' in q_fin.index else []
                recent_debt = q_bal.loc['Total Debt'].head(4).tolist() if 'Total Debt' in q_bal.index else []
                recent_ebit = q_fin.loc['EBIT'].head(4).tolist() if 'EBIT' in q_fin.index else []
                recent_interest = []
                if 'Interest Expense' in q_fin.index:
                    recent_interest = q_fin.loc['Interest Expense'].head(4).tolist()
                elif 'Interest Expense Non Operating' in q_fin.index:
                    recent_interest = q_fin.loc['Interest Expense Non Operating'].head(4).tolist()
                elif 'Net Interest Income' in q_fin.index:
                    # If Net Interest Income is negative, it's net expense
                    recent_interest = [abs(x) if x is not None and x < 0 else 0 for x in q_fin.loc['Net Interest Income'].head(4).tolist()]
                
                # CapEx & FCF Tracking
                recent_capex = []
                recent_fcf = []
                if not q_cf.empty:
                    if 'Capital Expenditure' in q_cf.index:
                        recent_capex = q_cf.loc['Capital Expenditure'].head(4).tolist()
                    elif 'Capital Expenditures' in q_cf.index:
                        recent_capex = q_cf.loc['Capital Expenditures'].head(4).tolist()
                    
                    if 'Free Cash Flow' in q_cf.index:
                        recent_fcf = q_cf.loc['Free Cash Flow'].head(4).tolist()
                    elif 'Changes In Cash' in q_cf.index: # Fallback if FCF not explicit
                        recent_fcf = q_cf.loc['Changes In Cash'].head(4).tolist()
                
                # Retained Earnings
                recent_retained_earnings = []
                if 'Retained Earnings' in q_bal.index:
                    recent_retained_earnings = q_bal.loc['Retained Earnings'].head(4).tolist()
                
                # Net Income
                recent_net_income = []
                if 'Net Income' in q_fin.index:
                    recent_net_income = q_fin.loc['Net Income'].head(4).tolist()
                
                quarterly_data = {
                    "quarter_dates": quarter_dates,  # [Newest, ..., Oldest]
                    "revenue_quarters": recent_rev, 
                    "debt_quarters": recent_debt,
                    "capex_quarters": recent_capex,
                    "retained_earnings_quarters": recent_retained_earnings,
                    "net_income_quarters": recent_net_income,
                    "fcf_quarters": recent_fcf,
                    "ebit_quarters": recent_ebit,
                    "interest_quarters": recent_interest,
                    # Quarterly trends (Q-o-Q) with safe comparison
                    "revenue_trend_qoq": _safe_trend(recent_rev, increasing=True),
                    "debt_trend_qoq": _safe_trend(recent_debt, increasing=False),
                    "capex_trend_qoq": _safe_trend(recent_capex, increasing=True, use_abs=True),
                    "retained_earnings_trend_qoq": _safe_trend(recent_retained_earnings, increasing=True),
                    "net_income_trend_qoq": _safe_trend(recent_net_income, increasing=True),
                    "fcf_trend_qoq": _safe_trend(recent_fcf, increasing=True),
                }
            
            #ANNUAL TRENDS 
            a_fin = stock.financials  # Annual financials
            a_bal = stock.balance_sheet  # Annual balance sheet
            a_cf = stock.cashflow  # Annual cashflow
            
            annual_data = {}
            if not a_fin.empty and not a_bal.empty:
                # Extract year dates (last 3 years)
                year_dates = [d.strftime('%Y') for d in a_fin.columns[:3]] if not a_fin.empty else []
                
                # Annual Revenue & EBIT
                annual_rev = a_fin.loc['Total Revenue'].head(3).tolist() if 'Total Revenue' in a_fin.index else []
                annual_ebit = a_fin.loc['EBIT'].head(3).tolist() if 'EBIT' in a_fin.index else []
                annual_interest = []
                if 'Interest Expense' in a_fin.index:
                    annual_interest = a_fin.loc['Interest Expense'].head(3).tolist()
                elif 'Interest Expense Non Operating' in a_fin.index:
                    annual_interest = a_fin.loc['Interest Expense Non Operating'].head(3).tolist()
                elif 'Net Interest Income' in a_fin.index:
                    annual_interest = [abs(x) if x is not None and x < 0 else 0 for x in a_fin.loc['Net Interest Income'].head(3).tolist()]
                
                # Annual Debt
                annual_debt = a_bal.loc['Total Debt'].head(3).tolist() if 'Total Debt' in a_bal.index else []
                
                # Annual CapEx
                annual_capex = []
                if not a_cf.empty and 'Capital Expenditure' in a_cf.index:
                    annual_capex = a_cf.loc['Capital Expenditure'].head(3).tolist()
                elif not a_cf.empty and 'Capital Expenditures' in a_cf.index:
                    annual_capex = a_cf.loc['Capital Expenditures'].head(3).tolist()
                
                # Annual FCF
                annual_fcf = []
                if not a_cf.empty:
                    if 'Free Cash Flow' in a_cf.index:
                        annual_fcf = a_cf.loc['Free Cash Flow'].head(3).tolist()
                    elif 'Changes In Cash' in a_cf.index:
                        annual_fcf = a_cf.loc['Changes In Cash'].head(3).tolist()
                
                # Annual Retained Earnings
                annual_retained_earnings = []
                if 'Retained Earnings' in a_bal.index:
                    annual_retained_earnings = a_bal.loc['Retained Earnings'].head(3).tolist()
                
                # Annual Net Income
                annual_net_income = []
                if 'Net Income' in a_fin.index:
                    annual_net_income = a_fin.loc['Net Income'].head(3).tolist()
                
                # Annual Total Assets
                annual_assets = []
                if 'Total Assets' in a_bal.index:
                    annual_assets = a_bal.loc['Total Assets'].head(3).tolist()
                
                annual_data = {
                    "year_dates": year_dates,  # [Newest, ..., Oldest]
                    "revenue_annual": annual_rev,
                    "debt_annual": annual_debt,
                    "capex_annual": annual_capex,
                    "retained_earnings_annual": annual_retained_earnings,
                    "net_income_annual": annual_net_income,
                    "total_assets_annual": annual_assets,
                    "fcf_annual": annual_fcf,
                    "ebit_annual": annual_ebit,
                    "interest_annual": annual_interest,
                    # Annual trends (Y-o-Y) with safe comparison
                    "revenue_trend_yoy": _safe_trend(annual_rev, increasing=True),
                    "debt_trend_yoy": _safe_trend(annual_debt, increasing=False),
                    "capex_trend_yoy": _safe_trend(annual_capex, increasing=True, use_abs=True),
                    "retained_earnings_trend_yoy": _safe_trend(annual_retained_earnings, increasing=True),
                    "net_income_trend_yoy": _safe_trend(annual_net_income, increasing=True),
                    "assets_trend_yoy": _safe_trend(annual_assets, increasing=True),
                    "fcf_trend_yoy": _safe_trend(annual_fcf, increasing=True),
                }
            
            # Combine both quarterly and annual trends
            financial_trends = {
                "quarterly": quarterly_data,
                "annual": annual_data,
            }
            
        except Exception as e:
            print(f"Warning: Could not fetch financial trends: {e}")
        
        #4. Volume Trends (NEW)
        volume_trends = {}
        if not hist.empty and 'Volume' in hist.columns:
            # Calculate average volume for different periods
            avg_volume_10d = hist['Volume'].tail(10).mean()
            avg_volume_50d = hist['Volume'].tail(50).mean()
            avg_volume_200d = hist['Volume'].tail(200).mean()
            
            # Recent volume spike detection
            latest_volume = hist['Volume'].iloc[-1]
            volume_spike = latest_volume > (avg_volume_50d * 1.5)  # 50% above average
            
            volume_trends = {
                "latest_volume": int(latest_volume),
                "avg_volume_10d": int(avg_volume_10d),
                "avg_volume_50d": int(avg_volume_50d),
                "avg_volume_200d": int(avg_volume_200d),
                "volume_spike": volume_spike,
                "volume_trend": "increasing" if avg_volume_10d > avg_volume_50d else "decreasing"
            }
        
        #5. Dividend Yield Trend (NEW)
        dividend_trends = {}
        try:
            dividends = stock.dividends
            if not dividends.empty and len(dividends) > 0:
                # Get annual dividends for last 3 years
                annual_divs = dividends.resample('YE').sum()  # 'YE' = Year End (Y is deprecated)
                recent_annual_divs = annual_divs.tail(3).tolist()
                div_years = [d.strftime('%Y') for d in annual_divs.tail(3).index]
                
                dividend_trends = {
                    "annual_dividends": recent_annual_divs,
                    "dividend_years": div_years,
                    "dividend_trend": "increasing" if len(recent_annual_divs) > 1 and recent_annual_divs[-1] > recent_annual_divs[-2] else "decreasing"
                }
        except Exception as e:
            print(f"Warning: Could not fetch dividend trends: {e}")

        #6. ROCE Calculation (NEW)
        # ROCE = EBIT / (Total Assets - Current Liabilities)
        roce = None
        try:
            # Try to get from annual financials first
            if not a_fin.empty and not a_bal.empty:
                # EBIT
                ebit = None
                if 'EBIT' in a_fin.index:
                    ebit = a_fin.loc['EBIT'].iloc[0]
                elif 'Pretax Income' in a_fin.index and 'Interest Expense' in a_fin.index:
                     # Approximation: EBIT ~ Pretax Income + Interest Expense
                     ebit = a_fin.loc['Pretax Income'].iloc[0] + abs(a_fin.loc['Interest Expense'].iloc[0])

                # Capital Employed
                total_assets = a_bal.loc['Total Assets'].iloc[0] if 'Total Assets' in a_bal.index else None
                current_liabilities = None
                if 'Total Current Liabilities' in a_bal.index:
                    current_liabilities = a_bal.loc['Total Current Liabilities'].iloc[0]
                elif 'Current Liabilities' in a_bal.index: # Sometimes named differently
                     current_liabilities = a_bal.loc['Current Liabilities'].iloc[0]
                
                if ebit is not None and total_assets is not None and current_liabilities is not None:
                    capital_employed = total_assets - current_liabilities
                    if capital_employed != 0:
                        roce = ebit / capital_employed

        except Exception as e:
            print(f"Warning: Could not calculate ROCE: {e}")

        # 7. Debt-to-Equity Calculation (Fallback)
        # If info doesn't provide debt_to_equity, calculate from balance sheet
        debt_to_equity_calculated = None
        try:
            # First try to get from info
            debt_to_equity_calculated = info.get("debtToEquity")
            
            # yfinance returns D/E as percentage (e.g., 152.41 instead of 1.52)
            # Normalize to standard ratio format for SKILL.md thresholds (>2.0 = high leverage)
            if debt_to_equity_calculated is not None:
                debt_to_equity_calculated = debt_to_equity_calculated / 100
            
            # If not available, calculate from balance sheet
            if debt_to_equity_calculated is None and not a_bal.empty:
                total_debt = info.get("totalDebt", 0) or 0
                
                # Get stockholders equity from balance sheet
                stockholders_equity = None
                if 'Stockholders Equity' in a_bal.index:
                    stockholders_equity = a_bal.loc['Stockholders Equity'].iloc[0]
                elif 'Total Stockholders Equity' in a_bal.index:
                    stockholders_equity = a_bal.loc['Total Stockholders Equity'].iloc[0]
                elif 'Total Equity Gross Minority Interest' in a_bal.index:
                    stockholders_equity = a_bal.loc['Total Equity Gross Minority Interest'].iloc[0]
                
                if stockholders_equity is not None and stockholders_equity != 0:
                    debt_to_equity_calculated = total_debt / stockholders_equity
                elif total_debt == 0:
                    # If no debt and no equity data, debt_to_equity is 0
                    debt_to_equity_calculated = 0.0
                    
        except Exception as e:
            print(f"Warning: Could not calculate debt_to_equity: {e}")

        # 8. ICR Calculation (NEW)
        # ICR = EBIT / Interest Expense
        icr_analysis = {}
        try:
            # Safely calculate ICR from annual data
            annual_ebit_list = annual_data.get("ebit_annual", [])
            annual_int_list = annual_data.get("interest_annual", [])
            
            icr_values = []
            for i in range(min(len(annual_ebit_list), len(annual_int_list))):
                ebit = annual_ebit_list[i]
                interest = abs(annual_int_list[i]) if annual_int_list[i] is not None else None
                if ebit is not None:
                    if interest and interest != 0:
                        icr_values.append(ebit / interest)
                    elif interest == 0:
                        # If zero interest, ICR is technically infinite (Very Strong)
                        # We use a high constant or Handle it in level categorization
                        icr_values.append(float('inf'))
                    else:
                        icr_values.append(None)
                else:
                    icr_values.append(None)
            
            latest_icr = icr_values[0] if icr_values else None
            
            def _get_icr_level(val):
                if val is None: return "unknown"
                if val == float('inf') or val > 10.0: return "exceptional"
                if val > 3.0: return "strong"
                if val >= 2.0: return "acceptable"
                if val >= 1.5: return "fair"
                if val >= 1.0: return "risk"
                return "high risk"

            icr_analysis = {
                "icr_value": latest_icr,
                "icr_level": _get_icr_level(latest_icr),
                "icr_history_annual": icr_values,
                "icr_trend_yoy": _safe_trend(icr_values, increasing=True)
            }
        except Exception as e:
            print(f"Warning: Could not calculate ICR analysis: {e}")

        # Add FCF trend to financial_trends
        if "financial_trends" in locals() or "financial_trends" in globals():
            financial_trends["fcf_trend"] = {
                "qoq": quarterly_data.get("fcf_trend_qoq", "unknown"),
                "yoy": annual_data.get("fcf_trend_yoy", "unknown")
            }

        financial_data = {
            "ticker": ticker,
            # Basic Info
            "current_price": info.get("currentPrice"),
            "market_cap": info.get("marketCap"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            
            # Growth & Margins
            "revenue_growth": info.get("revenueGrowth"),
            "profit_margins": info.get("profitMargins"),
            
            # Valuation
            "trailing_pe": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "peg_ratio": info.get("pegRatio"),
            "price_to_book": info.get("priceToBook"),
            
            # Dividends
            "dividend_yield": info.get("dividendYield"),
            "payout_ratio": info.get("payoutRatio"),
            
            # Returns
            "return_on_equity": info.get("returnOnEquity"),
            "return_on_assets": info.get("returnOnAssets"),
            "return_on_capital_employed": roce,
            
            # Risk
            "beta": info.get("beta"),
            
            # Debt & Cash
            "debt_to_equity": debt_to_equity_calculated,
            "total_debt": info.get("totalDebt"),
            "free_cash_flow": info.get("freeCashflow"),
            "operating_cashflow": info.get("operatingCashflow"),
            
            # New: Technicals & Risk
            "technicals": technicals,
            "risk_metrics": risk_metrics,
            "financial_trends": financial_trends,
            "icr_analysis": icr_analysis,
            "volume_trends": volume_trends,
            "dividend_trends": dividend_trends,
            "company_name": info.get("longName")
        }

        # Sanitize all values to ensure JSON/literal_eval compatibility
        financial_data = _sanitize_for_json(financial_data)

        return {
            "status": "success",
            "data": financial_data,
        }

    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        api_logger.log_response("yfinance", "error", duration_ms)
        error_logger.log_exception("_get_deep_financials", ticker)
        return {
            "status": "error",
            "error_message": f"Failed to fetch financials for {ticker}: {e}",
        }



get_deep_financials_tool = StructuredTool.from_function(
    name="get_deep_financials",
    description=(
        "Fetch detailed quantitative financial metrics for a stock ticker, "
        "including revenue growth, margins, debt, cash flow, and valuation metrics."
    ),
    func=_get_deep_financials,
)



# NEWS TOOL: STRATEGIC TRIGGERS (DUCKDUCKGO)


def _check_strategic_triggers(ticker: str) -> Dict[str, Any]:
    """
    Search news for qualitative 'green flag' or 'red flag' strategic signals.

    Args:
        ticker: Stock ticker symbol to scan for news signals

    Uses DuckDuckGo search (DDGS) synchronously for simplicity.
    """
    from utils.cli_logger import logger
    
    ticker = ticker.upper().strip()
    start_time = time.time()
    print(f" [News Tool] Scanning headlines for {ticker}...")
    api_logger.log_request("ddgs", "news_search", ticker)


    search_queries = [
        # Original Strategic Triggers
        f"{ticker} quarterly earnings beat guidance estimates",
        f"{ticker} company acquisition merger deal",
        f"{ticker} expansion new market new clients",
        f"{ticker} new product innovation R&D investment",
        f"{ticker} industry sector trends tailwinds",
        
        # New Qualitative Triggers
        f"{ticker} management leadership vision ethics CEO track record",
        f"{ticker} brand reputation sentiment customer trust",
        f"{ticker} macroeconomic impact interest rates inflation supply chain",
        f"{ticker} ESG environment social governance rating controversy",
        f"{ticker} insider trading management buying selling",
        
        # Specific Red Flags (NEW)
        f"{ticker} investigation legal proceeding lawsuit regulatory action",
        f"{ticker} management reshuffle CEO exit leadership change audit committee",
        f"{ticker} promoter share pledge reduction selling pledge release",
        
        # Investor Relations & Transparency
        f"{ticker} investor presentation earnings call transcript",
        f"{ticker} annual report integrated report",

        # Future Scope from Annual Reports (Global)
        f"{ticker} annual report forward outlook guidance",
        f"{ticker} management discussion future plans",
        f"{ticker} investor presentation strategy",
    ]


    signals: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []


    for q in search_queries:
        time.sleep(0.3)  # Rate limit: 300ms delay to avoid empty gzip responses
        max_retries = 2
        for attempt in range(max_retries + 1):
            try:
                with DDGS() as ddgs:
                    results = list(ddgs.news(q, max_results=3))
                if results:
                    for r in results:
                        source = _extract_domain(r.get('url', ''))
                        signal = {
                            "query": q,
                            "title": r.get("title"),
                            "date": r.get("date"),
                            "url": r.get("url", ""),
                            "source": source
                        }
                        signals.append(signal)
                        # Stream each news item to CLI in real-time
                        logger.log_news_item(signal.get("title", ""), signal.get("date", ""), source)

                break  # Success, exit retry loop
            except Exception as e:
                if attempt < max_retries:
                    time.sleep(1 * (attempt + 1))  # Exponential backoff
                    continue
                errors.append({"query": q, "error": str(e)})


    if not signals:
        summary = "No specific strategic signals found in recent news."
    else:
        parts = []
        for s in signals:
            source = _extract_domain(s.get('url', ''))
            parts.append(
                f"🔎 Query: {s['query']}\n"
                f"   Title: {s['title']}\n"
                f"   Date: {s['date']}\n"
                f"   Source: {source}"
            )
        summary = "\n\n".join(parts)


    # Log API response
    duration_ms = (time.time() - start_time) * 1000
    api_logger.log_response("ddgs", "success", duration_ms, len(signals))

    return {
        "status": "success",
        "data": {
            "ticker": ticker,
            "signals": signals,
            "signals_found": len(signals),
            "total_queries": len(search_queries),
            "summary": summary,
            "errors": errors or None,
        },
    }



check_strategic_triggers_tool = StructuredTool.from_function(
    name="check_strategic_triggers",
    description=(
        "Search recent news and headlines for strategic signals about a stock, "
        "including earnings beats, M&A, expansion, innovation, and industry trends."
    ),
    func=_check_strategic_triggers,
)



# Convenience export
# WEB SEARCH TOOL (GENERAL)


def _search_web(query: str) -> List[Dict[str, str]]:
    """
    Perform a general web search for a given query.
    
    Args:
        query: The search query string.
        
    Returns:
        List of top 5 search results with title, snippet, and link.
    """
    print(f" [Web Search] Searching for: {query}...")
    results = []
    try:
        with DDGS() as ddgs:
            # text() is the general search method in duckduckgo_search
            # It returns a generator, so we convert to list
            search_results = list(ddgs.text(query, max_results=5))
            
        for r in search_results:
            results.append({
                "title": r.get("title"),
                "snippet": r.get("body"),
                "link": r.get("href")
            })
            
    except Exception as e:
        return [{"error": f"Search failed: {str(e)}"}]
        
    return results


search_web_tool = StructuredTool.from_function(
    name="search_web",
    description=(
        "Perform a general web search to find information on any topic. "
        "Use this to investigate specific questions, verify claims, or find recent events "
        "that might explain financial anomalies."
    ),
    func=_search_web,
)


# Convenience export
# GOOGLE NEWS TOOL

class SearchResult(BaseModel):
    title: str
    url: str
    published_date: str = ""

def _parse_rss_content(xml_content: str, max_results: int) -> List[SearchResult]:
    """Parse Google News RSS XML content."""
    import xml.etree.ElementTree as ET
    from email.utils import parsedate_to_datetime
    
    results = []
    try:
        root = ET.fromstring(xml_content)
        for item in root.findall('.//item')[:max_results]:
            title = item.find('title').text if item.find('title') is not None else "No title"
            link = item.find('link').text if item.find('link') is not None else ""
            pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ""
            
            results.append(SearchResult(title=title, url=link, published_date=pub_date))
    except Exception as e:
        print(f"Error parsing RSS: {e}")
    
    return results

def _resolve_google_news_url(url: str) -> str:
    if not url or 'news.google.com' not in url:
        return url
    try:
        from googlenewsdecoder import gnewsdecoder
        result = gnewsdecoder(url, interval=1)
        if result.get("status"):
            return result["decoded_url"]
        return url
    except ImportError:
        print("Warning: googlenewsdecoder not installed. Returning original URL.")
        return url
    except Exception as e:
        print(f"Error resolving URL {url}: {e}")
        return url

def _search_google_news(query: str, max_results: int = 10) -> List[Dict[str, str]]:
    """
    Search Google News for articles matching a given query.
    """
    import requests
    from concurrent.futures import ThreadPoolExecutor
    from utils.cli_logger import logger
    
    print(f" [Google News] Searching for: {query}...")
    
    search_url = f"https://news.google.com/rss/search?q={query.replace(' ', '%20')}&hl=en-US&gl=US&ceid=US:en"

    try:
        response = requests.get(search_url, timeout=10)
        if response.status_code != 200:
            return []
        
        results = _parse_rss_content(response.text, max_results)
        
        urls_to_resolve = [result.url for result in results]
        with ThreadPoolExecutor() as executor:
            resolved_urls = list(executor.map(_resolve_google_news_url, urls_to_resolve))

        final_results = []
        for r, resolved in zip(results, resolved_urls):
            source = _extract_domain(resolved)
            result = {
                "title": r.title,
                "url": resolved,
                "published_date": r.published_date,
                "source": source
            }
            final_results.append(result)
            # Stream each news item to CLI in real-time
            logger.log_news_item(r.title, r.published_date[:20] if r.published_date else "", source)
            
        return final_results
        
    except Exception as e:
        print(f"Error searching Google News: {e}")
        return []

search_google_news_tool = StructuredTool.from_function(
    name="search_google_news",
    description=(
        "Search Google News for recent articles and current events. "
        "Useful for finding latest news on companies, earnings, or specific topics."
    ),
    func=_search_google_news,
)


def resolve_ticker(query: str) -> str:
    """
    Resolve a company name or query to a stock ticker symbol.
    
    Args:
        query: Company name (e.g., "Apple", "Tesla") or ticker.
        
    Returns:
        The resolved ticker symbol (e.g., "AAPL", "TSLA").
        Returns the original query (upper-cased) if resolution fails.
    """
    query = query.strip()
    
    # If it looks like a ticker (2-5 chars, all letters), assume it is one
    if query.isalpha() and 2 <= len(query) <= 5 and query.isupper():
        return query
        
    print(f" 🔍 Resolving ticker for '{query}'...")
    
    try:
        # Use DuckDuckGo to find the ticker
        search_query = f"stock ticker symbol for {query}"
        with DDGS() as ddgs:
            results = list(ddgs.text(search_query, max_results=1))
            
        if results:
            # Look for patterns like "AAPL" or "(AAPL)" in the title or snippet
            text = results[0]['title'] + " " + results[0]['body']
            
            # Regex for common ticker patterns: (AAPL), : AAPL, $AAPL
            # Updated to support longer tickers (e.g. NSE: DATAPATTNS is 10 chars)
            match = re.search(r'\b[A-Z]{2,12}\b', text)
            
            # Refined regex to prioritize parenthesized tickers which are common in search results
            # e.g. "Apple Inc. (AAPL)"
            explicit_match = re.search(r'\(([A-Z]{2,12})\)', text)
            if explicit_match:
                return explicit_match.group(1)
                
            # Fallback to finding the most likely capitalized word if it looks like a ticker
            # This is a heuristic; might need refinement.
            
            # Common words to ignore in stock search results
            ignore_words = {"NYSE", "NASDAQ", "STOCK", "SYMBOL", "PRICE", "QUOTE", "SHARE", "SHARES", "MARKET", "INDEX"}
            
            # Let's try a direct search for the symbol
            for word in text.split():
                # Strip punctuation including colons from the edges
                clean_word = word.strip('()[]{},.:;')
                
                # Handle EXCHANGE:TICKER format (e.g., NYSE:MRV)
                if ':' in clean_word:
                    parts = clean_word.split(':')
                    # If it's EXCHANGE:TICKER, use the ticker part
                    if len(parts) == 2 and parts[1]:
                        # Check if the ticker part is valid
                        ticker_part = parts[1].strip('()[]{},.:;')
                        if ticker_part.isupper() and 2 <= len(ticker_part) <= 12:
                            # If the first part is an exchange to ignore, definitely use the second part
                            if parts[0] in ignore_words:
                                return ticker_part
                            # Otherwise, use ticker_part if it's longer/better than nothing
                            clean_word = ticker_part

                if (clean_word.isupper() and 
                    2 <= len(clean_word) <= 12 and 
                    clean_word not in ignore_words and
                    not any(char.isdigit() for char in clean_word)): # Tickers usually don't have digits (except some international)
                     return clean_word
                     
    except Exception as e:
        print(f"Warning: Ticker resolution failed: {e}")
        
    return query.upper()


