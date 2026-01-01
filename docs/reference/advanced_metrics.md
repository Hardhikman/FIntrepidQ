# Advanced Financial Metrics - Multi-Agent System

## Overview

The IntrepidQ Equity v3.0 system implements a comprehensive suite of advanced financial metrics through a **4-agent pipeline**. All metrics are automatically collected, validated, and analyzed with timeline tracking.

## System Architecture

```
Data Collection Agent → Validation Agent → Analysis Agent → Synthesis Agent
        ↓                      ↓                   ↓                ↓
  All Metrics Below      Quality Check      Investment Thesis   Final Report
```

## 🏦 Hedge Fund Signal Categories

All metrics are organized into **7 professional hedge fund categories**:

| # | Category | Focus | Key Metrics |
|---|----------|-------|-------------|
| 1 | **FUNDAMENTAL** | Core business health | Revenue Growth, ROE, ROCE, FCF, Margins |
| 2 | **VALUATION** | Price vs. value | P/E, PEG, Price/Book, Forward PE |
| 3 | **QUALITY** | Financial strength | Debt/Equity, ICR, Debt Trend, FCF Trend |
| 4 | **MOMENTUM** | Price/volume trends | RSI, MACD, SMA-50/200, Volume |
| 5 | **RISK** | Downside exposure | Beta, VaR, Sharpe, Volatility, Drawdown |
| 6 | **SENTIMENT** | News & perception | Strategic News, ESG, Management, Legal |
| 7 | **DIVIDEND** | Income health | Yield, Payout Ratio, Dividend Trend |

---

## Implemented Metrics

### 1. **Technical Indicators** ✅ Complete

Calculated from 2-year price history using pandas:

| Indicator | Description | Implementation |
|-----------|-------------|----------------|
| **RSI (14)** | Relative Strength Index | Momentum oscillator (0-100 scale) |
| **MACD** | Moving Average Convergence Divergence | Trend-following momentum |
| **MACD Signal** | 9-day EMA of MACD | Crossover signal line |
| **SMA 50** | 50-day Simple Moving Average | Medium-term trend |
| **SMA 200** | 200-day Simple Moving Average | Long-term trend |
| **SMA 200W** | 200-week Simple Moving Average | Macro-cycle baseline |
| **Golden Cross** | SMA 50 crosses above SMA 200 | Bullish signal detection |
| **Death Cross** | SMA 50 crosses below SMA 200 | Bearish signal detection |

**Signals Generated:**
- RSI > 70 → Overbought warning
- RSI < 30 → Oversold signal
- Golden Cross → Strong bullish indicator
- Death Cross → Strong bearish indicator
- MACD Crossover → Trend change detection
- Price < SMA 200W → Historically strong buying opportunity

### 2. **Risk Metrics** ✅ Complete

Calculated from historical price data:

| Metric | Description | Implementation |
|--------|-------------|----------------|
| **Volatility** | Annualized standard deviation | Daily returns × √252 |
| **Max Drawdown** | Largest peak-to-trough decline | Cumulative max calculation |
| **Sharpe Ratio** | Risk-adjusted return | (Return - Risk-free rate) / Volatility |
| **Beta** | Systematic risk vs market | From yfinance |
| **VaR (95%)** | Value at Risk | 5th percentile of daily returns |

**Use Cases:**
- High Sharpe (>1.5) → Good risk-adjusted returns
- High volatility → Higher risk assessment
- Large max drawdown → Significant downside risk

### 3. **Volume Analysis** ✅ Complete

Tracks trading volume patterns over multiple timeframes:

| Metric | Description | Formula |
|--------|-------------|---------|
| **Latest Volume** | Current day's volume | From latest trading data |
| **Volume MA 10** | 10-day moving average | Short-term volume trend |
| **Volume MA 50** | 50-day moving average | Medium-term volume trend |
| **Volume MA 200** | 200-day moving average | Long-term volume baseline |
| **Volume MA 200W** | 200-week moving average | Mega-cap volume trend |
| **Volume Spike** | Abnormal volume detection | Volume > 1.5× MA(50) |
| **Volume Trend** | Direction of volume change | MA(10) vs MA(50) comparison |

**Trading Signals:**
- Volume spike + price increase → Strong bullish momentum
- Volume spike + price decrease → Potential capitulation/bottom
- Increasing volume → Growing market interest
- Decreasing volume → Weakening trend

### 4. **Dividend Tracking** ✅ Complete

Monitors dividend payments over 3-year history:

| Metric | Description | Timeline |
|--------|-------------|----------|
| **Dividend Yield** | Annual dividend / price | Current yield |
| **Dividend Payout** | Dividends / Earnings | Sustainability ratio |
| **Annual Dividends** | Total paid per year | Last 3 years |
| **Dividend Trend** | YoY growth pattern | Increasing/Decreasing/Stable |
| **Payout Ratio** | % of earnings as dividends | Safety/Sustainability check |

**Signals:**
- Increasing dividends → Shareholder-friendly, stable cash flow
- High yield (>4%) + growing → Income investment signal
- Decreasing dividends → Potential cash flow problems
- Payout ratio >100% → Unsustainable warning

### 5. **Quarterly Financial Trends** ✅ Complete

Tracks key metrics over 4 fiscal quarters **with specific dates**:

| Metric | Description | Timeline |
|--------|-------------|----------|
| **Revenue Quarters** | Quarterly revenue | Last 4 quarters with dates |
| **Debt Quarters** | Total debt levels | Last 4 quarters with dates |
| **CapEx Quarters** | Capital expenditure | Last 4 quarters with dates |
| **Retained Earnings** | Accumulated profits | Last 4 quarters with dates |
| **Net Income** | Quarterly net profit | Last 4 quarters + Trend |
| **Free Cash Flow** | Operating CF - CapEx | Last 4 quarters + Trend |
| **Quarter Dates** | Fiscal period labels | e.g., "2024-09-30" (Q3 2024) |

**Trend Analysis:**
- Revenue ↑ → Growth company
- Debt ↓ → Deleveraging, improving balance sheet
- CapEx ↑ → Expansion/growth investment
- Retained Earnings ↑ → Profit reinvestment
- Net Income ↑ → Improving profitability
- FCF ↑ → Better cash generation

### 6. **Solvency & Efficiency** ✅ Complete

| Metric | Description | Timeline |
|--------|-------------|----------|
| **ICR** | Interest Coverage Ratio | EBIT / Interest Expense |
| **ICR Trend** | YoY trend of ICR | Improving/Declining solvency |
| **ROCE** | Return on Capital Employed | EBIT / (Total Assets - Current Liab) |
| **ROA** | Return on Assets | Net Income / Total Assets |

**Solvency Signals:**
- ICR > 3.0 → Comfortably covers debt obligations
- ICR < 1.0 → High risk of default
- ROCE > 20% → Highly efficient capital allocation

### 7. **Qualitative Signals (Strategic Triggers)** ✅ Complete

**Strategic Correlation Analysis** (Self-Funded Growth Detection):

| Scenario | Signal | Interpretation |
|----------|--------|----------------|
| CapEx ↑ + Debt ↓ | 🟢 **BEST CASE** | Self-funded growth (strong) |
| CapEx ↑ + Debt ↑ | 🟡 Caution | Leveraged expansion (risky) |
| CapEx ↓ + Debt ↓ | ⚪ Neutral | Conservative/mature business |
| CapEx ↓ + Debt ↑ | 🚩 **RED FLAG** | Deteriorating financials |

**News-Based Red Flags:**
- **Legal/Audit**: Investigations, lawsuits, or audit committee changes.
- **Management**: Sudden CEO/CFO exits or leadership reshuffles.
- **Ownership**: Promoter share pledges or rapid reduction in stake.
- **Industry**: Sector-wide tailwinds or favorable regulatory shifts.

**Implementation:**
```python
if capex_trend == "increasing" and debt_trend == "decreasing":
    signal = "GREEN FLAG: Self-funded growth"
```

## Data Collection Implementation

All metrics are collected by the **Data Collection Agent** using:

### Primary Tool: `get_deep_financials`
```python
data = {
    # Fundamental Metrics
    "current_price", "market_cap", "pe_ratio", "forward_pe",
    "peg_ratio", "debt_to_equity", "revenue_growth",
    "profit_margins", "roe", "roa", "fcf", "dividend_yield",
    
    # Technical Indicators
    "technicals": {
        "rsi": 45.2,
        "macd": 2.3,
        "sma_50": 180.5,
        "sma_200": 175.2,
        "golden_cross": False,
        "death_cross": False
    },
    
    # Risk Metrics
    "risk_metrics": {
        "volatility": 0.28,
        "max_drawdown": -0.15,
        "sharpe_ratio": 1.8,
        "beta": 1.1,
        "var_95": -0.025
    },
    
    # Volume Trends
    "volume_trends": {
        "latest_volume": 50M,
        "avg_volume_10d": 48M,
        "avg_volume_50d": 45M,
        "volume_spike": True,
        "volume_trend": "increasing"
    },
    
    # Quarterly Trends (with dates)
    "financial_trends": {
        "quarter_dates": ["2024-09-30", "2024-06-30", ...],
        "revenue_quarters": [89.5B, 85.8B, ...],
        "debt_quarters": [45.2B, 47.1B, ...],
        "capex_quarters": [3.5B, 3.2B, ...],
        "retained_earnings_quarters": [125B, 120B, ...],
        "net_income_quarters": [15.2B, 14.8B, ...],
        "fcf_quarters": [18.5B, 17.2B, ...]
    },
    
    # ICR Analysis
    "icr_analysis": {
        "icr_value": 8.5,
        "icr_level": "strong",
        "icr_trend_yoy": "increasing"
    },
    
    # Dividend Trends
    "dividend_trends": {
        "dividend_years": [2024, 2023, 2022],
        "annual_dividends": [0.96, 0.92, 0.88],
        "dividend_trend": "increasing"
    }
}
```

## Validation System

The **Validation Agent** checks metric availability:

### Critical Metrics (Required for High Confidence)
- current_price
- market_cap
- revenue_growth
- profit_margins
- trailing_pe
- debt_to_equity
- free_cash_flow
- return_on_equity

### Optional Metrics (Nice to Have)
- forward_pe
- peg_ratio
- dividend_yield
- payout_ratio
- return_on_assets
- operating_cashflow

### Advanced Metrics (Enhanced Analysis)
- technicals
- risk_metrics
- financial_trends
- volume_trends
- dividend_trends

**Completeness Scoring:**
```
Score = (Available Metrics / Total Metrics) × 100%
Confidence = High (≥80%), Medium (≥60%), Low (<60%)
```

## Analysis Integration

The **Analysis Agent** uses all metrics via the `load_skill` tool:

**Skill Framework: equity_trigger_analysis**
- Interprets technical indicators
- Evaluates risk metrics
- Identifies volume patterns
- Analyzes quarterly trends
- Detects self-funded growth
- Generates red/green flags

## Report Output

The **Synthesis Agent** compiles a time-stamped report:

### Report Structure
```markdown
# TICKER - Equity Analysis Report

## Report Metadata
- Analysis Date: 2024-11-30
- Data Period: Q3 2024
- Fiscal Quarter: Q3 2024

## Executive Summary
- Revenue growth of 18.4% (Q3 2024)
- P/E ratio of 35.2 (Nov 2024)
- RSI: 45 (Neutral)
- Volume spike detected on 2024-11-28

## Technical & Risk Profile
- Volatility: 28% (High)
- Sharpe Ratio: 1.8 (Good)
- Max Drawdown: -15% (Moderate)
- RSI: 45 (Neutral territory)
- MACD: Bullish crossover

## Detailed Analysis
- Financial Health (with Q3 2024 data)
- Strategic Position
- Risks

## 🟢 GREEN FLAGS (by Category)
- [FUNDAMENTAL] CapEx increasing + Debt decreasing (Self-funded growth)
- [MOMENTUM] Volume spike on earnings beat
- [DIVIDEND] Dividend raised 4% YoY

## 🚩 RED FLAGS (by Category)
- [VALUATION] High valuation (P/E 35 vs industry 25)
- [RISK] Increasing volatility

## Verdict
Buy/Sell/Hold with reasoning
```

## Coverage Statistics

| Category | Metrics | Coverage |
|----------|---------|----------|
| **Fundamentals** | 13 metrics | 100% |
| **Technical Indicators** | 7 indicators | 100% |
| **Risk Metrics** | 4 metrics | 100% |
| **Volume Analysis** | 6 metrics | 100% |
| **Quarterly Trends** | 5 trends × 4 quarters | 100% |
| **Dividend Tracking** | 3 years history | 100% |
| **Total Metrics** | 45+ metrics | 100% |

## Usage

No changes needed to your workflow:

```bash
python mainpy analyze MSFT
```

The multi-agent system automatically:
1. **Collects** all metrics
2. **Validates** data completeness
3. **Analyzes** with AI
4. **Synthesizes** time-stamped report

## Technologies

- **yfinance**: Financial data API
- **pandas**: Data manipulation and calculations
- **numpy**: Mathematical operations (handled safely with eval context)
- **LangGraph**: Multi-agent orchestration
- **Google Gemini**: AI analysis

- **API Limits**: Depends on yfinance stability and DuckDuckGo rate limits.
- **Data Freshness**: Quarterly data depends on latest filing availability in APIs.

---

**Version**: 4.0 (Hedge Fund Signal Categories)  
**Status**: ✅ Production Ready  
**Last Updated**: 2025-12-20
