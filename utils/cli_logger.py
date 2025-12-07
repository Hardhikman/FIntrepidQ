"""
IntrepidQ CLI Logger
Provides Rich-formatted logging with pseudo-GUI feel for the CLI.
"""

import time
from typing import Dict, Any, List, Optional
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.tree import Tree
from rich.style import Style
from rich.layout import Layout
from rich.box import DOUBLE

console = Console(width=100)

# ASCII Art Header
HEADER_ART = """
[bold cyan]██╗███╗   ██╗████████╗██████╗ ███████╗██████╗ ██╗██████╗  ██████╗ [/]
[bold blue]██║████╗  ██║╚══██╔══╝██╔══██╗██╔════╝██╔══██╗██║██╔══██╗██╔═══██╗[/]
[bold magenta]██║██╔██╗ ██║   ██║   ██████╔╝█████╗  ██████╔╝██║██║  ██║██║   ██║[/]
[bold magenta]██║██║╚██╗██║   ██║   ██╔══██╗██╔══╝  ██╔═══╝ ██║██║  ██║██║▄▄ ██║[/]
[bold blue]██║██║ ╚████║   ██║   ██║  ██║███████╗██║     ██║██████╔╝╚██████╔╝[/]
[bold cyan]╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═════╝  ╚══▀▀═╝ [/]
"""

class IntrepidQLogger:
    """
    Manages structured logging for the IntrepidQ application.
    Uses Rich to create a visual tree of execution.
    """
    
    def __init__(self):
        self.console = console
        self.current_tree = None
        self.current_task_node = None
        
    def print_header(self):
        """Print the application header."""
        self.console.print(Panel(
            Text("Welcome to IntrepidQ", justify="center", style="bold white"),
            box=DOUBLE,
            style="cyan",
            width=100
        ))
        self.console.print(HEADER_ART)
        self.console.print(Text("Your AI assistant for equity analysis.\n", justify="center", style="dim"))

    def start_section(self, title: str, style: str = "bold cyan"):
        """Start a new major section (like a phase of analysis)."""
        self.console.print()
        self.console.print(f"[{style}]>> {title}[/{style}]")
        self.current_tree = None # Reset tree for new section

    def log_step(self, message: str, emoji: str = "🔹"):
        """Log a generic step."""
        self.console.print(f" {emoji} {message}")

    def log_success(self, message: str):
        """Log a success message."""
        self.console.print(f"[green] ✓ {message}[/green]")

    def log_warning(self, message: str):
        """Log a warning."""
        self.console.print(f"[yellow] ⚠ {message}[/yellow]")
    
    def log_error(self, message: str):
        """Log an error."""
        self.console.print(f"[red] ✗ {message}[/red]")

    def start_task(self, task_name: str):
        """Start a specific task visualization."""
        self.console.print(f"[bold blue] ▶ Task:[/bold blue] {task_name}")
        # We can implement a visual indicator here
        
    def log_tool_used(self, tool_name: str, args: Any = None, result: Any = None):
        """Log that a tool was used."""
        tool_msg = f"[bold magenta]⚡ {tool_name}[/bold magenta]"
        if args:
            args_str = str(args)
            if len(args_str) > 60:
                args_str = args_str[:57] + "..."
            tool_msg += f" [dim]({args_str})[/dim]"
        
        self.console.print(f"   {tool_msg}")
        
        if result:
            res_str = str(result)
            if len(res_str) > 100:
                res_str = res_str[:97] + "..."
            self.console.print(f"     [dim]→ {res_str}[/dim]")

    def print_panel(self, content: str, title: str, style: str = "cyan"):
        """Print detailed content in a panel."""
        self.console.print(Panel(content, title=title, border_style=style))

# Global instance
logger = IntrepidQLogger()
