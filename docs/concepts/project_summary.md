# IntrepidQ Equity Analysis - Project Summary

## 🎯 Project Overview
AI-powered **multi-agent** stock analysis system providing institutional-grade, time-stamped equity research reports.

## 🤖 Multi-Agent Architecture

```
Data Collection → Validation → Analysis → Synthesis
     ↓ (Abort)       ↓ (Review)      ↓          ↓
   on failure      conflicts     Skills    Compact Report
```

| Agent | Responsibility | Key Features |
|-------|----------------|--------------|
| Data Collection | Financials, News | **Retry logic**, API logging |
| Validation | Data quality | **Input validation**, Alpha Vantage fill |
| Analysis | Investment thesis | **7 hedge fund categories** |
| Synthesis | Final report | **Compact format** (~5 sections) |

## ✅ Feature Coverage

| Category | Coverage |
|----------|----------|
| Quantitative (P/E, Technicals, Risk, ICR) | 100% |
| Qualitative (Legal, Management, Industry) | 100% |
| Trigger Analysis (Debt, FCF, Pledges) | 100% |
| Data Validation | 100% |
| **Production Features** | 100% |

## 🛡️ Production Features (v4.3)

| Feature | Implementation |
|---------|----------------|
| Input Validation | `tools/validation.py` - SQL injection prevention |
| Retry Logic | `tenacity` decorators with exponential backoff |
| Structured Logging | JSON logs to `logs/` with rotation |
| Error Handling | Try/except in all graph nodes |
| Workflow Abort | Critical failures stop immediately |
| **Rust Acceleration** | `rust_finance/` - RSI, SMA, MACD, Volatility, Sharpe |

## 📁 File Structure (Lean)

```
utils/           (3 files)
├── config.py      # Config + LLM factory
├── cli_logger.py  # CLI + structured logging
└── models.py      # Pydantic models

tools/           (4 files)
├── definitions.py  # Tools with retry + Rust calls
├── validation.py   # Data + input validation
└── ...

agents/          (6 files)
├── graph.py        # LangGraph workflow + abort logic
└── [4 agents + chat]
```

## 📊 Report Format (Compact)

```markdown
# {TICKER} Analysis Report
**Date**: Dec 2024 | **Confidence**: High | **Data Period**: Q3 2024

## 💡 VERDICT: BUY
## 📊 Key Metrics by Category (FUNDAMENTAL, VALUATION, QUALITY, MOMENTUM, RISK, DIVIDEND)
## 🟢 GREEN FLAGS (by Hedge Fund Category)
## 🚩 RED FLAGS (by Hedge Fund Category)
## 📈 Investment Thesis
```

## 🚀 Usage

```bash
python chat.py analyze MSFT      # Analyze stock
python chat.py start             # Interactive chat
```

## 🛠️ Technologies

- **LangGraph** - Multi-agent orchestration
- **Google Gemini** - LLM (gemini-2.5-flash)
- **tenacity** - Retry logic
- **yfinance + Alpha Vantage** - Financial data
- **DDGS + Google News RSS** - News search
- **Rich** - CLI formatting

## 📝 Version History

**v4.2** (Jan 2026) - Hedge Fund Signal Categories
- ✅ 7 professional categories: FUNDAMENTAL, VALUATION, QUALITY, MOMENTUM, RISK, SENTIMENT, DIVIDEND
- ✅ Updated SKILL.md with institutional-grade signal definitions
- ✅ Enhanced prompts with category-based report structure

**v4.1** (Dec 20th 2025) - Qualitative & Solvency Deepening
- ✅ FCF Trend Tracking (QoQ & YoY)
- ✅ Interest Coverage Ratio (ICR) analysis
- ✅ ROCE & ROA implementation
- ✅ Enhanced Red Flag signals (Legal, Management, Promoter Pledges)
- ✅ Industry Tailwind detection

**v4.0** (Dec 2024) - Production Hardening
- ✅ Input validation with security checks
- ✅ Retry logic for API calls
- ✅ Structured JSON logging
- ✅ Workflow abort on critical failure
- ✅ Compact report format
- ✅ Lean file structure (5→3 utils files)

**v3.1** - Enhanced CLI Logging
**v3.0** - Multi-Agent Architecture
**v2.0** - Validation Agent

---
**Status**: ✅ Production Ready | **Version**: 4.2 | **Updated**: Jan 1, 2026
