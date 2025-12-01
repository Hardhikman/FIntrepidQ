# Database Operations Reference Guide

Complete guide for all database operations available in the Intrepidq Equity Analysis system.

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Python Functions](#python-functions)
3. [CLI Tools](#cli-tools)
4. [Common Operations](#common-operations)
5. [Configuration](#configuration)

---

## Database Overview

**Database:** `equity_ai.db` (SQLite)  
**Table:** `analysis_reports`  
**Retention Policy:** Keep latest 3 reports per ticker (configurable)  
**Auto-Cleanup:** Enabled by default

**Schema:**
```sql
CREATE TABLE analysis_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE,
    user_id TEXT,
    ticker TEXT,
    report TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Indexes for performance
CREATE INDEX idx_ticker ON analysis_reports(ticker)
CREATE INDEX idx_ticker_created ON analysis_reports(ticker, created_at DESC)
```

---

## Python Functions

All functions are in `context_engineering/memory.py`

### Save Analysis Report

```python
from context_engineering.memory import save_analysis_to_memory

await save_analysis_to_memory(
    session_id="unique_session_id",
    user_id="analyst_name",
    ticker="TSLA",
    report="Full analysis report text...",
    auto_cleanup=True  # Optional, default True
)
```
- Saves analysis report to database
- Automatically cleans up old reports if `auto_cleanup=True`
- Keeps only latest 3 reports per ticker

---

### Get Report by Session ID

```python
from context_engineering.memory import get_report

report = get_report(session_id="your_session_id")
# Returns: report text string or None
```

---

### Get Latest Reports

```python
from context_engineering.memory import get_latest_reports

reports = get_latest_reports(user_id="analyst_name", limit=5)
# Returns: List of dicts with session_id, ticker, created_at
```

---

### Cleanup Old Reports

```python
from context_engineering.memory import cleanup_old_reports

deleted_count = cleanup_old_reports(ticker="TSLA", keep_latest_n=3)
# Returns: number of reports deleted
```

---

### Cleanup All Tickers

```python
from context_engineering.memory import cleanup_all_tickers

results = cleanup_all_tickers(keep_latest_n=3)
# Returns: dict mapping ticker -> deleted count
# Example: {"TSLA": 5, "AAPL": 3}
```

---

### Get Report Count

```python
from context_engineering.memory import get_report_count_by_ticker

count = get_report_count_by_ticker(ticker="TSLA")
# Returns: integer count
```

---

### Get All Ticker Counts

```python
from context_engineering.memory import get_all_ticker_counts

ticker_counts = get_all_ticker_counts()
# Returns: [{"ticker": "MSFT", "count": 13}, ...]
```

---

### Delete All Reports for Ticker

```python
from context_engineering.memory import delete_all_ticker_reports

deleted = delete_all_ticker_reports(ticker="TSLA")
# Returns: number of reports deleted
```

---

## CLI Tools

### Database Maintenance Tool (`db_fileops/db_maintenance.py`)

#### View Statistics

```bash
python db_fileops/db_maintenance.py stats
```
Shows:
- Total reports
- Unique tickers
- Database size
- Reports per ticker with excess warnings

---

#### Cleanup Database

**Preview cleanup (dry run):**
```bash
python db_fileops/db_maintenance.py cleanup --dry-run
```

**Execute cleanup (all tickers):**
```bash
python db_fileops/db_maintenance.py cleanup
```

**Cleanup specific ticker:**
```bash
python db_fileops/db_maintenance.py cleanup --ticker TSLA
```

**Cleanup with custom retention:**
```bash
python db_fileops/db_maintenance.py cleanup --keep 5
```

---

#### List All Tickers

```bash
python db_fileops/db_maintenance.py list-tickers
```
Shows all tickers with report counts and status

---

#### Delete All Reports for Ticker

```bash
python db_fileops/db_maintenance.py delete-ticker TSLA --confirm
```
⚠️ **WARNING:** Permanently deletes all reports for the ticker

---

### Database Viewer Tool (`db_fileops/view_db.py`)

#### List Reports

```bash
# List latest 10 reports
python db_fileops/view_db.py list-reports

# List latest 20 reports
python db_fileops/view_db.py list-reports 20
```

---

#### View Specific Report

**By report ID:**
```bash
python db_fileops/view_db.py view-report --report-id 123
```

**By session ID:**
```bash
python db_fileops/view_db.py view-report --session-id "abc123..."
```

**By ticker (latest):**
```bash
python db_fileops/view_db.py view-report --ticker TSLA
```

---

#### View Statistics

```bash
python db_fileops/view_db.py stats
```
Shows detailed statistics with cleanup recommendations

---

#### List All Tickers

```bash
python db_fileops/view_db.py list-tickers
```
Displays all tickers with counts and status indicators

---

#### Custom SQL Query

```bash
python db_fileops/view_db.py query "SELECT ticker, COUNT(*) FROM analysis_reports GROUP BY ticker"
```

---

## Common Operations

### Check Database Status

```bash
python db_fileops/db_maintenance.py stats
```

### Clean Up Excess Reports

```bash
# Preview first
python db_fileops/db_maintenance.py cleanup --dry-run

# Execute
python db_fileops/db_maintenance.py cleanup
```

### View Latest Report for Ticker

```bash
python db_fileops/view_db.py view-report --ticker TSLA
```

### See All Available Tickers

```bash
python db_fileops/view_db.py list-tickers
```

### Delete All Data for Specific Ticker

```bash
python db_fileops/db_maintenance.py delete-ticker AAPL --confirm
```

### Find Reports by Date

```bash
python db_fileops/view_db.py query "SELECT ticker, created_at FROM analysis_reports WHERE created_at > '2025-12-01' ORDER BY created_at DESC"
```

### Count Total Reports

```bash
python db_fileops/view_db.py query "SELECT COUNT(*) as total FROM analysis_reports"
```

---

## Configuration

### Retention Policy

Edit `context_engineering/memory.py`:

```python
REPORTS_TO_KEEP = 3  # Change to desired number
```

Or in `config.py`:

```python
DB_RETENTION = {
    "ACTIVE_REPORTS_PER_TICKER": 3,  # Keep latest N reports
    "AUTO_CLEANUP_ENABLED": True      # Enable auto-cleanup
}
```

### Disable Auto-Cleanup

When saving a report:

```python
await save_analysis_to_memory(
    session_id, user_id, ticker, report,
    auto_cleanup=False  # Disable automatic cleanup
)
```

---

## Database Location

**Path:** `c:\SmartQ\Intrepidq_equity\equity_ai.db`

To backup database:
```bash
copy equity_ai.db equity_ai_backup.db
```

To reset database:
```bash
del equity_ai.db
python -c "from context_engineering.memory import init_db; init_db()"
```

---

## Quick Reference

| Task | Command |
|------|---------|
| View stats | `python db_fileops/db_maintenance.py stats` |
| Cleanup | `python db_fileops/db_maintenance.py cleanup` |
| List tickers | `python db_fileops/view_db.py list-tickers` |
| View report | `python db_fileops/view_db.py view-report --ticker TSLA` |
| Delete ticker | `python db_fileops/db_maintenance.py delete-ticker TSLA --confirm` |

---

## Tips

💡 **Best Practices:**
- Run `cleanup` regularly to maintain database
- Use `--dry-run` before cleanup to preview
- Check `stats` to monitor database growth
- Backup database before bulk operations

⚠️ **Warnings:**
- `delete-ticker` is **permanent** - use with caution
- `cleanup` permanently deletes old reports (no archive)
- Always use `--confirm` flag for destructive operations
