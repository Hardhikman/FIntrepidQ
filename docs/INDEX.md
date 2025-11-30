# Documentation Index

Welcome to the IntrepidQ Equity Analysis documentation. This multi-agent system provides comprehensive, time-stamped equity research reports.

## 📚 Documentation Files

### Getting Started
- **[README.md](../README.md)** - Installation, quick start, and multi-agent overview
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete project overview and architecture

### Multi-Agent System
- **[Multi-Agent Architecture](Multi-Agent Architecture)** - Agent pipeline walkthrough and technical details
- **[validation_agent.md](validation_agent.md)** - Data quality validation system and confidence scoring

### Features
- **[advanced_metrics.md](advanced_metrics.md)** - Volume trends, dividend tracking, CapEx, and retained earnings
- **[walkthrough.md](walkthrough.md)** - Feature walkthrough and usage examples

### Technical Documentation
- **[gap_analysis.md](gap_analysis.md)** - Requirements coverage assessment

## 🎯 Quick Links

### For Users
1. Start with [README.md](../README.md) for installation and usage
2. Read [validation_agent.md](validation_agent.md) to understand data quality scores
3. Check [advanced_metrics.md](advanced_metrics.md) for metric definitions

### For Developers  
1. Review the Multi-Agent Architecture walkthrough
2. See [gap_analysis.md](gap_analysis.md) for requirements coverage
3. Check [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for technical architecture

## 🤖 Multi-Agent System

The IntrepidQ system uses a **4-agent pipeline**:

1. **Data Collection Agent** - Gathers financials, news, and web search results
2. **Validation Agent** - Checks data completeness (0-100% score)
3. **Analysis Agent** - Generates investment thesis using skills/frameworks
4. **Synthesis Agent** - Compiles final report with timeline metadata

### Pipeline Flow
```
Data Collection → Validation → Analysis → Synthesis → Time-Stamped Report
```

## 📊 System Capabilities

- **96% Coverage** of professional equity analysis requirements
- **Multi-Agent Architecture** with LangGraph orchestration
- **Quantitative Analysis**: Technicals, fundamentals, risk metrics
- **Qualitative Analysis**: Management, brand, macro factors, ESG
- **Validation System**: Automatic data quality checking with confidence scores
- **Timeline Tracking**: Reports include analysis date, fiscal quarter, and time-stamped metrics
- **Google News Integration**: Recent news with dates
- **Trend Analysis**: Quarterly tracking with specific periods

## 🚀 Usage

```bash
# Standard analysis with report saved to file
python main.py analyze MSFT

# Analysis without saving to file
python main.py analyze AAPL --no-save-file

# Interactive chat mode
python main.py chat
```

## 📈 Report Features

Every report includes:
- **Report Metadata**: Analysis date, data period, fiscal quarter
- **Executive Summary**: Verdict (Buy/Sell/Hold) with key rationale
- **Data Quality**: Completeness score and confidence level
- **Detailed Analysis**: Time-stamped financial metrics, strategic position, risks
- **Strategic Signals**: Dated news and events
- **Conclusion**: Final recommendation

## 🛠️ Technologies

- **LangGraph**: Multi-agent orchestration
- **Google Gemini**: Large language model
- **LangChain**: Agent framework
- **yfinance**: Financial data
- **DuckDuckGo**: Web search
- **Google News**: News aggregation

See individual documentation files for detailed information on each feature.
