# FIntrepidQ Master Knowledge Base (Granular Edition)

Welcome to the ultimate Q&A reference for the FIntrepidQ Equity Analysis System. This document reflects the full 15+ file documentation suite.

---

## ⚡ 1. General Overview & Vision

### What is the core philosophy of FIntrepidQ?
FIntrepidQ is an **institutional-grade multi-agent system** designed to solve "Context Fatigue." It doesn't just chat; it executes a rigorous 4-stage pipeline (Data → Validation → Analysis → Synthesis) to ensure zero-hallucination, time-stamped reporting.

### What is the "ReAct" pattern used in the agents?
**ReAct** stands for **Reasoning + Acting**. 
1. **Reasoning**: The agent explains *why* it needs data.
2. **Acting**: It makes a tool call (e.g., `get_deep_financials`).
3. **Observation**: It sees the result and repeats until the task is complete.
This prevents the agent from making up numbers and forces it to use real APIs.

### How does "Hybrid Data Flow" work?
To prevent data loss, the system "intercepts" tool outputs from the message history. While the agent summarizes data, the pipeline extracts the **raw JSON** from tools like `get_deep_financials` and passes it directly to the Synthesis agent. This ensures 100% quantitative precision.

---

## 🤖 2. Deep Architecture & Tech

### What are the responsibilities of the 4 Agents?
1. **Data Agent**: Collects financial data, news, and strategic triggers. Uses retry logic for API resilience.
2. **Validation Agent**: Checks for completeness (0-100% score) and fixes gaps using Alpha Vantage.
3. **Analysis Agent**: The "Senior Analyst." Uses `SKILL.md` frameworks to generate the raw investment thesis.
4. **Synthesis Agent**: The "Lead Strategist." Polishes the report, attributes sources, and adds timeline metadata.

### How are technical indicators calculated?
Most indicators (RSI, SMA, MACD) are calculated using **Rust Acceleration** via the `rust_finance` library for high performance.
- **Technicals**: RSI(14), MACD, SMA 50/200, and the **SMA 200W (Macro Cycle Baseline)**.
- **Risk**: Volatility (Annualized), Sharpe Ratio, Max Drawdown, and **VaR (95%)**.

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

### How does database maintenance work?
The system includes `db_maintenance.py` to keep the SQLite database (`equity_ai.db`) clean:
- `cleanup --keep 3`: Keeps only the latest 3 reports per ticker.
- `cleanup-by-date --older-than 7`: Deletes stale data older than a week.
- `cleanup-files`: Synchronizes the `reports/` folder by deleting markdown files that no longer exist in the DB.

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

---

## 🛡️ 5. Troubleshooting & Quality

### What does the "Data Completeness" score mean?
The Validation Agent scores data before analysis:
- **High (>= 80%)**: Safe for strong Buy/Sell verdicts.
- **Medium (>= 60%)**: Proceeds but with warnings.
- **Low (< 60%)**: Analyst will state limitations and avoid strong calls.

### Why do I see "gzip response" warnings?
This is a standard `yfinance` log. It means the API returned an empty gzipped file for a specific metric (common for small-cap or international stocks). FIntrepidQ handles this gracefully by substituting data from Alpha Vantage or marking it as N/A.

### Can I run analysis 24/7?
Yes. Use **PM2** on Windows or Linux:
`pm2 start "python chat.py whatsapp run-bot" --name fintrepid-bot`.

---

## � 7. WhatsApp & Mobile Integration

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

---

## �🚀 8. Portfolio Agent & Roadmap

### What is the Portfolio Agent?
It is a wrapper that connects to your **Zerodha Kite** holdings. It loops through your stocks and runs the full analysis pipeline for each, aggregating them into a portfolio-level summary with P&L tracking.

### What is "Thesis Drift"?
In portfolio mode, the system compares the current report with the previous one. If the verdict flips (e.g., **BUY → SELL**) or red flags increase significantly, it triggers a **Thesis Drift Alert** via WhatsApp.

### What is the Earnings Scheduler?
The system parses `stock.calendar` from yfinance to track upcoming earnings. 
- **Pre-Earnings**: Runs 7 days before.
- **Post-Earnings**: Runs 3 days after to capture new financials.

### What are the future plans for Mutual Funds?
The roadmap includes integrating the `mfapi.in` API to enable analysis of Mutual Funds and ETFs using criteria like NAV trends, expense ratios, and rolling returns.
