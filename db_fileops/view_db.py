"""
Simple script to view and query the equity_ai.db SQLite database.
"""

import sys
import os

# Add parent directory to path to allow imports from context_engineering
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import sqlite3
from rich.console import Console
from rich.table import Table
import typer

app = typer.Typer()
console = Console()

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "equity_ai.db")


@app.command()
def list_reports(limit: int = 10):
    """List all analysis reports in the database."""
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        
        cur.execute(
            """
            SELECT id, session_id, user_id, ticker, 
                   substr(report, 1, 100) as report_preview,
                   created_at
            FROM analysis_reports
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,)
        )
        
        rows = cur.fetchall()
    
    if not rows:
        console.print("[yellow]No reports found in database.[/yellow]")
        return
    
    table = Table(title=f"Analysis Reports (Latest {limit})")
    table.add_column("ID", style="cyan")
    table.add_column("Session ID", style="magenta")
    table.add_column("User ID", style="green")
    table.add_column("Ticker", style="yellow")
    table.add_column("Preview", style="white")
    table.add_column("Created At", style="blue")
    
    for row in rows:
        table.add_row(
            str(row[0]),
            row[1][:20] + "..." if len(row[1]) > 20 else row[1],
            row[2],
            row[3],
            row[4] + "..." if row[4] else "",
            row[5]
        )
    
    console.print(table)


@app.command()
def view_report(session_id: str = None, ticker: str = None, report_id: int = None):
    """View a full report by session_id, ticker (latest), or report ID."""
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        
        if report_id:
            cur.execute(
                "SELECT ticker, report, created_at FROM analysis_reports WHERE id = ?",
                (report_id,)
            )
        elif session_id:
            cur.execute(
                "SELECT ticker, report, created_at FROM analysis_reports WHERE session_id = ?",
                (session_id,)
            )
        elif ticker:
            cur.execute(
                """
                SELECT ticker, report, created_at FROM analysis_reports 
                WHERE ticker = ? 
                ORDER BY created_at DESC 
                LIMIT 1
                """,
                (ticker.upper(),)
            )
        else:
            console.print("[red]Please provide either --session-id, --ticker, or --report-id[/red]")
            return
        
        row = cur.fetchone()
    
    if not row:
        console.print("[yellow]No report found.[/yellow]")
        return
    
    console.print(f"\n[bold cyan]Ticker:[/bold cyan] {row[0]}")
    console.print(f"[bold cyan]Created:[/bold cyan] {row[2]}\n")
    console.print("[bold yellow]" + "=" * 80 + "[/bold yellow]")
    console.print(row[1])
    console.print("[bold yellow]" + "=" * 80 + "[/bold yellow]\n")


@app.command()
def stats():
    """Show database statistics."""
    from context_engineering.memory import get_all_ticker_counts
    
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        
        # Total reports
        cur.execute("SELECT COUNT(*) FROM analysis_reports")
        total = cur.fetchone()[0]
        
        # Reports by ticker
        cur.execute(
            """
            SELECT ticker, COUNT(*) as count 
            FROM analysis_reports 
            GROUP BY ticker 
            ORDER BY count DESC
            """
        )
        by_ticker = cur.fetchall()
        
        # Reports by user
        cur.execute(
            """
            SELECT user_id, COUNT(*) as count 
            FROM analysis_reports 
            GROUP BY user_id 
            ORDER BY count DESC
            """
        )
        by_user = cur.fetchall()
    
    console.print(f"\n[bold cyan]Total Reports:[/bold cyan] {total}\n")
    
    if by_ticker:
        table = Table(title="Reports by Ticker")
        table.add_column("Ticker", style="yellow")
        table.add_column("Count", style="green")
        table.add_column("Status", style="white")
        
        excess_total = 0
        for ticker, count in by_ticker:
            if count > 3:
                status = f"⚠️  {count - 3} excess"
                excess_total += (count - 3)
            else:
                status = "✓ OK"
            
            table.add_row(ticker, str(count), status)
        
        console.print(table)
        
        if excess_total > 0:
            console.print(f"\n[yellow]💡 {excess_total} excess report(s) found. Run: python db_fileops/db_maintenance.py cleanup[/yellow]")
    
    if by_user:
        console.print()
        table = Table(title="Reports by User")
        table.add_column("User ID", style="magenta")
        table.add_column("Count", style="green")
        
        for user_id, count in by_user:
            table.add_row(user_id, str(count))
        
        console.print(table)
    
    console.print()


@app.command()
def query(sql: str):
    """Execute a custom SQL query on the database."""
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cur = conn.cursor()
            cur.execute(sql)
            
            if sql.strip().upper().startswith("SELECT"):
                rows = cur.fetchall()
                columns = [description[0] for description in cur.description]
                
                if not rows:
                    console.print("[yellow]No results.[/yellow]")
                    return
                
                table = Table(title="Query Results")
                for col in columns:
                    table.add_column(col, style="cyan")
                
                for row in rows:
                    table.add_row(*[str(val) for val in row])
                
                console.print(table)
            else:
                conn.commit()
                console.print(f"[green]Query executed successfully. Rows affected: {cur.rowcount}[/green]")
    
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


@app.command()
def list_tickers():
    """List all tickers in the database with report counts."""
    from context_engineering.memory import get_all_ticker_counts
    
    ticker_counts = get_all_ticker_counts()
    
    if not ticker_counts:
        console.print("[yellow]No tickers found in database[/yellow]")
        return
    
    table = Table(title=f"All Tickers ({len(ticker_counts)} total)")
    table.add_column("#", style="dim")
    table.add_column("Ticker", style="cyan bold")
    table.add_column("Reports", style="green")
    table.add_column("Status", style="white")
    
    for idx, item in enumerate(ticker_counts, 1):
        ticker = item["ticker"]
        count = item["count"]
        
        if count > 3:
            status = f"[yellow]⚠️  {count - 3} excess[/yellow]"
        else:
            status = "[green]✓ OK[/green]"
        
        table.add_row(str(idx), ticker, str(count), status)
    
    console.print(table)


if __name__ == "__main__":
    app()
