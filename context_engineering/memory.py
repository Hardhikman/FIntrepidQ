"""
SQLite-based memory for saving deep equity analysis reports and (optionally) chat.
"""

import sqlite3
from typing import List, Optional, Dict, Any


DB_PATH = "equity_ai.db"


def init_db() -> None:
    """Initialize the SQLite database and create tables if needed."""
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()

        # Analysis reports
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS analysis_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE,
                user_id TEXT,
                ticker TEXT,
                report TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        conn.commit()


# Initialize on import
init_db()


async def save_analysis_to_memory(
    session_id: str,
    user_id: str,
    ticker: str,
    report: str,
) -> None:
    """Persist a completed analysis report."""
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()

        cur.execute(
            """
            INSERT OR REPLACE INTO analysis_reports
            (session_id, user_id, ticker, report)
            VALUES (?, ?, ?, ?)
            """,
            (session_id, user_id, ticker, report),
        )

        conn.commit()


def get_latest_reports(user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Return metadata for recent reports for a user (optional helper)."""
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()

        cur.execute(
            """
            SELECT session_id, ticker, created_at
            FROM analysis_reports
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (user_id, limit),
        )

        rows = cur.fetchall()

    return [
        {"session_id": r[0], "ticker": r[1], "created_at": r[2]}
        for r in rows
    ]


def get_report(session_id: str) -> Optional[str]:
    """Fetch a saved report by session_id."""
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()

        cur.execute(
            "SELECT report FROM analysis_reports WHERE session_id = ?",
            (session_id,),
        )
        row = cur.fetchone()

    if row:
        return row[0]
    return None
