# Agent Data Flow: Collection to Analysis

This document describes how data is passed between the **Data Collection Agent** and the **Analysis Agent** within the Intrepidq Equity workflow.

## 🔄 The Hybrid Data Flow

The system uses a multi-layered approach to ensure that the Analysis Agent has both the quantitative precision of raw data and the qualitative context from the collection phase.

### 1. Extraction from Tool History
After the Data Collection Agent completes its execution, the system does not solely rely on the agent's textual summary. Instead, Python logic in `agents/data_agent.py` "intercepts" the process by looking back at the **ToolMessage** history.

*   **Financials**: Raw dictionaries are extracted from the `get_deep_financials` tool response.
*   **News**: Recent headlines and strategic signals are extracted from `check_strategic_triggers`, `search_google_news`, and `web_search`.

### 2. Formats Sent to Analysis
The `AgentState` passes three distinct components to the Analysis Agent:

| Component | Format | Nature | Source |
| :--- | :--- | :--- | :--- |
| `financial_data` | Python Dict (JSON) | **Raw** | Tool Outputs |
| `news_data` | Python Dict (JSON) | **Raw** | Tool Outputs |
| `raw_output` | String | **Summarized** | Data Agent's Narrative |

### 3. Prompt Injection
When the Analysis Agent (`agents/analysis_agent.py`) prepares its prompt, it converts the structured dictionaries back into JSON strings and strikes a balance:

```python
# Pseudo-code logic in analysis_agent.py
data_str = (
    f"FINANCIAL DATA: {json.dumps(financial_data)}" + 
    f"NEWS DATA: {json.dumps(news_data)}" + 
    f"OTHER CONTEXT: {data_agent_summary}"
)
```

## 📄 Aligned Data Flow (Analysis & Synthesis)

The workflow has been aligned to ensure that the agent with the specialized skills (the **Analysis Agent**) is the one responsible for the structured report generation.

| Category | Agent | Access | Role |
| :--- | :--- | :--- | :--- |
| **Analysis** | Senior Analyst | **Raw JSON** + Narrative | **Structuring**: Generates the full report (Tables, Flags, Thesis) using `SKILL.md` rules. |
| **Synthesis** | Lead Strategist | **Raw JSON** + Narrative | **Editing**: Integrates Validation data, finalizes metadata, and polishes the Analysis for the final report. |

### Comparison of Data Types in Prompts

Both agents now receive identical "Data Context" blocks containing:
*   **FINANCIAL DATA**: Raw JSON from `get_deep_financials`.
*   **NEWS & STRATEGIC SIGNALS**: Raw JSON from search/news tools.
*   **OTHER CONTEXT**: The Data Agent's narrative summary.

## 🧠 Why This Matters

1.  **Quantitative Precision**: Both agents avoid "hallucination risk" by working directly with tool JSON rather than relying on a previous agent's summary of the numbers.
2.  **Rules-Based Accuracy**: Because the Analysis Agent handles the report structure (including the Metrics Table), it applies the exact mathematical rules from `SKILL.md` (like RSI thresholds) directly to the final report schema.
3.  **Source Attribution**: The Synthesis Agent cross-references the Analysis output with Raw News JSON to ensure sources (e.g., `reuters.com`) are correctly cited.

## 🚧 Current Limitations

*   **Extraction Complexity**: The system relies on custom regex and parsing logic in `data_agent.py` to "cheat" and find raw data in the message history.
*   **Context Fragmentation**: Because collection and analysis are separate steps, the Analysis Agent cannot "go back" and ask for more details if the extracted data is incomplete.

---
*Last Updated: December 19, 2025*
