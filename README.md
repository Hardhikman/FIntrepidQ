# IntrepidQ Equity Analysis

**IntrepidQ Equity** is an AI-powered multi-agent stock analysis system that combines deep quantitative metrics with qualitative insights to provide comprehensive, time-stamped equity research reports.

## 🎯 Overview

The system uses a **4-agent pipeline** powered by Google Gemini and LangGraph:

1. **Data Collection Agent** - Gathers financials, news, and strategic signals
2. **Validation Agent** - Validates data completeness (0-100% score)
3. **Analysis Agent** - Generates investment thesis with red/green flags
4. **Synthesis Agent** - Compiles final time-stamped report

## ✨ Features

### Quantitative Analysis
- **Fundamentals**: Revenue growth, margins, P/E, Debt/Equity, ROE, FCF
- **Technicals**: RSI, MACD, SMA (50/200), Golden/Death Cross detection
- **Risk Metrics**: Volatility, Max Drawdown, Sharpe Ratio
- **Trends**: Quarterly revenue, debt, CapEx, and retained earnings tracking with dates
- **Volume Analysis**: Volume trends, spike detection, and momentum tracking
- **Dividend Tracking**: Yield analysis and payout ratio trends

### Qualitative Research
- **News Integration**: Google News search for recent events
- **Web Search**: DuckDuckGo for strategic signals
- **Management**: CEO track record, vision, ethics
- **Macro**: Inflation, supply chain, interest rates
- **ESG**: Environmental, Social, and Governance factors

### Data Quality
- **Validation System**: Automatic data completeness checking
- **Confidence Scoring**: High/Medium/Low confidence levels
- **Missing Metrics**: Identifies critical, optional, and advanced metrics gaps

### Report Features
- **Timeline Information**: Analysis date, fiscal quarter, data period
- **Time-stamped Metrics**: All financial metrics include quarter/year
- **Dated Events**: News and strategic signals with dates
- **Structured Output**: Markdown format with Executive Summary, Analysis, and Verdict

### CLI Interface
- **Progress Tracking**: Live progress table showing all 4 workflow phases
- **Status Spinners**: Animated feedback during long-running operations
- **Timing Metrics**: Per-phase duration tracking with total analysis time
- **Clean Output**: Professional interface with minimal clutter (verbose mode available)

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Intrepidq_equity
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Environment**:
   Create a `.env` file with your Google API key:
   ```
   GOOGLE_API_KEY=your_gemini_api_key_here
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
   ```

## 🚀 Usage

Run analysis for a specific stock ticker:

```bash
python chat.py analyze TICKER
```

**Example:**
```bash
python chat.py analyze MSFT
```

The report will be:
- Displayed in the terminal with rich formatting
- Saved to `reports/TICKER_TIMESTAMP.md`
- Stored in the SQLite database

**Options:**
```bash
# Analyze without saving to file
python chat.py analyze AAPL --no-save-file

# Analyze with verbose logging (shows tool details)
python chat.py analyze GOOGL --stream

# Interactive chat mode (supports analysis command)
python chat.py start
# Then type: analyze TICKER

# Database maintenance
python db_fileops/db_maintenance.py stats
```

### 🛡️ Human-in-the-Loop Verification
The system now includes a **verification step** using Alpha Vantage data.
- If significant discrepancies are found between Yahoo Finance and Alpha Vantage, the workflow **pauses**.
- You will be prompted to resolve the conflict by selecting the preferred data source.
- The analysis resumes automatically after resolution.

## 📊 Output Example

The analysis displays a live progress table during execution:
```
┌──────────────────────────────────────────────────────────────────────┐
│                      IntrepidQ Analysis: MSFT                        │
├────────────────────┬────────────┬───────────┬────────────────────────┤
│ Phase              │ Status     │ Time      │ Details                │
├────────────────────┼────────────┼───────────┼────────────────────────┤
│ Data Collection    │ ✓          │ 8.2s      │ Collecting data for... │
│ Validation         │ ✓          │ 3.1s      │ Validating data for... │
│ Analysis           │ ✓          │ 5.4s      │ Analyzing MSFT         │
│ Synthesis          │ ✓          │ 4.7s      │ Generating report...   │
└────────────────────┴────────────┴───────────┴────────────────────────┘

✓ Analysis complete in 21.4s
```

Final reports include:
```markdown
# MSFT - Equity Analysis Report

## Report Metadata
- **Analysis Date**: 2024-11-30
- **Data Period**: Q3 2024
- **Fiscal Quarter**: Q3 2024

## Executive Summary
- **Verdict**: Buy
- Revenue growth of 18.4% (Q3 2024)
- P/E ratio of 35.2 (Nov 2024)

## Data Quality & Confidence
- Completeness: 85%
- Confidence: High
```

## 🏗️ Architecture

### Project Structure
```
Intrepidq_equity/
├── agents/                    # Multi-agent system
│   ├── data_agent.py         # Data collection
│   ├── validation_agent.py   # Quality validation
│   ├── analysis_agent.py     # Investment analysis
│   ├── synthesis_agent.py    # Report synthesis
│   └── chat_agent.py         # Chat interface agent
├── context_engineering/       # Prompts and skills
│   ├── prompts.py            # Agent prompts
│   ├── memory.py             # Database interactions
│   └── skills/               # Analysis frameworks
├── tools/                     # Tool definitions
│   ├── definitions.py        # Financial & news tools
│   ├── validation.py         # Data quality checks
│   └── chat_tools.py         # Chat-specific tools
├── db_fileops/                # Database operations
├── utils/                     # Utilities
│   └── cli_logger.py         # Rich CLI logging with progress tracking
├── chat.py                    # Unified CLI entry point
├── config.py                  # Configuration
└── requirements.txt           # Dependencies
```

### Unified Architecture
```
                                   ┌─────────────────┐
                                   │  CLI Entry Point│
                                   │    (chat.py)    │
                                   └────────┬────────┘
                                            │
                       ┌────────────────────┴────────────────────┐
                       ▼                                         ▼
              [Autonomous Analysis]                     [Interactive Chat]
               (Command: analyze)                        (Command: start)
                       │                                         │
    ┌──────────────────┴──────────────────┐           ┌──────────┴──────────┐
    │ Data Collection Agent               │           │ Chat Agent          │
    │ (Financials, News, Search)          │           │ (RAG, Q&A)          │
    └──────────────────┬──────────────────┘           └──────────┬──────────┘
                       ▼                                         │
    ┌──────────────────┴──────────────────┐                      │
    │ Validation Agent                    │                      │
    │ (Completeness, Confidence)          │                      │
    └──────────────────┬──────────────────┘                      │
                       ▼                                         │
    ┌──────────────────┴──────────────────┐                      │
    │ Analysis Agent                      │                      │
    │ (Thesis, Red/Green Flags)           │                      │
    └──────────────────┬──────────────────┘                      │
                       ▼                                         │
    ┌──────────────────┴──────────────────┐                      ▼
    │ Synthesis Agent                     │           ┌─────────────────────┐
    │ (Final Report)                      │           │ SQLite Database     │
    └──────────────────┬──────────────────┘           │ (equity_ai.db)      │
                       │                              └─────────────────────┘
                       ▼
            ┌─────────────────────┐
            │ Generated Report    │
            │ (Markdown & DB)     │
            └─────────────────────┘
```

## 🔧 Configuration

Edit `config.py` to customize:
- **Model**: Google Gemini model selection (Default: `gemini-2.5-flash`)
- **Temperature**: LLM creativity (Default: `0.0` for deterministic output)
- **Database Retention**: Configure `ACTIVE_REPORTS_PER_TICKER` (Default: 3) and auto-cleanup settings
- **User ID**: Default user identifier

## 📚 Documentation

Detailed documentation is available in the `docs/` directory, covering:
- **Project Overview**: Complete architecture and system summary.
- **Operations**: Guides for interactive chat and database management.
- **Metrics**: Definitions for advanced quantitative and risk metrics.
- **Validation**: Details on the data quality and confidence scoring system.

## 🛠️ Technologies

- **LangGraph**: Multi-agent orchestration
- **Google Gemini**: Large language model
- **LangChain**: Agent framework
- **yfinance**: Financial data
- **DuckDuckGo**: Web search
- **Google News**: News aggregation
- **Typer**: CLI framework
- **Rich**: Terminal formatting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
