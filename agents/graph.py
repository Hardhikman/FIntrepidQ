from typing import TypedDict, Annotated, List, Dict, Any, Union
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
import time

from agents.data_agent import run_data_collection
from agents.validation_agent import run_validation
from agents.analysis_agent import run_analysis
from agents.synthesis_agent import run_synthesis
from utils.cli_logger import analysis_logger, error_logger

class AgentState(TypedDict):
    ticker: str
    data_result: Dict[str, Any]
    validation_result: Dict[str, Any]
    analysis_result: Dict[str, Any]
    final_report: str
    conflicts: List[Dict[str, Any]]

#Node Wrappers

async def data_collection_node(state: AgentState):
    from utils.cli_logger import logger
    ticker = state.get("ticker")
    start_time = time.time()
    
    if not ticker:
        error_logger.log_validation_error("ticker", ticker, "Missing ticker in state")
        raise ValueError("Missing 'ticker' in state for data_collection_node")
    
    # Explicit phase start logging
    logger.tracker.start_phase("Data Collection")
    logger.phase_detail("Data Collection", f"Collecting data for {ticker}")
    logger.console.print(f"\n[bold cyan]▶ Phase 1: Data Collection[/bold cyan] - Fetching financials, news, and signals for {ticker}")
    analysis_logger.log_phase_start("Data Collection", ticker)
    
    try:
        result = await run_data_collection(ticker)
        duration = time.time() - start_time
        
        logger.console.print(f"[green]✓ Data Collection complete[/green]")
        analysis_logger.log_phase_complete("Data Collection", ticker, duration)
        
        return {"data_result": result}
    except Exception as e:
        duration = time.time() - start_time
        error_logger.log_exception("data_collection_node", ticker, "Data Collection")
        logger.console.print(f"[red]✗ Data Collection failed: {e}[/red]")
        
        # Return error state instead of crashing
        return {
            "data_result": {
                "ticker": ticker,
                "status": "error",
                "error": str(e),
                "raw_output": "",
                "financial_data": {}
            }
        }

async def validation_node(state: AgentState):
    from utils.cli_logger import logger
    ticker = state.get("ticker")
    data_result = state.get("data_result", {})
    start_time = time.time()
    
    if not ticker:
        error_logger.log_validation_error("ticker", ticker, "Missing ticker in state")
        raise ValueError("Missing 'ticker' in state for validation_node")
    
    # Check if data collection failed
    if data_result.get("status") == "error":
        logger.console.print(f"[yellow]⚠ Skipping validation - data collection failed[/yellow]")
        return {
            "validation_result": {
                "ticker": ticker,
                "status": "skipped",
                "validation_report": "⚠️ Validation skipped due to data collection failure.",
                "completeness_score": 0,
                "confidence_level": "Low",
                "conflicts": [],
                "enriched_data": {}
            },
            "conflicts": []
        }
    
    # Phase tracking with spinner
    logger.tracker.start_phase("Validation")
    logger.phase_detail("Validation", f"Validating data for {ticker}")
    logger.console.print(f"\n[bold cyan]▶ Phase 2: Validation[/bold cyan] - Checking data quality and completeness")
    analysis_logger.log_phase_start("Validation", ticker)
    
    try:
        result = await run_validation(ticker, data_result)
        duration = time.time() - start_time
        
        logger.console.print(f"[green]✓ Validation complete[/green] - Completeness: {result.get('completeness_score', 0):.0f}%")
        analysis_logger.log_phase_complete("Validation", ticker, duration)
        
        return {
            "validation_result": result,
            "conflicts": result.get("conflicts", [])
        }
    except Exception as e:
        duration = time.time() - start_time
        error_logger.log_exception("validation_node", ticker, "Validation")
        logger.console.print(f"[red]✗ Validation failed: {e}[/red]")
        
        return {
            "validation_result": {
                "ticker": ticker,
                "status": "error",
                "validation_report": f"⚠️ Validation failed: {e}",
                "completeness_score": 0,
                "confidence_level": "Low",
                "conflicts": [],
                "enriched_data": data_result.get("financial_data", {})
            },
            "conflicts": []
        }

async def human_review_node(state: AgentState):
    # This node is a pass-through. 
    # The interrupt happens BEFORE this node is executed.
    # When we resume, the state (specifically data_result) will have been updated by the user.
    return {}

async def analysis_node(state: AgentState):
    from utils.cli_logger import logger
    ticker = state["ticker"]
    data_result = state["data_result"]
    validation_result = state.get("validation_result", {})
    start_time = time.time()
    
    # Phase tracking with spinner
    logger.tracker.start_phase("Analysis")
    logger.phase_detail("Analysis", f"Analyzing {ticker}")
    logger.console.print(f"\n[bold cyan]▶ Phase 3: Analysis[/bold cyan] - Generating investment thesis for {ticker}")
    analysis_logger.log_phase_start("Analysis", ticker)
    
    # Use enriched data if available (data filled from Alpha Vantage)
    enriched_data = validation_result.get("enriched_data")
    if enriched_data:
        data_result = {**data_result, "financial_data": enriched_data}
    
    try:
        result = await run_analysis(ticker, data_result)
        duration = time.time() - start_time
        
        logger.console.print(f"[green]✓ Analysis complete[/green]")
        analysis_logger.log_phase_complete("Analysis", ticker, duration)
        
        return {"analysis_result": result}
    except Exception as e:
        duration = time.time() - start_time
        error_logger.log_exception("analysis_node", ticker, "Analysis")
        logger.console.print(f"[red]✗ Analysis failed: {e}[/red]")
        
        return {
            "analysis_result": {
                "ticker": ticker,
                "status": "error",
                "analysis_output": f"⚠️ Analysis failed: {e}"
            }
        }

async def synthesis_node(state: AgentState):
    from utils.cli_logger import logger
    ticker = state["ticker"]
    analysis_result = state["analysis_result"]
    validation_result = state["validation_result"]
    data_result = state["data_result"]
    start_time = time.time()
    
    # Phase tracking with spinner
    logger.tracker.start_phase("Synthesis")
    logger.phase_detail("Synthesis", f"Generating report for {ticker}")
    logger.console.print(f"\n[bold cyan]▶ Phase 4: Synthesis[/bold cyan] - Compiling final report for {ticker}")
    analysis_logger.log_phase_start("Synthesis", ticker)
    
    try:
        report = await run_synthesis(ticker, analysis_result, validation_result, data_result)
        duration = time.time() - start_time
        
        logger.console.print(f"[green]✓ Synthesis complete[/green]")
        analysis_logger.log_phase_complete("Synthesis", ticker, duration)
        
        return {"final_report": report}
    except Exception as e:
        duration = time.time() - start_time
        error_logger.log_exception("synthesis_node", ticker, "Synthesis")
        logger.console.print(f"[red]✗ Synthesis failed: {e}[/red]")
        
        # Return a minimal error report
        error_report = f"""# {ticker} - Analysis Report

## ⚠️ Error

The analysis could not be completed due to an error in the synthesis phase.

**Error:** {e}

Please try again or check the logs for more details.
"""
        return {"final_report": error_report}

#Conditional Logic

def should_human_review(state: AgentState):
    if state.get("conflicts") and len(state["conflicts"]) > 0:
        return "human_review"
    return "analysis"

#Graph Construction

def build_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("data_collection", data_collection_node)
    workflow.add_node("validation", validation_node)
    workflow.add_node("human_review", human_review_node)
    workflow.add_node("analysis", analysis_node)
    workflow.add_node("synthesis", synthesis_node)
    
    workflow.set_entry_point("data_collection")
    
    # Conditional edge: Abort if data collection failed critically
    def should_continue_after_data_collection(state: AgentState):
        data_result = state.get("data_result", {})
        if data_result.get("status") == "error":
            # Critical failure - abort workflow
            return "abort"
        return "continue"
    
    workflow.add_conditional_edges(
        "data_collection",
        should_continue_after_data_collection,
        {
            "continue": "validation",
            "abort": END  # Stop workflow on critical failure
        }
    )
    
    workflow.add_conditional_edges(
        "validation",
        should_human_review,
        {
            "human_review": "human_review",
            "analysis": "analysis"
        }
    )
    
    workflow.add_edge("human_review", "analysis")
    workflow.add_edge("analysis", "synthesis")
    workflow.add_edge("synthesis", END)
    
    # Compile with checkpointer to enable interrupts
    memory = MemorySaver()
    app = workflow.compile(checkpointer=memory, interrupt_before=["human_review"])
    
    return app
