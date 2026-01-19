# Equity Trigger Analysis Skill

Use this skill when you already have fundamental metrics, technicals, risk metrics, and news signals for a stock
and need to map them into GREEN FLAGS, RED FLAGS, and a VERDICT.

## Data Quality Context

**IMPORTANT**: You will receive a DATA QUALITY CONTEXT section that includes:
- **Completeness Score** (0-100%): Percentage of available metrics
- **Confidence Level** (High/Medium/Low): Overall data reliability
- **Missing Critical Metrics**: List of unavailable essential data points

**Rules for Handling Missing Data:**
1. If Completeness Score < 70%, you MUST add a "⚠️ Data Quality Warning" section to your report
2. If critical metrics are missing, explicitly state limitations in your verdict
3. Do NOT make strong Buy/Sell recommendations with Low confidence data
4. Use alternative signals when primary metrics are unavailable (e.g., use news sentiment if financials are incomplete)
5. Always acknowledge data gaps in your analysis

---

## 🏦 HEDGE FUND SIGNAL CATEGORIES

All signals are organized into 7 professional categories used by institutional investors:

| Category | Focus | Key Question |
|----------|-------|--------------|
| **Fundamental** | Core business health | Is the company profitable and growing? |
| **Valuation** | Price vs. value | Is the stock cheap or expensive? |
| **Quality** | Financial strength | Is the balance sheet solid? |
| **Momentum** | Price/volume trends | Is the stock trending up or down? |
| **Risk** | Downside exposure | How volatile is the stock? |
| **Sentiment** | News & perception | What's the market narrative? |
| **Dividend** | Income health | Is the dividend safe and growing? |

---

## 1️⃣ FUNDAMENTAL SIGNALS

**Focus**: Core business profitability, growth, and operational efficiency.

### Growth & Profitability Metrics
- `revenue_growth`: Revenue growth rate (decimal)
- `profit_margins`: Profit margins (decimal)
- `return_on_equity` (ROE): Efficiency of equity
- `return_on_capital_employed` (ROCE): Capital efficiency
- `free_cash_flow` (FCF): Cash generation
- `operating_cashflow`: Operating cash generation

### Analysis Rules

**Revenue Growth**
- 🟢 Strong Growth: `revenue_growth > 0.15` (>15% growth)
- 🟢 Moderate Growth: `0.05 < revenue_growth <= 0.15`
- 🟡 Flat: `-0.05 <= revenue_growth <= 0.05`
- 🚩 Declining: `revenue_growth < -0.05`

**Profit Margins**
- 🟢 Strong Margins: `profit_margins > 0.15` (>15%)
- 🟡 Moderate: `0.05 <= profit_margins <= 0.15`
- 🚩 Low/Negative: `profit_margins < 0.05`

**Return on Equity (ROE)**
- 🟢 Strong: `return_on_equity > 0.15` (>15%)
- 🟡 Acceptable: `0.08 <= return_on_equity <= 0.15`
- 🚩 Weak: `return_on_equity < 0.08`

**Return on Capital Employed (ROCE)**
- 🟢 Excellent: `return_on_capital_employed > 0.20` (>20%)
- 🟢 Good: `0.15 < ROCE <= 0.20`
- 🟡 Acceptable: `0.10 <= ROCE <= 0.15`
- 🚩 Weak: `ROCE < 0.10`

**Free Cash Flow (FCF)**
- 🟢 Positive FCF: `free_cash_flow > 0`
- 🚩 Negative FCF: `free_cash_flow < 0` (Cash burn)

**Revenue Trend** (from `financial_trends`)
- 🟢 Growing: `revenue_trend == "increasing"`
- 🚩 Shrinking: `revenue_trend == "decreasing"`

**Net Profit (Net Income) Trend**
- 🟢 Improving: `net_income_trend == "increasing"`
- 🚩 Declining: `net_income_trend == "decreasing"`

---

## 2️⃣ VALUATION SIGNALS

**Focus**: Is the stock fairly priced relative to its earnings and growth?

### Valuation Metrics
- `trailing_pe`: Price-to-Earnings (trailing 12 months)
- `forward_pe`: Price-to-Earnings (forward estimate)
- `peg_ratio`: Price/Earnings to Growth ratio
- `price_to_book`: Price-to-Book ratio

### Analysis Rules

**P/E Ratio (Trailing)**
- 🟢 Undervalued: `trailing_pe < 15`
- 🟡 Fair Value: `15 <= trailing_pe <= 25`
- 🚩 Overvalued: `trailing_pe > 25`
- ⚠️ Extreme: `trailing_pe > 50` or negative (loss-making)

**PEG Ratio** (P/E divided by Growth Rate)
- 🟢 Attractive: `peg_ratio < 1.0` (Undervalued relative to growth)
- 🟡 Fair: `1.0 <= peg_ratio <= 2.0`
- 🚩 Expensive: `peg_ratio > 2.0`

**Forward PE vs. Trailing PE**
- 🟢 PE Re-rating Potential: `forward_pe < trailing_pe` (Earnings expected to grow)
- 🚩 Deteriorating: `forward_pe > trailing_pe` (Earnings declining)

**Price-to-Book**
- 🟢 Value Stock: `price_to_book < 1.5`
- 🟡 Fair: `1.5 <= price_to_book <= 3.0`
- 🚩 Growth Premium: `price_to_book > 3.0` (Priced for high growth)

---

## 3️⃣ QUALITY SIGNALS

**Focus**: Financial stability, capital structure, and balance sheet strength.

### Quality Metrics
- `debt_to_equity`: Leverage ratio
- `total_debt`: Total debt amount
- `icr_analysis`: Interest Coverage Ratio
- `financial_trends`: Debt, CapEx, Retained Earnings, FCF trends

### Analysis Rules

**Debt-to-Equity Ratio**
- 🟢 Low Leverage: `debt_to_equity < 0.5`
- 🟡 Moderate: `0.5 <= debt_to_equity <= 1.5`
- 🚩 High Leverage: `debt_to_equity > 1.5`
- 💀 Dangerous: `debt_to_equity > 2.0`

**Interest Coverage Ratio (ICR)**
- 🟢 Exceptional: `icr_value > 10.0`
- 🟢 Strong: `icr_value > 3.0` (Comfortably covers interest)
- 🟡 Acceptable: `2.0 <= icr_value <= 3.0`
- 🟡 Fair: `1.5 <= icr_value < 2.0`
- 🚩 Risk: `1.0 <= icr_value < 1.5` (Increasing default risk)
- 💀 High Risk: `icr_value < 1.0` (Unable to cover interest)
- 🟢 Improving ICR Trend: `icr_trend_yoy == "increasing"`

**Debt Trend**
- 🟢 Deleveraging: `debt_trend == "decreasing"`
- 🚩 Increasing Debt: `debt_trend == "increasing"` (Red Flag unless matched by revenue growth)

**CapEx Trend**
- 🟢 Growth Investment: `capex_trend == "increasing"`
- 🟢 **Best Case**: CapEx increasing + Debt decreasing (Self-funded growth)
- 🚩 **Risky**: CapEx increasing + Debt increasing (Leveraged expansion)

**Retained Earnings Trend**
- 🟢 Growing: `retained_earnings_trend == "increasing"` (Reinvesting profits)
- 🚩 Declining: `retained_earnings_trend == "decreasing"` (Burning reserves)

**FCF Trend**
- 🟢 Improving: `fcf_trend == "increasing"` (Positive for dividends/debt paydown)
- 🚩 Declining: `fcf_trend == "decreasing"` (Cash generation weakening)

---

## 4️⃣ MOMENTUM SIGNALS

**Focus**: Price action, trend strength, and trading volume patterns.

### Momentum Metrics (from `technicals`)
- `rsi`: Relative Strength Index
- `macd` / `macd_signal`: MACD indicator
- `sma_50` / `sma_200`: Moving averages
- `sma_200_weeks`: 200-week SMA (long-term trend)
- `volume_trends`: Volume patterns

### Analysis Rules

**RSI (Relative Strength Index)**
- 🚩 Overbought: `rsi > 70` (Caution: potential pullback)
- 🟢 Oversold: `rsi < 30` (Potential buying opportunity)
- 🟡 Neutral: `30 <= rsi <= 70`

**Moving Averages (SMA)**
- 🟢 Bullish Trend: `current_price > sma_200`
- 🚩 Bearish Trend: `current_price < sma_200`
- 🟢 **Golden Cross**: `sma_50` crosses above `sma_200` (Strong Buy Signal)
- 🚩 **Death Cross**: `sma_50` crosses below `sma_200` (Strong Sell Signal)

**200-Week SMA (Long-Term Trend)**
- 🟢 **Buying Opportunity**: `current_price < sma_200_weeks` (Historically strong entry point)
- 🚩 **Extended**: `current_price > sma_200_weeks` (Potential pullback risk)

**MACD**
- 🟢 Bullish: `macd > macd_signal`
- 🚩 Bearish: `macd < macd_signal`

**Volume Trends** (from `volume_trends`)
- 🟢 Volume Spike: `volume_spike == True` (High interest, potential breakout)
- 🟢 Increasing Volume: `volume_trend == "increasing"` (Growing interest)
- 🚩 Decreasing Volume: `volume_trend == "decreasing"` (Declining interest)

---

## 5️⃣ RISK SIGNALS

**Focus**: Volatility, downside exposure, and risk-adjusted returns.

### Risk Metrics (from `risk_metrics`)
- `volatility_annualized`: Annualized volatility
- `max_drawdown`: Maximum peak-to-trough decline
- `sharpe_ratio`: Risk-adjusted returns
- `beta`: Market sensitivity
- `value_at_risk_95`: VaR at 95% confidence

### Analysis Rules

**Sharpe Ratio** (Risk-adjusted return per unit of volatility)
- 🟢 Excellent: `sharpe_ratio > 2.0`
- 🟢 Good: `1.0 < sharpe_ratio <= 2.0`
- 🟡 Acceptable: `0.0 < sharpe_ratio <= 1.0`
- 🚩 Poor: `sharpe_ratio < 0.0` (Returns less than risk-free rate)

**Volatility (Annualized)**
- 🟢 Low Volatility: `volatility_annualized < 0.25` (<25%)
- 🟡 Moderate: `0.25 <= volatility_annualized <= 0.40`
- 🚩 High Volatility: `volatility_annualized > 0.40` (>40%)

**Max Drawdown**
- 🟢 Low Drawdown: `max_drawdown > -0.20` (Lost <20% at worst)
- 🟡 Moderate: `-0.20 >= max_drawdown > -0.40`
- 🚩 High Risk: `max_drawdown <= -0.40` (Lost >40% at some point)
- 💀 Severe: `max_drawdown < -0.50` (Lost >50%)

**Beta** (Market sensitivity)
- 🟢 Low Volatility: `beta < 1.0` (Less volatile than market)
- 🟡 Market-like: `1.0 <= beta <= 1.5`
- 🚩 High Volatility: `beta > 1.5` (More volatile than market)
- 💀 Very High Risk: `beta > 2.0`

**Value at Risk (VaR 95%)**
- 🟢 Low Risk: `value_at_risk_95 > -0.02` (Worst day likely <2% loss)
- 🟡 Moderate: `-0.02 >= value_at_risk_95 > -0.04`
- 🚩 High Risk: `value_at_risk_95 <= -0.04` (Expect >4% loss on bad days)

---

## 6️⃣ SENTIMENT SIGNALS

**Focus**: News, management quality, ESG, legal issues, and market perception.

### Sentiment Sources
- `check_strategic_triggers`: News-based signals
- `search_google_news`: Recent news articles

### GREEN FLAG Keywords
**Performance & Growth:**
- "beat", "outperform", "strong results", "exceeded expectations"
- "expansion", "new markets", "new clients", "growth acceleration"

**Management & Governance:**
- "visionary leadership", "track record", "shareholder-friendly"
- "strong corporate governance", "transparent"

**Strategic & Industry:**
- "industry tailwind", "sector tailwind", "favorable regulation"
- "market leader", "competitive moat", "first mover"

**ESG & Brand:**
- "ESG leader", "sustainable", "ethical", "strong brand loyalty"

**Investor Relations:**
- 🟢 Recent (last 3-6 months) "investor presentation", "earnings call", or "annual report" found
- 🟢 Forward guidance with positive revenue/earnings projections
- 🟢 Clear expansion plans, new market entry, or product pipeline

### RED FLAG Keywords
**Performance Issues:**
- "miss", "weak", "disappoint", "below expectations", "guidance cut"

**Legal & Regulatory:**
- "investigation", "lawsuit", "legal proceeding", "regulatory action"
- "SEC inquiry", "audit issues", "restatement"

**Management Concerns:**
- "CEO resignation", "management reshuffle", "insider selling"
- "audit committee change", "toxic culture", "turnover"

**Financial Red Flags:**
- "promoter pledge", "pledged shares", "share dilution"
- "debt default", "credit downgrade", "covenant breach"

**Macro & External:**
- "supply chain disruption", "inflationary pressure"
- "currency headwinds", "geopolitical risk"

**Investor Relations Red Flags:**
- 🚩 No recent investor documents (>1 year old)
- 🚩 Lowered guidance, cautious outlook
- 🚩 Hedging language: "challenging environment", "uncertainty"
- 🚩 Vague/missing future plans

---

## 7️⃣ DIVIDEND SIGNALS

**Focus**: Dividend sustainability, yield attractiveness, and payout trends.

### Dividend Metrics
- `dividend_yield`: Annual dividend yield
- `payout_ratio`: Percentage of earnings paid as dividends
- `dividend_trends`: Historical dividend pattern

### Analysis Rules

**Dividend Yield**
- 🟢 Attractive: `dividend_yield > 0.03` (>3%)
- 🟡 Moderate: `0.01 <= dividend_yield <= 0.03`
- 🟡 Low/None: `dividend_yield < 0.01`

**Payout Ratio**
- 🟢 Sustainable: `payout_ratio < 0.50` (<50% - room for growth)
- 🟡 Moderate: `0.50 <= payout_ratio <= 0.70`
- 🚩 High: `0.70 < payout_ratio <= 0.90` (Limited flexibility)
- 💀 Risky: `payout_ratio > 0.90` (Potential dividend cut)

**Dividend Trend** (from `dividend_trends`)
- 🟢 Growing Dividends: `dividend_trend == "increasing"` (Shareholder-friendly, stable cash flow)
- 🟡 Stable: `dividend_trend == "stable"`
- 🚩 Declining: `dividend_trend == "decreasing"` (Possible cash flow issues)

---

## 📊 OUTPUT FORMAT

Structure your final analysis as:

### 1. Executive Summary (1 paragraph)
   - Summarize the company's current state with key metrics.

### 2. Signal Dashboard by Category

**Format each signal as: `[CATEGORY] Signal Name: Value → Interpretation`**

Example:
```
🟢 [FUNDAMENTAL] Revenue Growth: +18% → Strong growth
🟢 [VALUATION] PEG Ratio: 0.8 → Undervalued relative to growth
🚩 [RISK] Beta: 1.8 → High volatility vs. market
🟢 [MOMENTUM] RSI: 42 → Neutral, room to run
🚩 [QUALITY] Debt/Equity: 1.9 → High leverage
🟢 [DIVIDEND] Yield: 3.2% → Attractive income
🟢 [SENTIMENT] News: Beat earnings expectations (Source: reuters.com)
```

### 3. 🟢 GREEN FLAGS
   - Group by category: [FUNDAMENTAL], [VALUATION], [QUALITY], [MOMENTUM], [RISK], [SENTIMENT], [DIVIDEND]
   - Include specific values, dates/quarters, and news sources

### 4. 🚩 RED FLAGS
   - Group by category: [FUNDAMENTAL], [VALUATION], [QUALITY], [MOMENTUM], [RISK], [SENTIMENT], [DIVIDEND]
   - Include specific values, dates/quarters, and news sources

### 5. 💡 VERDICT
   - **Buy** / **Sell** / **Hold**
   - Justify with mix of all categories
   - **ALWAYS cite dates and specific quarters for trends**
