# Portfolio Trading Agent — Design Decisions & How It Works

All clarifications and design decisions from the planning conversation, organized by topic.

---

## 1. How Does It Connect to My Existing CLI?

**The portfolio agent is NOT a replacement — it's an extension.**

| Existing (unchanged) | New (added) |
|----------------------|-------------|
| `python chat.py analyze MSFT` | `python chat.py kite login` |
| `python chat.py start` (chat mode) | `python chat.py whatsapp run-bot` |
| `/compare [ticker]` | `python chat.py portfolio analyze` |
| `/tickers` | `python chat.py alerts` |

The portfolio agent loops through your Kite holdings and calls the **exact same 4-agent pipeline** for each stock:

```
Portfolio Agent (NEW wrapper)
    │
    ├── For each holding in Kite:
    │       └── Data Collection → Validation → Analysis → Synthesis
    │           (identical to `python chat.py analyze MSFT`)
    │
    └── Adds portfolio-level summary on top
        (total P&L, sector allocation, thesis drift)
```

---

## 2. How Does the Earnings Calendar Work?

### Where do earnings dates come from?
**yfinance** (free, already in the project):
```python
import yfinance as yf
stock = yf.Ticker("RELIANCE.NS")
stock.calendar  # → next earnings date
```

### Where are they saved?
**SQLite** (same `equity_ai.db` you already use):

| ticker | next_earnings | last_analyzed | status |
|--------|--------------|---------------|--------|
| RELIANCE | 2026-03-15 | 2026-02-10 | pending |
| TCS | 2026-04-02 | 2026-01-05 | stale |
| INFY | 2026-02-20 | 2026-02-12 | fresh |

### When is it generated?
When you run `python chat.py portfolio analyze`:
1. Fetches holdings from Kite
2. Fetches earnings dates from yfinance
3. Saves to SQLite
4. Flags stocks with upcoming earnings
5. Runs analysis

### Does it only analyze when earnings are recent?
**No.** Two separate things:

| Action | What happens |
|--------|-------------|
| `portfolio analyze` (manual) | Analyzes ALL stocks right now, regardless of earnings |
| Earnings calendar (smart) | Reminds you WHEN to run — "TCS reports in 5 days" |

---

## 3. Human-in-the-Loop — How Does It Work?

### Level 1: Data Conflicts (already exists)
```
Validation detects Yahoo vs Alpha Vantage conflict
    → Pipeline PAUSES
    → Shows both values
    → You pick which to use
    → Pipeline resumes
```

### Level 2: Thesis Drift Alerts (new)
When re-analysis shows the investment case changed:

```
python chat.py portfolio analyze
    → Analyzes each stock
    → Compares new vs previous report
    → If verdict flipped (BUY → SELL):

        Two things happen SIMULTANEOUSLY:
        
        1. 📱 WhatsApp sent AUTOMATICALLY
           (see report on phone even if away from PC)
        
        2. 💻 CLI shows alert:
           🚨 RELIANCE thesis drift!
           Previous: BUY (3 green, 1 red)
           Current:  SELL (1 green, 4 red)
           Action? [acknowledge / details / dismiss]
```

### Is WhatsApp automatic or manual?
**Automatic.** The moment drift is detected, a WhatsApp report (using the `JSON_SEND` protocol) fires immediately — no approval needed. The CLI prompt is only for **acknowledging** (marking as "seen").

### Does the system ever auto-sell?
**Never.** Alert-only mode. You sell manually in the Kite app.

---

## 4. Hosting: Now vs Later

### Stage A (Now) — CLI Mode
```
You open terminal → type command → get results
```
If you forget to run it, nothing happens. **No hosting needed.**

### Stage B (Later) — Daemon Mode
```
Server runs 24/7 → auto-analyzes → alerts you on Telegram
```

| | CLI Mode (Now) | Daemon Mode (Later) |
|--|---------------|-------------------|
| Who triggers? | You (manually) | Daemon (auto) |
| News monitoring | When you run it | Once/day after market close |
| Earnings tracking | When you run it | Auto daily |
| Alerts | When you check | Push to Telegram |
| Miss a day? | Missed | Never misses |

**The code is identical.** Daemon mode just wraps the same CLI logic in an automated scheduler loop.

---

## 5. Why WhatsApp, Not Telegram?

Earlier, we chose Telegram due to costs, but now that we've implemented a **free, robust custom listener**, WhatsApp is the superior choice:

| | WhatsApp (Custom) | Telegram Bot |
|--|-------------------|--------------|
| **Cost** | **Free** (via Mudslide/Baileys) | Free |
| **UX** | Native app, highly accessible | Secondary app |
| **Stability** | ✅ **Heartbeat + JSON_SEND** | Simple API |
| **Formatting** | Full report support via JSON | MD/HTML limits |

We leverage the `JSON_MSG` and `JSON_SEND` protocols developed for `chat.py` to ensure high-fidelity delivery of portfolio alerts.

---

## 6. Zerodha Kite API — What's Free?

| Tier | Includes | Cost |
|------|----------|------|
| **Personal (Free)** | Portfolio management, orders, GTT, alerts | **Free** ✅ |
| **Connect** | WebSocket streaming, historical candles | ₹500/month |

We use the **free Personal tier**. Historical data comes from yfinance (also free).

### Token Expiry
Kite access tokens expire daily. Solution: **manual morning login** via browser → token cached for the day.

---

## 7. Summary: What Gets Built

### Stage A — Build Now (CLI, no hosting)

| # | Component | What it does |
|---|-----------|-------------|
| 1 | Kite Client | Connect to Zerodha, fetch holdings |
| 2 | Portfolio Agent + CLI | Analyze all holdings, portfolio view |
| 3 | Earnings Scheduler | Track earnings dates, flag upcoming |
| 4 | News Sentinel | Check news on-demand, classify severity |
| 5 | Thesis Drift + Alerts | Detect changes, WhatsApp alerts |
| 6 | Skill Updates | Portfolio-aware analysis rules |

### Stage B — Later

| # | Component | What it does |
|---|-----------|-------------|
| 7 | Daemon + VPS | 24/7 automated monitoring |
