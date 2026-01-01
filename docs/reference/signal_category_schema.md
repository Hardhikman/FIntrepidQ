# Signal Category Schema

Quick-reference mapping of all metrics to their hedge fund categories.

## 🏦 Category → Metrics Mapping

### 1️⃣ FUNDAMENTAL (Core Business Health)

| Metric | Source Field | Signal Rules |
|--------|--------------|--------------|
| Revenue Growth | `revenue_growth` | 🟢 >15% Strong, 🚩 <-5% Declining |
| Profit Margins | `profit_margins` | 🟢 >15% Strong, 🚩 <5% Weak |
| ROE | `return_on_equity` | 🟢 >15% Strong, 🚩 <8% Weak |
| ROCE | `return_on_capital_employed` | 🟢 >20% Excellent, 🚩 <10% Weak |
| FCF | `free_cash_flow` | 🟢 Positive, 🚩 Negative |
| Revenue Trend | `financial_trends.revenue_trend` | 🟢 increasing, 🚩 decreasing |
| Net Income Trend | `financial_trends.net_income_trend` | 🟢 increasing, 🚩 decreasing |

---

### 2️⃣ VALUATION (Price vs. Value)

| Metric | Source Field | Signal Rules |
|--------|--------------|--------------|
| P/E (Trailing) | `trailing_pe` | 🟢 <15 Under, 🚩 >25 Over |
| P/E (Forward) | `forward_pe` | 🟢 forward < trailing |
| PEG Ratio | `peg_ratio` | 🟢 <1.0 Attractive, 🚩 >2.0 Expensive |
| Price/Book | `price_to_book` | 🟢 <1.5 Value, 🚩 >3.0 Growth Premium |

---

### 3️⃣ QUALITY (Financial Strength)

| Metric | Source Field | Signal Rules |
|--------|--------------|--------------|
| Debt/Equity | `debt_to_equity` | 🟢 <0.5 Low, 🚩 >1.5 High |
| ICR (Interest Coverage) | `icr_analysis.icr_value` | 🟢 >3.0 Strong, 🚩 <1.5 Risk |
| ICR Trend | `icr_analysis.icr_trend_yoy` | 🟢 increasing |
| Debt Trend | `financial_trends.debt_trend` | 🟢 decreasing, 🚩 increasing |
| CapEx Trend | `financial_trends.capex_trend` | 🟢 increasing (growth) |
| Retained Earnings | `financial_trends.retained_earnings_trend` | 🟢 increasing, 🚩 decreasing |
| FCF Trend | `financial_trends.fcf_trend` | 🟢 increasing, 🚩 decreasing |

---

### 4️⃣ MOMENTUM (Price/Volume Trends)

| Metric | Source Field | Signal Rules |
|--------|--------------|--------------|
| RSI (14) | `technicals.rsi` | 🚩 >70 Overbought, 🟢 <30 Oversold |
| MACD | `technicals.macd` | 🟢 > signal Bullish, 🚩 < signal Bearish |
| SMA 50 | `technicals.sma_50` | Price crossover signals |
| SMA 200 | `technicals.sma_200` | 🟢 Price > SMA, 🚩 Price < SMA |
| SMA 200-Week | `technicals.sma_200_weeks` | 🟢 Price < SMA (Buying opportunity) |
| Golden Cross | `sma_50 > sma_200` | 🟢 Strong Buy |
| Death Cross | `sma_50 < sma_200` | 🚩 Strong Sell |
| Volume Spike | `volume_trends.volume_spike` | 🟢 True = High interest |
| Volume Trend | `volume_trends.volume_trend` | 🟢 increasing, 🚩 decreasing |

---

### 5️⃣ RISK (Downside Exposure)

| Metric | Source Field | Signal Rules |
|--------|--------------|--------------|
| Sharpe Ratio | `risk_metrics.sharpe_ratio` | 🟢 >1.0 Good, 🚩 <0 Poor |
| Volatility | `risk_metrics.volatility_annualized` | 🟢 <25%, 🚩 >40% |
| Max Drawdown | `risk_metrics.max_drawdown` | 🟢 >-20%, 🚩 <-40% |
| Beta | `beta` | 🟢 <1.0 Low Vol, 🚩 >1.5 High Vol |
| VaR 95% | `risk_metrics.value_at_risk_95` | 🟢 >-2%, 🚩 <-4% |

---

### 6️⃣ SENTIMENT (News & Perception)

| Signal Type | Source | Keywords |
|-------------|--------|----------|
| **GREEN FLAGS** | `check_strategic_triggers` | beat, outperform, expansion, visionary, ESG leader, market leader |
| **RED FLAGS** | `check_strategic_triggers` | miss, lawsuit, investigation, CEO resignation, promoter pledge |
| Management | News | Track record, ethics, turnover |
| ESG | News | Sustainable, ethical, governance |
| Legal | News | Investigation, lawsuit, regulatory |
| Macro | News | Inflation, supply chain, interest rates |

---

### 7️⃣ DIVIDEND (Income Health)

| Metric | Source Field | Signal Rules |
|--------|--------------|--------------|
| Dividend Yield | `dividend_yield` | 🟢 >3% Attractive, 🟡 <1% Low |
| Payout Ratio | `payout_ratio` | 🟢 <50% Sustainable, 🚩 >90% Risky |
| Dividend Trend | `dividend_trends.dividend_trend` | 🟢 increasing, 🚩 decreasing |

---

## 📊 Data Source Summary

| Category | Primary Data Source |
|----------|---------------------|
| FUNDAMENTAL | `get_deep_financials` → yfinance fundamentals |
| VALUATION | `get_deep_financials` → yfinance ratios |
| QUALITY | `get_deep_financials` → balance sheet + trends |
| MOMENTUM | `get_deep_financials.technicals` → calculated from price history |
| RISK | `get_deep_financials.risk_metrics` → calculated from returns |
| SENTIMENT | `check_strategic_triggers` → DuckDuckGo + Google News |
| DIVIDEND | `get_deep_financials.dividend_trends` → yfinance dividends |
