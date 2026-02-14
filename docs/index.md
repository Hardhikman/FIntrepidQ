# Documentation Index

Welcome to the FIntrepidQ Equity Analysis documentation. This multi-agent system provides comprehensive, time-stamped equity research reports.

## 📚 Documentation Files

### Getting Started
- **[README.md](../README.md)** - Installation, quick start, and overview
- **[project_summary.md](concepts/project_summary.md)** - Complete project overview

### Multi-Agent System
- **[architecture.md](concepts/architecture.md)** - Agent pipeline, file structure, production features
- **[validation_agent.md](reference/validation_agent.md)** - Data quality validation and confidence scoring

### Features
- **[Sector Comparison](guides/walkthrough.md#sector-comparison-analysis)** - **NEW:** Peer benchmarking and industry averages
- **[advanced_metrics.md](reference/advanced_metrics.md)** - Volume trends, ICR, ROCE, VaR, and FCF analysis
- **[signal_category_schema.md](reference/signal_category_schema.md)** - 7 hedge fund signal categories mapping
- **[walkthrough.md](guides/walkthrough.md)** - Feature walkthrough and usage examples

### Operations
- **[chat_operations.md](guides/chat_operations.md)** - Interactive chat guide
- **[WhatsApp Integration](guides/whatsapp_integration.md)** - **NEW:** Bot mode, mobile analysis, and setup
- **[database_operations.md](guides/database_operations.md)** - Database management guide

### Technical
- **[gap_analysis.md](planning/gap_analysis.md)** - Requirements coverage assessment

## 🤖 Multi-Agent Pipeline

```
Data Collection → Validation → Analysis → Synthesis → Compact Report
        ↓              ↓           ↓           ↓
    (Abort on    (Human Review  (Skills)   (5 sections)
     failure)     if conflicts)
```

| Agent | Responsibility |
|-------|----------------|
| Data Collection | Financials (yfinance), News (DDGS, Google RSS) |
| Validation | Completeness score, Alpha Vantage enrichment |
| Analysis | Investment thesis, Red/Green flags using 7 hedge fund categories (FUNDAMENTAL, VALUATION, QUALITY, MOMENTUM, RISK, SENTIMENT, DIVIDEND) |
| Synthesis | Compact report with Key Metrics table and **Sector Benchmarks** using the `/compare` command |

## 🛡️ Production Features

| Feature | Status |
|---------|--------|
| Input Validation | ✅ Ticker sanitization, SQL injection prevention |
| Retry Logic | ✅ Exponential backoff with tenacity |
| Structured Logging | ✅ JSON logs to `logs/` directory |
| Error Handling | ✅ Graceful degradation in all graph nodes |
| Workflow Abort | ✅ Stop on critical failures (API quota) |
| **Rust Acceleration** | ✅ High-performance calculations via `rust_finance` |

## 🦀 Rust Acceleration (v4.3)

Performance-critical calculations use the `rust_finance` library:

| Function | Rust Module |
|----------|-------------|
| RSI, SMA, MACD | `technicals` |
| Volatility, Sharpe, VaR, Max Drawdown | `risk` |
| Trend Detection | `utils` |

## 🚀 Quick Start

```bash
# Analyze a stock
python chat.py analyze MSFT

# Interactive chat
python chat.py start
```

## 📁 File Structure (Lean)

```
utils/
├── config.py      # Config + LLM factory
├── cli_logger.py  # CLI + file logging
└── models.py      # Pydantic models

tools/
├── definitions.py  # Tools with retry
├── validation.py   # Data + input validation
└── ...

agents/
├── graph.py        # LangGraph workflow
└── [4 agents]

rust_finance/       # Rust library (PyO3)
├── src/risk.rs     # Volatility, Sharpe, VaR
├── src/technicals.rs  # RSI, SMA, MACD
└── src/utils.rs    # Trend detection
```

See [architecture.md](concepts/architecture.md) for full details.
