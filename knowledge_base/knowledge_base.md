# FIntrepidQ Master Knowledge Base (Granular Edition)

Welcome to the ultimate Q&A reference for the FIntrepidQ Equity Analysis System. This document reflects the full 15+ file documentation suite.

---

## ⚡ 1. General Overview & Vision

### What is the core philosophy of FIntrepidQ?
FIntrepidQ is an **institutional-grade multi-agent system** designed to solve "Context Fatigue." It doesn't just chat; it executes a rigorous 4-stage pipeline (Data → Validation → Analysis → Synthesis) to ensure zero-hallucination, time-stamped reporting.

### What problem does FIntrepidQ solve?
Equity analysts waste hours reading scattered data sources and manually cross-referencing numbers. FIntrepidQ automates the entire research loop — from raw API data to a professional investment thesis — in under 30 seconds, with guaranteed quantitative accuracy.

### What is the "ReAct" pattern used in the agents?
**ReAct** stands for **Reasoning + Acting**. 
1. **Reasoning**: The agent explains *why* it needs data.
2. **Acting**: It makes a tool call (e.g., `get_deep_financials`).
3. **Observation**: It sees the result and repeats until the task is complete.
This prevents the agent from making up numbers and forces it to use real APIs.

### How does "Hybrid Data Flow" work?
To prevent data loss, the system "intercepts" tool outputs from the message history. While the agent summarizes data, the pipeline extracts the **raw JSON** from tools like `get_deep_financials` and passes it directly to the Synthesis agent. This ensures 100% quantitative precision.

### What technologies power the system?
- **LangGraph** — Multi-agent orchestration
- **Google Gemini** (gemini-2.5-flash) — LLM
- **yfinance + Alpha Vantage** — Financial data
- **DDGS + Google News RSS** — News search
- **Rust (PyO3)** — High-performance calculations
- **Rich** — CLI formatting
- **tenacity** — Retry logic with exponential backoff

### What is the compact report format?
Every report follows a strict 5-section structure: **Verdict → Key Metrics Table → Green Flags → Red Flags → Investment Thesis**. All flags are tagged with one of the 7 hedge fund categories (e.g., `[FUNDAMENTAL]`, `[MOMENTUM]`) for professional categorization.

---

## 🤖 2. Deep Architecture & Tech

### What are the responsibilities of the 4 Agents?
1. **Data Agent**: Collects financial data, news, and strategic triggers. Uses retry logic for API resilience.
2. **Validation Agent**: Checks for completeness (0-100% score) and fixes gaps using Alpha Vantage.
3. **Analysis Agent**: The "Senior Analyst." Uses `SKILL.md` frameworks to generate the raw investment thesis.
4. **Synthesis Agent**: The "Lead Strategist." Polishes the report, attributes sources, and adds timeline metadata.

### What is the role of Pydantic models?
The `utils/models.py` file defines strict data contracts (a "Pydantic Shield"). Models like `Technicals`, `RiskMetrics`, `FinancialTrends`, and `ICRAnalysis` enforce type safety and value ranges (e.g., RSI must be 0–100). If the Data Agent returns corrupted data, the system catches it before the Analyst ever sees it.

### How does the Validation Agent assign confidence?
It uses a two-axis scoring system:
| Completeness | Critical Metrics % | Confidence |
|---|---|---|
| ≥ 80% | ≥ 90% | **High** |
| ≥ 60% | ≥ 70% | **Medium** |
| < 60% | < 70% | **Low** |

Critical metrics include: current_price, market_cap, revenue_growth, profit_margins, trailing_pe, debt_to_equity, free_cash_flow, and return_on_equity.

### What is the difference between the Analysis Agent and the Synthesis Agent?
The **Analysis Agent** is the "builder" — it generates the full structured report (tables, flags, thesis) using `SKILL.md` rules applied to raw JSON data. The **Synthesis Agent** is the "editor" — it integrates Validation metadata, cross-references sources, polishes tone, and adds timeline context. Both receive identical raw data to prevent information loss.

### What is the `load_skill` tool?
It is the Analysis Agent's primary tool. It loads a specialized "skill framework" (like `equity_trigger_analysis/SKILL.md`) containing preset rules, thresholds, and report templates that guide the agent's analysis logic.

### How are technical indicators calculated?
Most indicators (RSI, SMA, MACD) are calculated using **Rust Acceleration** via the `rust_finance` library for high performance.
- **Technicals**: RSI(14), MACD, SMA 50/200, and the **SMA 200W (Macro Cycle Baseline)**.
- **Risk**: Volatility (Annualized), Sharpe Ratio, Max Drawdown, and **VaR (95%)**.

### What is the Rust Acceleration library?
The `rust_finance` library is a Python extension written in Rust (via PyO3). It handles all performance-critical calculations:
- `technicals.rs` — RSI, SMA, MACD
- `risk.rs` — Volatility, Sharpe Ratio, VaR, Max Drawdown
- `utils.rs` — Trend detection

Rust is orders of magnitude faster than pure Python for numerical loops.

### What is the JSON_SEND protocol?
It is a communication bridge used between Python and Node.js for the WhatsApp bot. It wraps multiline reports into a single JSON line to prevent the messaging pipe from truncating the output at newlines.

---

## ⚙️ 3. Operations & CLI Usage

### How do I analyze a stock using common names?
The system supports smart resolution. Running `python chat.py analyze "Data Patterns"` will resolve the name to its ticker (`DATAPATTNS`) before starting the work.

### What are the key CLI flags for analysis?
- `--auto-save`: Skips the human-in-the-loop "Save?" prompt.
- `--no-save-file`: Generates the report but doesn't save a `.md` copy.
- `python chat.py start [TICKER]`: Opens the chat and immediately fetches data for that stock.

### What is the Human-in-the-Loop save flow?
After every analysis, the system pauses and prompts:
- **yes** → Save to both `reports/TICKER_TIMESTAMP.md` file AND database
- **no** → Save to file only (not available for chat queries)
- **cancel** → Discard the report entirely

Use `--auto-save` to bypass this prompt entirely.

### How does the `/compare` command work?
The `/compare [TICKER]` command triggers a **Sector Comparison Analysis**:
1. **Automated Competitor Discovery** via real-time web search.
2. **Institutional Benchmarking** — fetches P/E, ROCE, Beta, etc. for target + peers.
3. **Industry Averages** — computes averages to identify relative strengths.
4. **Sector News** — pulls high-impact headlines for all compared stocks.

Output includes a 12-column benchmark table, a signal dashboard, and a data-driven Sector Verdict.

### How does database maintenance work?
The system includes `db_maintenance.py` to keep the SQLite database (`equity_ai.db`) clean:
- `cleanup --keep 3`: Keeps only the latest 3 reports per ticker.
- `cleanup-by-date --older-than 7`: Deletes stale data older than a week.
- `cleanup-files`: Synchronizes the `reports/` folder by deleting markdown files that no longer exist in the DB.

### How do I clean up old reports by date?
Use `cleanup-by-date`:
- `--before 2025-12-08` — Delete reports created before a specific date.
- `--older-than 7` — Delete reports older than N days.
- `--ticker TSLA` — Filter cleanup to a specific ticker.
- `--dry-run` — Preview without actually deleting.

### How does file cleanup sync with database cleanup?
When `save_analysis_to_memory()` runs auto-cleanup, it also deletes old `.md` files from the `reports/` folder. For manual sync, run `cleanup-files` which keeps the latest N files per ticker aligned with the database.

---

## 📈 4. Financial Engine & Signal Categories

### What are the 7 Hedge Fund Signal Categories?
1. **FUNDAMENTAL**: Core health (Revenue Growth, ROCE).
2. **VALUATION**: Price vs Value (PEG, P/E).
3. **QUALITY**: Financial strength (Debt/Equity, ICR).
4. **MOMENTUM**: Trend action (RSI, MACD, Volume Spikes).
5. **RISK**: Downside (Beta, VaR, Sharpe).
6. **SENTIMENT**: News narrative (Management, Legal).
7. **DIVIDEND**: Income health (Yield, Payout).

### What are the specific "Green Flag" thresholds?
- **Revenue Growth**: > 15% Strong.
- **Profit Margins**: > 15% Strong.
- **ROE**: > 15% Strong.
- **ROCE**: > 20% Excellent.
- **PEG Ratio**: < 1.0 Attractive.
- **ICR**: > 3.0 Strong Solvency.

### How is the "Self-funded growth" detected?
The system correlates two trends: If **CapEx is Increasing** AND **Debt is Decreasing**, it flags a "GREEN FLAG: Self-funded growth," indicating the company expands using its own profits rather than taking on debt.

### What is a "Volume Spike"?
A volume spike is triggered if the latest trading volume is **> 1.5x the 50-day Moving Average**. Combined with price action, this indicates institutional interest.

### What is the 200-Week SMA and why is it important?
The 200-Week Simple Moving Average (SMA 200W) serves as the **Macro Cycle Baseline**. When a stock's price drops below this level, it historically represents a significant long-term buying opportunity. It filters out short-term noise and identifies deep-value entry points.

### How does Golden Cross / Death Cross detection work?
- **Golden Cross**: SMA 50 crosses *above* SMA 200 → Strong **bullish** indicator.
- **Death Cross**: SMA 50 crosses *below* SMA 200 → Strong **bearish** indicator.

The system automatically detects these crossovers from 2-year price history and tags them under the `[MOMENTUM]` category.

### What are the ICR (Interest Coverage Ratio) risk levels?
| ICR Value | Level | Meaning |
|---|---|---|
| > 3.0 | **Strong** | Comfortably covers debt obligations |
| 1.5 – 3.0 | **Fair** | Adequate but worth monitoring |
| < 1.5 | **Risk** | High risk of default |

The system also tracks ICR trend YoY (increasing/decreasing) under `[QUALITY]`.

### How does the Strategic Correlation Analysis work?
The system cross-references CapEx and Debt trends from quarterly financials:
| CapEx | Debt | Signal |
|---|---|---|
| ↑ Increasing | ↓ Decreasing | 🟢 **Self-funded growth** (Best case) |
| ↑ Increasing | ↑ Increasing | 🟡 Leveraged expansion (Caution) |
| ↓ Decreasing | ↓ Decreasing | ⚪ Conservative/mature business |
| ↓ Decreasing | ↑ Increasing | 🚩 **Deteriorating financials** (Red flag) |

---

## 🛡️ 5. Troubleshooting & Quality

### What does the "Data Completeness" score mean?
The Validation Agent scores data before analysis:
- **High (>= 80%)**: Safe for strong Buy/Sell verdicts.
- **Medium (>= 60%)**: Proceeds but with warnings.
- **Low (< 60%)**: Analyst will state limitations and avoid strong calls.

### What are the Critical, Optional, and Advanced metric tiers?
- **Critical (8 metrics)**: current_price, market_cap, revenue_growth, profit_margins, trailing_pe, debt_to_equity, free_cash_flow, return_on_equity. Missing any of these triggers warnings.
- **Optional (6 metrics)**: forward_pe, peg_ratio, dividend_yield, payout_ratio, return_on_assets, operating_cashflow.
- **Advanced (5 metrics)**: technicals, risk_metrics, financial_trends, volume_trends, dividend_trends.

### What happens if data completeness is below 70%?
The report automatically includes a **⚠️ Data Quality Warning** section listing missing critical metrics, analysis confidence level, and specific limitations. The agent will not issue a strong Buy/Sell verdict with low-confidence data.

### Why do I see "gzip response" warnings?
This is a standard `yfinance` log. It means the API returned an empty gzipped file for a specific metric (common for small-cap or international stocks). FIntrepidQ handles this gracefully by substituting data from Alpha Vantage or marking it as N/A.

### What is the structured logging system?
FIntrepidQ uses **dual logging**:
1. **Rich CLI Output** — Live progress table with phase spinners, timing metrics, and financial data tables.
2. **JSON File Logging** — Rotating files (10MB max, 5 backups) with specialized loggers: `analysis_logger`, `api_logger`, `error_logger`. All stored in the `logs/` directory.

### Can I run analysis 24/7?
Yes. Use **PM2** on Windows or Linux:
`pm2 start "python chat.py whatsapp run-bot" --name fintrepid-bot`.

---

## 🗄️ 6. Database & Persistence

### What is the database schema?
FIntrepidQ uses SQLite (`equity_ai.db`) with an `analysis_reports` table containing: `id`, `session_id` (unique), `user_id`, `ticker`, `report` (full markdown), and `created_at` (timestamp). Performance indexes exist on `ticker` and `(ticker, created_at DESC)`.

### What is the retention policy?
By default, the system keeps the **latest 3 reports per ticker** and auto-deletes older ones. This is configurable via `REPORTS_TO_KEEP` in `context_engineering/memory.py` or `DB_RETENTION.ACTIVE_REPORTS_PER_TICKER` in `config.py`.

### How do I backup and reset the database?
- **Backup**: `copy equity_ai.db equity_ai_backup.db`
- **Reset**: Delete `equity_ai.db` and run `python -c "from context_engineering.memory import init_db; init_db()"` to create a fresh one.

### What deployment options exist for 24/7 operation?
| | Local (PC) | Cloud (Deploy) |
|---|---|---|
| **Cost** | Free | ~$5/month |
| **Effort** | Low | Medium (GitHub/CI setup) |
| **Reliability** | Depends on PC/Power | 99.9% Uptime |
| **Options** | PM2 or Windows Startup | Railway, Render, or Linux VPS |

---

## 📱 7. WhatsApp & Mobile Integration

### How do I connect the WhatsApp Bot?
1. Run `python chat.py whatsapp login` in your terminal.
2. Scan the provided QR code using your WhatsApp mobile app (**Linked Devices**).
3. Once connected, run `python chat.py whatsapp run-bot` to start the 24/7 listener.

### What commands work in WhatsApp?
The bot uses a unified engine, so it supports the same commands as the CLI:
- `analyze TSLA`: Starts a full multi-agent analysis.
- `analyze tesla`: Smart name resolution for companies without known tickers.
- `/tickers`: Lists all analyzed stocks in the database.
- `/clear`: Resets the conversation memory for your mobile session.

### How is the mobile report different?
The Synthesis Agent intelligently creates an **Executive Summary** specifically for mobile. It delivers a concise verdict and the primary investment thesis in a single message block using the `JSON_SEND` protocol to ensure no text is cut off.

### What is the Heartbeat telemetry system?
The WhatsApp bot prints a heartbeat signal every **5 seconds** to the CLI console, confirming the communication pipe between Python and Node.js is healthy. If heartbeats stop, the pipe has broken.

### What are common WhatsApp bot troubleshooting steps?
- **"Bot stopped." immediately**: Ensure Node.js is installed and the command is correct.
- **No Response**: Check if the console shows `✅ WhatsApp Bot CONNECTED`. If not, re-run the login step.
- **Rate Limits (429 error)**: This is a Gemini API limit, not WhatsApp. Wait 60 seconds.
- **Invalid Ticker**: Try the explicit symbol (e.g., "TSLA" instead of "tesla").

---

## 🚀 8. Portfolio Agent & Roadmap

### What is the Portfolio Agent?
It is a wrapper that connects to your **Zerodha Kite** holdings. It loops through your stocks and runs the full analysis pipeline for each, aggregating them into a portfolio-level summary with P&L tracking.

### What is "Thesis Drift"?
In portfolio mode, the system compares the current report with the previous one. If the verdict flips (e.g., **BUY → SELL**) or red flags increase significantly, it triggers a **Thesis Drift Alert** via WhatsApp.

### What is the Earnings Scheduler?
The system parses `stock.calendar` from yfinance to track upcoming earnings. 
- **Pre-Earnings**: Runs 7 days before.
- **Post-Earnings**: Runs 3 days after to capture new financials.

### What is the planned Portfolio Analysis Mode?
A `/portfolio AAPL, TSLA, NVDA` command that calculates portfolio-level metrics: weighted volatility, Sharpe Ratio, sector allocation, and a correlation matrix to identify concentration risk.

### What are Real-time Monitoring Alerts?
A planned `/alert AAPL price_above 200` command that stores custom conditions in the database and periodically checks them against live data, notifying the user when triggers fire.

### What data visualizations are planned?
Three types of interactive charts (using Altair):
1. **Annual Trends** — Bar chart: Revenue, Net Income, Debt, CapEx (3 years).
2. **Quarterly Trends** — Bar chart: Same metrics (4 quarters).
3. **Price + SMA** — Line chart: Price with SMA 50, SMA 200, SMA 200 weeks.

### What are the future plans for Mutual Funds?
The roadmap includes integrating the `mfapi.in` API to enable analysis of Mutual Funds and ETFs using criteria like NAV trends, expense ratios, and rolling returns.
