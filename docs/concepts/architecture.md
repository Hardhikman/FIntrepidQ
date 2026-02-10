# Multi-Agent System Architecture

The FIntrepidQ Equity Analysis system uses a **4-agent pipeline** orchestrated by LangGraph.

## Agent Pipeline
```
┌─────────────────────┐
│  Data Collection    │ → Financials, News, Web Search
│  Agent              │
└──────────┬──────────┘
           ↓ (Aborts on critical failure)
┌─────────────────────┐
│  Validation Agent   │ → Completeness Score (0-100%), Confidence Level
└──────────┬──────────┘
           ↓ (Human Review if conflicts)
┌─────────────────────┐
│  Analysis Agent     │ → Investment Thesis, Red/Green Flags, Verdict
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Synthesis Agent    │ → Final Compact Report
└─────────────────────┘
```

## Agent Responsibilities

1. **Data Collection Agent** (`agents/data_agent.py`)
   - Tools: `get_deep_financials`, `check_strategic_triggers`, `search_web`, `search_google_news`, `get_competitors`, `get_sector_metrics`
   - Gathers comprehensive data from multiple sources
   - **Retry logic** with exponential backoff for transient failures
   - **API logging** to `logs/api_calls.log`

2. **Validation Agent** (`agents/validation_agent.py`)
   - Validates data completeness using `tools/validation.py`
   - **Input validation** with SQL injection protection
   - Fetches Alpha Vantage data to fill missing metrics
   - Assigns confidence levels (High/Medium/Low)

3. **Analysis Agent** (`agents/analysis_agent.py`)
   - Tool: `load_skill` for analysis frameworks
   - Generates the **full structured report** using the specialized `equity_trigger_analysis` skill
   - Populates Metrics Tables and Risk Profiles using precise mathematical rules
   - Identifies red flags and green flags using **7 hedge fund categories**: FUNDAMENTAL, VALUATION, QUALITY, MOMENTUM, RISK, SENTIMENT, DIVIDEND

4. **Synthesis Agent** (`agents/synthesis_agent.py`)
   - Acts as **Lead Strategist & Editor**
   - Finalizes metadata and integrates **Data Quality** metrics from the Validation phase
   - Cross-references analysis with raw data to ensure 100% precision
   - Performs final polish for professional tone and brevity

## File Structure

```
fintrepidq_equity/
├── agents/
│   ├── graph.py           # LangGraph workflow (4 agents + abort logic)
│   ├── data_agent.py      # Data collection
│   ├── validation_agent.py
│   ├── analysis_agent.py
│   ├── synthesis_agent.py
│   └── chat_agent.py      # Interactive chat
├── tools/
│   ├── definitions.py     # Tool implementations (retry + logging)
│   ├── validation.py      # Data + input validation
│   ├── alpha_vantage_client.py
│   └── chat_tools.py
├── utils/
│   ├── config.py          # Config + LLM factory
│   ├── cli_logger.py      # CLI output + structured file logging
│   └── models.py          # Pydantic models
├── context_engineering/
│   ├── prompts.py         # Agent prompts
│   ├── memory.py          # Database operations
│   └── skills/            # Analysis frameworks
├── rust_finance/          # 🦀 Rust acceleration library
│   ├── src/risk.rs        # Volatility, Sharpe, VaR, Max Drawdown
│   ├── src/technicals.rs  # RSI, SMA, MACD
│   └── src/utils.rs       # Trend detection
├── logs/                  # Structured JSON logs
│   ├── analysis.log
│   ├── api_calls.log
│   └── errors.log
└── chat.py                # Main CLI entry point
```

## Production Features

| Feature | Implementation |
|---------|----------------|
| **Input Validation** | `tools/validation.py` - ticker sanitization, SQL injection prevention |
| **Retry Logic** | `tenacity` decorators in `tools/definitions.py` |
| **Structured Logging** | JSON logs with rotation in `utils/cli_logger.py` |
| **Error Handling** | Try/except in all graph nodes with graceful degradation |
| **Workflow Abort** | Critical failures (API quota) stop workflow immediately |

## CLI Logging (`utils/cli_logger.py`)

The system provides two types of logging:

### 1. Rich CLI Output
- **Progress Table**: Tracks all 4 phases with status icons and timing
- **Phase Spinners**: Animated feedback during long operations
- **Financial Data Table**: Real-time display of collected metrics

### 2. Structured File Logging
- **JSON format** for production debugging
- **Rotating files** (10MB max, 5 backups)
- **Specialized loggers**: `analysis_logger`, `api_logger`, `error_logger`

## Data Models (`utils/models.py`)

| Model | Purpose |
|-------|---------|
| `Technicals` | RSI, SMA 50/200, SMA 200 weeks, MACD |
| `RiskMetrics` | Volatility, Sharpe Ratio, VaR (95%), Max Drawdown |
| `FinancialTrends` | Quarterly and Annual trends (Revenue, Debt, CapEx, FCF, Net Income) |
| `ICRAnalysis` | ICR Value, Level, and YoY Trend |
| `FinancialData` | Main model combining fundamental, technical, and qualitative data |
| `ValidationResult` | Wrapper for validation output |

## Report Format (Compact)

```markdown
# {TICKER} Analysis Report
**Date**: Dec 2024 | **Confidence**: High | **Data Period**: Q3 2024

## 💡 VERDICT: BUY
Strong fundamentals with consistent revenue growth.

## 📊 Key Metrics
| Metric | Value | Signal |
|--------|-------|--------|
| P/E | 25.3 | Fair |
| Debt/Equity | 0.45 | Low |
...

## 🟢 GREEN FLAGS (by Hedge Fund Category)
- [FUNDAMENTAL] Revenue growth 18% (Q3 2024)
- [MOMENTUM] Price above SMA 200

## 🚩 RED FLAGS (by Hedge Fund Category)
- [VALUATION] PEG ratio elevated

## 📈 Investment Thesis
2-3 sentences with specific metrics and timeframe.
```
