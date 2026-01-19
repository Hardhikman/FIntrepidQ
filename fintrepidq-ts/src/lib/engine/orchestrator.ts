import { StateGraph, START, END, Annotation, MemorySaver } from "@langchain/langgraph";
import { AgentState } from "../types/shared";
import { collectFinancialsNode, scanStrategicCoreNode, scanStrategicQualitativeNode, scanStrategicRiskNode, scanStrategicIRNode, collectRecentNewsNode } from "./nodes/dataCollection";
import { validationNode } from "./nodes/validation";
import { analysisNode } from "./nodes/analysis";
import { synthesisNode } from "./nodes/synthesis";
import { serverLogger } from "../utils/logger";

/**
 * Node: Multi-Agent Supervisor
 */
async function portfolioManagerNode(state: AgentState): Promise<Partial<AgentState>> {
    serverLogger.header(state.ticker);
    serverLogger.phase("Agentic Handoff: Mission Start");
    serverLogger.time("Overall Analysis");
    return {
        ticker: state.ticker,
        agentConversation: [{
            agent: "Lead Portfolio Manager",
            message: `Initiating institutional deep-dive for ${state.ticker}. Deploying Extraction Agent for fundamental data and News Intelligence for strategic triggers.`,
            timestamp: new Date().toISOString()
        }]
    };
}

/**
 * Define the Graph State using Annotations
 */
const GraphState = Annotation.Root({
    ticker: Annotation<string>(),
    companyName: Annotation<string | undefined>(),
    financialData: Annotation<Record<string, any> | undefined>(),
    newsData: Annotation<Record<string, any> | undefined>(),
    rawSummary: Annotation<string | undefined>(),
    validationResult: Annotation<AgentState["validationResult"] | undefined>(),
    analysisResult: Annotation<AgentState["analysisResult"] | undefined>(),
    finalReport: Annotation<string | undefined>(),
    agentConversation: Annotation<AgentState["agentConversation"] | undefined>({
        reducer: (old, newVal) => [...(old || []), ...(newVal || [])],
        default: () => [],
    }),
    conflicts: Annotation<Array<Record<string, any>> | undefined>(),
    interruptAtHumanReview: Annotation<boolean | undefined>(),
});

/**
 * Node: Human Review Intermission
 */
async function humanReviewNode(state: AgentState): Promise<Partial<AgentState>> {
    serverLogger.phase("Human-in-the-Loop Review");
    serverLogger.info("Awaiting institutional authorization for deep-dive synthesis...");
    // In a real scenario with interrupt_before, this node only runs AFTER the user resumes.
    serverLogger.success("Authorization granted. Proceeding to Strategist.");
    serverLogger.info("Starting cognitive synthesis (this typically takes 15-30 seconds)...");
    return {
        agentConversation: [{
            agent: "Human (Institutional Investor)",
            message: "Reviewing metrics, completeness report, and strategic signals. Permission granted to proceed with cognitive synthesis and final thesis generation. ⏳ LLM analysis in progress (15-30s)...",
            timestamp: new Date().toISOString()
        }]
    };
}

/**
 * Conditional logic to abort if critical data is missing (Python parity)
 */
function shouldContinueAfterExtraction(state: AgentState): "continue" | "abort" {
    if (!state.financialData || Object.keys(state.financialData).length === 0) {
        serverLogger.error("CRITICAL: No financial data extracted. Aborting workflow.");
        return "abort";
    }
    return "continue";
}

/**
 * Persistent memory for Human-in-the-Loop interrupts
 * We use a global variable to ensure it survives Next.js HMR in dev mode.
 */
const globalForMemory = global as unknown as { __intrepid_memory?: MemorySaver };
const memory = globalForMemory.__intrepid_memory || new MemorySaver();
if (process.env.NODE_ENV !== "production") globalForMemory.__intrepid_memory = memory;

/**
 * Build the graph with parity to Python graph.py
 */
export function buildGraph() {
    console.log("[Engine] Building Graph...");
    const workflow = new StateGraph(GraphState)
        .addNode("portfolio_manager", portfolioManagerNode)
        .addNode("extraction_agent", collectFinancialsNode)
        .addNode("strategic_core_agent", scanStrategicCoreNode)
        .addNode("strategic_qualitative_agent", scanStrategicQualitativeNode)
        .addNode("strategic_risk_agent", scanStrategicRiskNode)
        .addNode("strategic_ir_agent", scanStrategicIRNode)
        .addNode("news_discovery_agent", collectRecentNewsNode)
        .addNode("qa_verification_agent", (state: any, config: any) => validationNode(state, { alphaVantageKey: config?.configurable?.alphaVantageKey }))
        .addNode("human_review", humanReviewNode)
        .addNode("hedge_fund_strategist", (state: any, config: any) => analysisNode(state, config?.configurable))
        .addNode("reporting_specialist", synthesisNode)

        // Agentic Flow (Sequential Team with Conditional Abort)
        .addEdge(START, "portfolio_manager")
        .addEdge("portfolio_manager", "extraction_agent")

        .addConditionalEdges("extraction_agent", shouldContinueAfterExtraction, {
            continue: "strategic_core_agent",
            abort: END
        })

        .addEdge("strategic_core_agent", "strategic_qualitative_agent")
        .addEdge("strategic_qualitative_agent", "strategic_risk_agent")
        .addEdge("strategic_risk_agent", "strategic_ir_agent")
        .addEdge("strategic_ir_agent", "news_discovery_agent")
        .addEdge("news_discovery_agent", "qa_verification_agent")
        .addEdge("qa_verification_agent", "human_review")
        .addEdge("human_review", "hedge_fund_strategist")
        .addEdge("hedge_fund_strategist", "reporting_specialist")
        .addEdge("reporting_specialist", END);

    // Compile with checkpointer and interrupt
    return workflow.compile({
        checkpointer: memory,
        interruptBefore: ["human_review"]
    });
}

/**
 * Execution Entry Point (Streaming)
 */
export async function* streamAnalysis(ticker: string | undefined, apiKey: string, alphaVantageKey?: string, threadId: string = "default") {
    console.log(`[Engine] Starting stream for ${ticker || "Resume"} (Thread: ${threadId})`);
    const app = buildGraph();

    const initialState = ticker ? {
        ticker: ticker.toUpperCase(),
        interruptAtHumanReview: true,
    } : null;

    if (!ticker) {
        console.log(`[Engine] Attempting to RESUME thread: ${threadId}`);
    }

    const stream = await app.stream(initialState, {
        configurable: { apiKey, alphaVantageKey, thread_id: threadId },
        streamMode: "updates",
    });

    for await (const chunk of stream) {
        console.log(`[Engine] Yielding chunk for node: ${Object.keys(chunk)[0]}`);
        yield chunk;
    }
    console.log("[Engine] Stream ended.");
}

/**
 * Execution Entry Point (Legacy)
 */
export async function runAnalysis(ticker: string | undefined, apiKey: string, alphaVantageKey?: string, threadId: string = "default") {
    const app = buildGraph();

    const initialState = ticker ? {
        ticker: ticker.toUpperCase(),
        interruptAtHumanReview: true,
    } : null;

    const finalState = await app.invoke(initialState, {
        configurable: { apiKey, alphaVantageKey, thread_id: threadId },
    });

    return finalState;
}
