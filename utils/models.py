"""
Pydantic Models for FIntrepidQ Equity Analysis.
Provides type-safe data structures for financial data, technicals, and risk metrics.
"""

from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime


class Technicals(BaseModel):
    """Technical analysis indicators."""
    current_price: float | None = None
    sma_50: float | None = None
    sma_200: float | None = None
    sma_200_weeks: float | None = None
    rsi: float | None = None
    macd: float | None = None
    macd_signal: float | None = None


class RiskMetrics(BaseModel):
    """Risk and volatility metrics."""
    volatility_annualized: float | None = None
    max_drawdown: float | None = None
    sharpe_ratio: float | None = None
    value_at_risk_95: float | None = None


class QuarterlyTrends(BaseModel):
    """Quarterly financial trends."""
    quarter_dates: list[str] = []
    revenue_quarters: list[float | None] = []
    debt_quarters: list[float | None] = []
    capex_quarters: list[float | None] = []
    retained_earnings_quarters: list[float | None] = []
    net_income_quarters: list[float | None] = []
    revenue_trend_qoq: str = "unknown"
    debt_trend_qoq: str = "unknown"
    capex_trend_qoq: str = "unknown"
    retained_earnings_trend_qoq: str = "unknown"
    net_income_trend_qoq: str = "unknown"


class AnnualTrends(BaseModel):
    """Annual financial trends."""
    year_dates: list[str] = []
    revenue_annual: list[float | None] = []
    debt_annual: list[float | None] = []
    capex_annual: list[float | None] = []
    retained_earnings_annual: list[float | None] = []
    net_income_annual: list[float | None] = []
    total_assets_annual: list[float | None] = []
    revenue_trend_yoy: str = "unknown"
    debt_trend_yoy: str = "unknown"
    capex_trend_yoy: str = "unknown"
    retained_earnings_trend_yoy: str = "unknown"
    net_income_trend_yoy: str = "unknown"
    assets_trend_yoy: str = "unknown"


class FinancialTrends(BaseModel):
    """Combined quarterly and annual trends."""
    quarterly: QuarterlyTrends | None = None
    annual: AnnualTrends | None = None


class VolumeTrends(BaseModel):
    """Volume analysis metrics."""
    latest_volume: int | None = None
    avg_volume_10d: int | None = None
    avg_volume_50d: int | None = None
    avg_volume_200d: int | None = None
    volume_spike: bool = False
    volume_trend: str = "unknown"


class DividendTrends(BaseModel):
    """Dividend analysis metrics."""
    annual_dividends: list[float] = []
    dividend_years: list[str] = []
    dividend_trend: str = "unknown"


class FinancialData(BaseModel):
    """
    Complete financial data for a ticker.
    Mirrors the structure returned by _get_deep_financials().
    """
    ticker: str
    
    # Basic Info
    current_price: float | None = None
    market_cap: int | None = None
    sector: str | None = None
    industry: str | None = None
    
    # Growth & Margins
    revenue_growth: float | None = None
    profit_margins: float | None = None
    
    # Valuation
    trailing_pe: float | None = None
    forward_pe: float | None = None
    peg_ratio: float | None = None
    price_to_book: float | None = None
    
    # Dividends
    dividend_yield: float | None = None
    payout_ratio: float | None = None
    
    # Returns
    return_on_equity: float | None = None
    return_on_assets: float | None = None
    return_on_capital_employed: float | None = None
    
    # Risk
    beta: float | None = None
    
    # Debt & Cash
    debt_to_equity: float | None = None
    total_debt: int | None = None
    free_cash_flow: int | None = None
    operating_cashflow: int | None = None
    
    # Nested metrics
    technicals: Technicals | None = None
    risk_metrics: RiskMetrics | None = None
    financial_trends: FinancialTrends | None = None
    volume_trends: VolumeTrends | None = None
    dividend_trends: DividendTrends | None = None
    
    class Config:
        # Allow extra fields that might come from yfinance
        extra = "ignore"


class DataCollectionResult(BaseModel):
    """Result from data collection agent."""
    ticker: str
    raw_output: str = ""
    financial_data: FinancialData | None = None


class ValidationResult(BaseModel):
    """Result from validation agent."""
    ticker: str
    validation_report: str = ""
    completeness_score: float = 0.0
    confidence_level: Literal["High", "Medium", "Low"] = "Low"
    conflicts: list = []
    enriched_data: FinancialData | None = None
    filled_metrics: list[str] = []


class AnalysisResult(BaseModel):
    """Result from analysis agent."""
    ticker: str
    analysis_output: str = ""
