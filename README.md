# IntrepidQ Equity Analysis

**IntrepidQ Equity** is an AI-powered stock analysis tool that combines deep quantitative metrics with qualitative insights to provide comprehensive equity research reports.

## Features

*   **Deep Financial Analysis**: Fetches real-time data using `yfinance`.
    *   **Fundamentals**: Revenue growth, margins, P/E, Debt/Equity, etc.
    *   **Technicals**: RSI, MACD, SMA (50/200), Golden/Death Cross detection.
    *   **Risk Metrics**: Volatility, Max Drawdown, Sharpe Ratio.
    *   **Trends**: Quarterly revenue and debt trend analysis.
*   **Qualitative Research**: Uses DuckDuckGo to search for strategic signals.
    *   **Management**: CEO track record, vision, ethics.
    *   **Macro**: Inflation, supply chain, interest rates.
    *   **ESG**: Environmental, Social, and Governance factors.
*   **AI Synthesis**: Uses a Deep Agent (LangChain) to synthesize data into a structured report with "Green Flags", "Red Flags", and a final "Verdict".

## Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd Intrepidq_equity
    ```

2.  **Create a virtual environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up Environment**:
    Create a `.env` file with your API keys (if required for specific LLMs):
    ```
    GOOGLE_API_KEY=your_key_here
    ```

## Usage

Run the analysis for a specific stock ticker:

```bash
python main.py analyze TICKER
```

**Example:**
```bash
python main.py analyze TSLA
```

The report will be generated in the `reports/` directory.

## Project Structure

*   `main.py`: Entry point for the CLI application.
*   `tools/definitions.py`: Defines the tools (Financials, Search, Planning).
*   `context_engineering/skills/`: Contains the analysis logic (`SKILL.md`).
*   `agents/`: Contains the agent construction logic.
