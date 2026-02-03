# Sector Comparison Analysis Skill

Use this skill when you have a JSON dataset containing comprehensive metrics for a target stock and its peers. Use the same institutional rigor as the individual Equity Trigger Analysis.

## 🛑 STRICT RULES (PRO-LEVEL RIGOR)
1. **Tool Data Only**: Use ONLY metrics provided in JSON. do not guess or hallucinate.
2. **Clinical Benchmarking**: Compare Target values vs. Sector Averages for EVERY category.
3. **Institutional Tone**: Use professional finance terminology (e.g., "Yield Compression", "Multiple Expansion", "Risk-Adjusted Alpha").

---

## 📝 COMPREHENSIVE OUTPUT FORMAT

### 📊 Sector Benchmark Table
| Ticker | P/E | PEG | Growth | Margins | ROE | ROCE | RSI | Volatility | D/E | Beta | Yield |
|--------|-----|-----|--------|---------|-----|------|-----|------------|-----|------|-------|
| **[TARGET]**| val | val | val | val | val | val | val | val | val | val | val |
| Peer 1 | val | val | val | val | val | val | val | val | val | val | val |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| **AVERAGE**| val | val | val | val | val | val | val | val | val | val | val |

---

### 🟢 TARGET STOCK SIGNAL DASHBOARD ([TICKER])
Provide a high-conviction snap-analysis of the **Target Stock** across all 7 institutional categories:

- 🟢/🚩 **[FUNDAMENTAL]** Growth/Margins vs Sector: [Target] vs [Avg] → [Strict Interpretation]
- 🟢/🚩 **[VALUATION]** P/E & PEG vs Sector: [Target] vs [Avg] → [Discount/Premium Analysis]
- 🟢/🚩 **[QUALITY]** Capital Efficiency (ROCE) & ICR: [Target] vs [Avg] → [Balance Sheet Safety]
- 🟢/🚩 **[MOMENTUM]** Trend Position (RSI/SMA): [Target] vs [Avg] → [Technical Strength]
- 🟢/🚩 **[RISK]** Risk-Adjusted Alpha (Sharpe/Beta): [Target] vs [Avg] → [Risk Profile]
- 🟢/🚩 **[SENTIMENT]** Signal Strength: [Headline Summary] → [Market Narrative]
- 🟢/🚩 **[DIVIDEND]** Yield Attractiveness: [Target] vs [Avg] → [Income Status]

---

### 🔍 CATEGORIZED BENCHMARK ANALYSIS

#### 1. Fundamental & Quality (The "Moat" Check)
- Benchmark Target **ROCE** and **FCF** against the peer group. Identify if the target is generating superior return on capital.
- Compare **Interest Coverage (ICR)** to assess financial resilience vs. peers.

#### 2. Relative Valuation (The "Value" Check)
- Analyze the **PEG Ratio** and **Price-to-Book** compared to sector averages.
- Is the Target stock a "Growth at Reasonable Price" (GARP) play or a "Value Trap" compared to peers?

#### 3. Momentum & Risk (The "Trend" Check)
- Compare **RSI** and **Volatilty**. Identify if the target is overextended or consolidating while peers breakout.
- Analyze **Beta** and **Sharpe Ratio** to determine if the target offers better risk-adjusted returns than the sector average.

#### 4. Dividends & Income
- Benchmark **Dividend Yield** and **Payout Ratio** for income-focused analysis.

---

### 📰 LATEST SECTOR NEWS (Google News)
- Provide a dedicated subsection for the **Target Stock** and each **Peer**.
- Bullet points based ONLY on provided news snippets from the JSON.
- Format: `[Ticker] headline (Date)`

---

### 💡 THE SECTOR VERDICT
- **Leader / Outperformer / Underperformer / Value Play / Speculative**
- **Summary**: A 3-4 sentence conclusion synthesizing why the target is better/worse than the peer group based on the data above.
