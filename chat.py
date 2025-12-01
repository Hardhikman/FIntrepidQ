"""
Interactive Chat Interface for Intrepidq Equity Analysis.
Allows users to query the database and perform hybrid research via CLI.
"""

import asyncio
import typer
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.prompt import Prompt

from agents.chat_agent import build_chat_agent


app = typer.Typer()
console = Console()

@app.callback()
def callback():
    """
    Intrepidq Equity Chat CLI
    """

async def run_chat_loop(initial_ticker: str = None):
    """
    Main chat loop.
    """
    console.print(Panel.fit(
        "[bold cyan]🤖 Intrepidq Equity Chat[/bold cyan]\n\n"
        "Ask questions about your analyzed stocks.\n"
        "Type [bold yellow]/help[/bold yellow] for commands, [bold yellow]/exit[/bold yellow] to quit.",
        border_style="cyan"
    ))

    agent = build_chat_agent()
    
    # Initialize chat history
    chat_history = []
    
    # If initial ticker provided, set context
    if initial_ticker:
        initial_msg = f"Tell me about {initial_ticker} based on the analysis."
        console.print(f"\n[bold green]You:[/bold green] {initial_msg}")
        
        # Add to history
        chat_history.append({"role": "user", "content": initial_msg})
        
        with console.status("[bold green]Thinking...[/bold green]"):
            result = await agent.ainvoke({"messages": chat_history})
            response = result["messages"][-1].content
            
        chat_history.append({"role": "assistant", "content": response})
        console.print("\n[bold blue]AI:[/bold blue]")
        console.print(Markdown(response))

    while True:
        try:
            user_input = Prompt.ask("\n[bold green]You[/bold green]")
            user_input = user_input.strip()
            
            if not user_input:
                continue
                
            # Commands
            if user_input.lower() in ["/exit", "/quit", "exit", "quit"]:
                console.print("[yellow]Goodbye![/yellow]")
                break
                
            if user_input.lower() == "/help":
                console.print(Panel(
                    "[bold]Commands:[/bold]\n"
                    "- /tickers : List analyzed tickers\n"
                    "- /clear   : Clear conversation history\n"
                    "- /exit    : Exit chat\n",
                    title="Help"
                ))
                continue
                
            if user_input.lower() == "/tickers":
                # We can let the agent handle this via tool, or do it directly.
                # Let's let the agent handle it to maintain "chat" feel, 
                # but we can hint the user to ask "What tickers have you analyzed?"
                user_input = "List all analyzed tickers."
            
            if user_input.lower() == "/clear":
                chat_history = []
                console.print("[yellow]Conversation history cleared.[/yellow]")
                continue

            # Add user message to history
            chat_history.append({"role": "user", "content": user_input})
            
            with console.status("[bold green]Thinking...[/bold green]"):
                # Pass full history to agent
                result = await agent.ainvoke({"messages": chat_history})
                response = result["messages"][-1].content
            
            # Add assistant response to history
            chat_history.append({"role": "assistant", "content": response})
            
            console.print("\n[bold blue]AI:[/bold blue]")
            console.print(Markdown(response))
            
        except KeyboardInterrupt:
            console.print("\n[yellow]Goodbye![/yellow]")
            break
        except Exception as e:
            console.print(f"\n[red]Error: {e}[/red]")

@app.command()
def start(ticker: str = None):
    """Start the chat interface."""
    asyncio.run(run_chat_loop(ticker))

if __name__ == "__main__":
    app()
