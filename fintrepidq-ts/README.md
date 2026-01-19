# FIntrepidQ Equity Analysis (TypeScript + Bun)

An institutional-grade multi-agent equity research system migrated from Python to a modern TypeScript architecture. Powered by **Next.js**, **LangGraph.js**, and the **Bun** runtime.

## 🚀 Overview

FIntrepidQ uses a "Divide and Rule" architecture to orchestrate a team of AI agents that perform deep financial analysis, strategic news scanning, and risk assessment. It follows the exact rules and thresholds used by top-tier hedge funds to provide high-precision Buy/Sell/Hold verdicts.

## 🛠 Tech Stack

- **Runtime**: [Bun 1.3.6+](https://bun.sh)
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Agent Orchestration**: LangGraph.js
- **LLM**: Google Gemini 2.5 Flash
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS + Shadcn UI
- **Data Sources**: Yahoo Finance (via `yahoo-finance2`), Google News (RSS), DuckDuckGo

## 🏗 Modular Architecture ("Divide & Rule")

- **Divided Packages**:
  - `packages/agents`: Independent agent logic for Data, Validation, Analysis, and Synthesis.
  - `packages/tools`: Decoupled toolsets for finance, search, and news.
  - `lib/math`: High-performance financial math library (Sharpe, RSI, VaR).
- **Central Rule**:
  - `lib/engine/orchestrator.ts`: The central Graph that "rules" the sequence and state of the agents.

## 🚦 Features

- **7 Signal Categories**: Fundamental, Valuation, Quality, Momentum, Risk, Sentiment, Dividend.
- **Hybrid Data Flow**: Intercepts tool JSON for 100% precision in LLM analysis.
- **BYOK (Bring Your Own Key)**: Configure your Gemini API key directly in the UI.
- **Vibrant UI**: Modern dark-mode interface with live analysis progress.

## ⚡ Getting Started

### Prerequisites
- [Bun](https://bun.sh) installed on your system.

### Installation
```bash
cd fintrepidq-ts
bun install
```

### Run the App
```bash
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Investment Logic

The system follows the institutional-grade rules defined in the original `equity_trigger_analysis` skill. This includes specific thresholds for:
- **Rev Growth** (>15% 🟢)
- **ROCE** (>20% 🟢)
- **Debt/Equity** (<0.5 🟢)
- **Sharpe Ratio** (>1.0 🟢)
- **RSI** (Oversold <30 🟢)

## 🛡 License
MIT
