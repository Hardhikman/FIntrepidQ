# Portfolio Agent — Future Scope

Things to add later when ready. These are NOT part of Stage A (what we build now).

---

## Stage B: 24/7 Daemon + Hosting (Backend Only)

**No frontend needed.** The server runs a Python daemon process only.

### What runs on the server:
```
VPS Server ($5/mo — Railway, Render, or any Linux VPS)
    └── Python daemon process
        ├── Scheduler (check earnings calendar daily)
        ├── News sentinel (end-of-day news scan, after market close)
        ├── Alert manager (send WhatsApp alerts)
        └── SQLite database (all state)
```

### Your "frontends" are apps you already use:
| Interface | Purpose | You build it? |
|-----------|---------|---------------|
| **Terminal (CLI)** | Run commands, read reports | No — your terminal |
| **WhatsApp** | Receive alerts/reports on phone | No — WhatsApp app |
| **Kite app** | Execute sell orders | No — Zerodha's app |

### How to deploy:
1. Push code to GitHub
2. Deploy to Railway/Render (connect GitHub repo)
3. Set environment variables (Kite API keys, WHATSAPP_DEFAULT_TO_NUMBER)
4. Daemon starts automatically, runs 24/7

---

## Optional: Web Dashboard (not planned, low priority)

A simple Flask/FastAPI dashboard IF you ever want browser access:
- View portfolio + P&L in a browser
- See alert history
- Read reports with formatting
- Acknowledge alerts from phone browser

**Why it's not needed:** Reports are already delivered to WhatsApp, alerts are real-time, and portfolio data is in Kite. Our custom WhatsApp interface serves as a perfect mobile dashboard.

## Optional: Mutual Fund & ETF Analysis

Currently the system only analyzes **individual stocks**. MF/ETF support would add:

### ETFs (easy — mostly works already)
- yfinance already has ETF data (`NIFTYBEES.NS`, `GOLDBEES.NS`)
- Needs: tweaked analysis prompts (tracking error, expense ratio, benchmark comparison)
- **Data: Free** (yfinance)

### Mutual Funds (needs new data source)
- **mfapi.in** — Free, no API key, all Indian MFs
- **AMFI API** — Free, official data from AMFI India
- Analysis criteria: NAV trend, expense ratio, category rank, rolling returns vs benchmark, portfolio overlap detection

```python
# Example — fetch any MF data for free:
import requests
data = requests.get("https://api.mfapi.in/mf/119598").json()  # SBI Bluechip
# Returns: fund name, NAV history, scheme type
```

### What would change:
| Component | Change needed |
|-----------|--------------|
| `kite_client.py` | Detect MF vs stock in holdings |
| `data_agent.py` | Add MF data fetching (mfapi.in) |
| `SKILL.md` | New MF/ETF analysis criteria |
| `portfolio_agent.py` | Route MF/stock to different analysis |

---

## Optional: Multi-portfolio Support

If you manage multiple portfolios or paper-trade separately:
- Separate Kite accounts or sub-portfolios
- Per-portfolio alerts and thesis tracking
- Comparison across portfolios

---

## Optional: Advanced Features (far future)
- **Backtesting** — Test thesis drift detection against historical data
- **Position sizing recommendations** — Kelly criterion or risk parity
- **Tax harvesting alerts** — Flag LTCG/STCG optimization opportunities
- **Correlation monitoring** — Alert if portfolio stocks become too correlated
