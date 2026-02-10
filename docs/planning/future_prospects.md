# Future Prospects and Roadmap

This document outlines the planned features and improvements for the FIntrepidQ Equity Analysis system.

## Planned Features

### 0. Report Enhancements (Data Visualization & Future Scope)
**Status:** Partially Implemented  
**Goal:** Enhance equity reports with data visualizations and future scope from annual reports.

> **✅ IMPLEMENTED:** News Source Attribution (added `_extract_domain()` to `definitions.py`)
> **✅ IMPLEMENTED:** 200-Week SMA (added to `definitions.py` and `SKILL.md`)
> **✅ IMPLEMENTED:** Pydantic Data Models (`utils/models.py`) - Type-safe financial data validation
> **✅ IMPLEMENTED:** Real-Time CLI Logging (`cli_logger.py`) - Financial data displayed as Rich tables during analysis

#### Remaining Implementation

##### A. Data Visualizations
Add charts to visualize financial trends in reports:

| Chart | Description |
|-------|-------------|
| Annual Trends | Bar chart: Revenue, Net Income, Debt, CapEx (3 years) |
| Quarterly Trends | Bar chart: Same metrics (4 quarters) |
| Price + SMA | Line chart: Price with SMA 50, SMA 200, SMA 200 weeks |

**Files to modify:**
- [NEW] `utils/chart_generator.py` - Generate interactive charts using Altair
- [MODIFY] `context_engineering/prompts.py` - Embed charts in synthesis output

##### B. Future Scope from Annual Reports
> **✅ IMPLEMENTED:** Added targeted search queries and report section for forward-looking statements.

**Changes made:**
- Added 3 new search queries to `_check_strategic_triggers()` in `tools/definitions.py`:
  - `{ticker} annual report forward outlook guidance`
  - `{ticker} management discussion future plans`
  - `{ticker} investor presentation strategy`
- Added interpretation rules to `context_engineering/skills/equity_trigger_analysis/SKILL.md`
- Added **🔮 Future Outlook** section to report template in `context_engineering/prompts.py`

---


### 1. Sector Comparison Analysis
**Status:** ✅ Implemented  
**Goal:** Implement a feature that allows users to compare a specific stock ticker against its direct competitors and sector peers.

> **✅ IMPLEMENTED:** Added `/compare [ticker]` command and `perform_sector_comparison_tool`.
> **✅ IMPLEMENTED:** Automated competitor discovery via web search.
> **✅ IMPLEMENTED:** Comprehensive benchmarking against 7 institutional categories.
> **✅ IMPLEMENTED:** Sector-level averages for fundamental, technical, and risk metrics.
> **✅ IMPLEMENTED:** Institutional "Sector Comparison" skill definition.

### 2. Portfolio Analysis Mode
**Status:** Planned
**Goal:** Enable users to analyze a collection of stocks as a portfolio, providing aggregate metrics, diversification insights, and risk assessment.

#### Implementation Plan
## Goal Description
Implement "Portfolio Analysis Mode" to allow users to input a list of tickers (and optionally weights) to receive a holistic analysis of their portfolio. This includes calculating portfolio-level volatility, expected returns, sector allocation, and correlation matrices.

## Proposed Changes

### Tools Layer
#### [MODIFY] [definitions.py](file:///c:/SmartQ/Intrepidq_equity/tools/definitions.py)
- Add `analyze_portfolio_tool`:
    - Input: `tickers` (List[str]), `weights` (Optional[List[float]])
    - Logic:
        1. Fetch historical data for all tickers using `yfinance`.
        2. Calculate daily returns for each asset.
        3. Compute portfolio performance metrics:
            - Portfolio Volatility (Standard Deviation)
            - Sharpe Ratio
            - Beta (vs S&P 500)
            - Maximum Drawdown
        4. Analyze Sector Allocation (using `yfinance` info).
        5. Generate a Correlation Matrix to identify concentration risk.

#### [MODIFY] [chat_tools.py](file:///c:/SmartQ/Intrepidq_equity/tools/chat_tools.py)
- Add `portfolio_analysis_chat_tool`:
    - Input: `tickers` (comma-separated string)
    - Logic: Parses input, calls `analyze_portfolio_tool`, and formats a user-friendly report.

### Chat Interface
#### [MODIFY] [chat.py](file:///c:/SmartQ/Intrepidq_equity/chat.py)
- Add `/portfolio` command:
    - Usage: `/portfolio AAPL, MSFT, GOOGL`
    - Action: Triggers the `portfolio_analysis_chat_tool`.

### Context Engineering
#### [NEW] [context_engineering/skills/portfolio_analysis/SKILL.md](file:///c:/SmartQ/Intrepidq_equity/context_engineering/skills/portfolio_analysis/SKILL.md)
- Define how the agent should interpret portfolio metrics (e.g., "High volatility detected", "Sector concentration warning").

## Verification Plan

### Automated Tests
- Create `test_portfolio.py`:
    - Test `analyze_portfolio(["AAPL", "MSFT"], [0.5, 0.5])` returns correct weighted metrics.
    - Verify that correlation matrix is symmetric.

### Manual Verification
- Run `python chat.py`
- Command: `/portfolio AAPL, TSLA, NVDA`
- Verify:
    - The system calculates portfolio volatility and returns.
    - It identifies that this is a tech-heavy portfolio (Sector Concentration).

### 3. Real-time Monitoring Alerts
**Status:** Planned
**Goal:** Allow users to set price and technical triggers for stocks and receive notifications when conditions are met.

#### Implementation Plan
## Goal Description
Implement "Real-time Monitoring Alerts" to allow users to define custom alerts (e.g., "Notify me if AAPL > $200" or "RSI < 30"). The system will periodically check these conditions and notify the user via the CLI or other configured channels.

## Proposed Changes

### Tools Layer
#### [MODIFY] [definitions.py](file:///c:/SmartQ/Intrepidq_equity/tools/definitions.py)
- Add `add_alert_tool`:
    - Input: `ticker`, `condition` (e.g., "price_above", "rsi_below"), `value`
    - Logic: Stores the alert in a local database (`alerts` table).
- Add `check_alerts_tool`:
    - Input: None
    - Logic:
        1. Query active alerts from DB.
        2. Fetch current data for relevant tickers.
        3. Evaluate conditions.
        4. Return a list of triggered alerts.

### Database
#### [MODIFY] [db_fileops/database.py] (or equivalent)
- Create `alerts` table:
    - Columns: `id`, `ticker`, `condition`, `target_value`, `status` (active/triggered), `created_at`.

### Chat Interface
#### [MODIFY] [chat.py](file:///c:/SmartQ/Intrepidq_equity/chat.py)
- Add `/alert` command:
    - Usage: `/alert AAPL price_above 200`
    - Action: Calls `add_alert_tool`.
- Add `/alerts` command:
    - Usage: `/alerts`
    - Action: Lists all active alerts.
- Background Loop (Optional for V1):
    - Implement a background thread in `chat.py` that calls `check_alerts_tool` every minute and prints notifications to the console.

## Verification Plan

### Automated Tests
- Create `test_alerts.py`:
    - Test `add_alert` stores correctly in DB.
    - Test `check_alerts` correctly identifies a triggered condition (mocking the price data).

### Manual Verification
- Run `python chat.py`
- Command: `/alert AAPL price_above 10` (Set a condition that is definitely true).
- Wait for the background check (or manually trigger check).
- Verify: The system notifies "ALERT: AAPL is above 10!".