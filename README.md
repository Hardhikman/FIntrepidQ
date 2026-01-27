# FIntrepidQ Equity Analysis

AI-powered multi-agent stock analysis system with institutional-grade equity research reports.

## Quick Start

```bash
# Install
pip install -r requirements.txt

# Set API keys in .env
GOOGLE_API_KEY=your_key
ALPHA_VANTAGE_API_KEY=your_key

# Analyze a stock
python chat.py analyze MSFT

# Interactive chat
python chat.py start
```

---

## 🏦 Hedge Fund Signal Categories (v4.3)

Reports are organized into **7 professional categories**:

| Category | Metrics |
|----------|---------|
| **FUNDAMENTAL** | Revenue, ROE, ROCE, FCF, Margins |
| **VALUATION** | P/E, PEG, Price/Book |
| **QUALITY** | Debt/Equity, ICR, Debt Trend |
| **MOMENTUM** | RSI, MACD, SMA, Volume |
| **RISK** | Beta, VaR, Sharpe, Volatility |
| **SENTIMENT** | News, ESG, Management, Legal |
| **DIVIDEND** | Yield, Payout Ratio, Trend |

---

## 🤖 4-Agent Pipeline

```
Data Collection → Validation → Analysis → Synthesis
     ↓               ↓            ↓           ↓
  Financials     Quality      Investment   Final
  & News         Check        Thesis       Report
```

| Agent | Role |
|-------|------|
| Data Collection | Financials (yfinance), News (Google/DDGS) |
| Validation | Completeness score, Alpha Vantage enrichment |
| Analysis | Investment thesis, Green/Red flags by category |
| Synthesis | Final time-stamped report |

---

## 📊 Features

**Quantitative**
- Fundamentals: P/E, ROE, ROCE, FCF, Margins, Revenue Growth
- Technicals: RSI, MACD, SMA (50/200), Golden/Death Cross
- Risk: Volatility, Sharpe, Beta, VaR 95%, Max Drawdown
- Trends: 4Q Revenue, Debt, CapEx, FCF with dates

**Qualitative**
- News with source attribution
- Management, ESG, Legal signals
- Industry tailwinds/headwinds

**Data Quality**
- Validation system (0-100% completeness)
- Confidence levels (High/Medium/Low)
- Human-in-the-loop verification

---

## 📁 Project Structure

```
FIntrepidQ/
├── agents/           # 4 agents + chat + graph
├── tools/            # Financial & news tools
├── context_engineering/
│   ├── prompts.py    # Agent prompts
│   ├── memory.py     # Database ops
│   └── skills/       # SKILL.md (signal rules)
├── utils/            # Config, logging, models
├── docs/             # Full documentation
└── chat.py           # CLI entry point
```

---

## ⚙️ Configuration

Edit `utils/config.py`:
- Model: `gemini-2.5-flash`
- Temperature: `0.0`
- Database retention: 3 reports/ticker

---

## 🛠️ Tech Stack

LangGraph • Google Gemini • **Pydantic** (type-safe models) • yfinance • Alpha Vantage • DuckDuckGo • SQLite • Rich CLI

---

## ⚠️ Disclaimer

Personal research tool for educational purposes only. Not investment advice.

---

**License**: MIT
