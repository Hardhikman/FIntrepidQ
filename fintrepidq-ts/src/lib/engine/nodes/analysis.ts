import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState } from "../../types/shared";
import { ANALYSIS_AGENT_PROMPT } from "../assets/prompts/AnalysisAgent";
import { evaluateAllSignals, EvaluatedSignal, SKILL_THRESHOLDS } from "../assets/skills/equityTriggerAnalysis";
import { serverLogger } from "../../utils/logger";

/**
 * Analysis Node
 * Uses LLM to synthesize data into institutional-grade signals.
 * Thresholds are sourced from SKILL.md via equityTriggerAnalysis.ts
 */
export async function analysisNode(state: AgentState, config?: { apiKey?: string }): Promise<Partial<AgentState>> {
    serverLogger.phase("AI Synthesis & Analysis");
    const { ticker, financialData, newsData, validationResult } = state;

    if (!config?.apiKey) {
        serverLogger.error("Refusing to analyze: Missing Gemini API Key.");
        throw new Error("Missing Gemini API Key for Analysis Agent");
    }

    serverLogger.step("Initiating cognitive deep-dive for " + ticker + "...", "🧠");
    serverLogger.info("This may take 15-30 seconds for complex analyses.");

    const llm = new ChatGoogleGenerativeAI({
        apiKey: config.apiKey,
        model: "gemini-2.5-flash",
        temperature: 0.2,
    });

    // --- Computed Intelligence Layer (Using SKILL.md Thresholds) ---
    const computedSignals = evaluateAllSignals(financialData);

    // Detect Strategic Correlations (from SKILL.md strategic_correlations)
    const growth = financialData?.growth || {};
    const technicals = financialData?.technicals || {};
    const strategicInferences: string[] = [];

    // Self-funded growth: CapEx increasing + Debt decreasing
    if (growth.debtTrend === "decreasing" && technicals.volatility < SKILL_THRESHOLDS.risk.volatility.low) {
        strategicInferences.push("Self-funded growth pattern detected (Deleveraging + Low Vol)");
    }
    // Cash-rich expansion: Revenue + FCF both increasing
    if (growth.revenueTrend === "increasing" && growth.fcfTrend === "increasing") {
        strategicInferences.push("Cash-rich expansion phase (Rev ↑ + FCF ↑)");
    }
    // Leveraged expansion risk: CapEx increasing + Debt increasing
    if (growth.capexTrend === "increasing" && growth.debtTrend === "increasing") {
        strategicInferences.push("⚠️ Leveraged expansion (CapEx ↑ + Debt ↑ = Risky)");
    }

    // Format signals for LLM prompt
    const signalSummary = computedSignals
        .map(s => `[${s.category}] ${s.metric}: ${s.value} → ${s.icon} ${s.signal}`)
        .join("\n");

    // Inject Hybrid Data into Prompt (optimized for speed/parity)
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const promptData = [
        `FINANCIAL DATA:\n${JSON.stringify(financialData, null, 2)}`,
        `NEWS & STRATEGIC SIGNALS:\n${JSON.stringify(state.newsData, null, 2)}`,
        `OTHER CONTEXT:\n${state.rawSummary}`
    ].join("\n\n");

    const prompt = `${ANALYSIS_AGENT_PROMPT}

CURRENT_DATE: ${currentDate}
TICKER: ${ticker}
COMPANY: ${state.companyName || ticker}

DATA QUALITY: ${validationResult?.completenessScore}% complete | ${validationResult?.confidenceLevel} confidence
${validationResult?.missingCriticalMetrics?.length ? `Missing: ${validationResult.missingCriticalMetrics.join(", ")}` : ""}

COMPUTED SIGNALS:
${signalSummary}
${strategicInferences.length > 0 ? `\nINFERENCES: ${strategicInferences.join(" | ")}` : ""}

Here is the collected data for ${ticker}:

${promptData}

Generate the Equity Analysis Report for ${state.companyName || ticker} (${ticker}). Use CURRENT_DATE for the Analysis Date. Reference news sources and dates from the NEWS & STRATEGIC SIGNALS section for citations.`;

    const response = await llm.invoke(prompt);
    serverLogger.success("Cognitive synthesis complete.");

    // Map evaluated signals to Signal type for AgentState
    const mappedSignals = computedSignals.map(s => ({
        category: s.category as any,
        metric: s.metric,
        value: s.value,
        signal: s.signal,
        icon: s.icon as any
    }));

    return {
        analysisResult: {
            thesis: String(response.content),
            verdict: String(response.content).includes("BUY") ? "BUY" : String(response.content).includes("SELL") ? "SELL" : "HOLD",
            greenFlags: mappedSignals.filter(s => s.icon === "🟢"),
            redFlags: mappedSignals.filter(s => s.icon === "🚩" || s.icon === "💀"),
            metricsTable: mappedSignals,
            technicalProfile: {
                ...(financialData?.technicals || {}),
                sma200Weeks: financialData?.technicals?.sma200Weeks,
                macd: financialData?.technicals?.macd,
            },
            riskProfile: {
                ...(financialData?.risk || {}),
                growthTrends: financialData?.growth,
            },
        },
        agentConversation: [{
            agent: "Hedge Fund Strategist",
            message: `Deep-dive synthesis complete for ${ticker}. Generated a high-conviction ${String(response.content).includes("BUY") ? "BUY" : String(response.content).includes("SELL") ? "SELL" : "HOLD"} thesis. Handing off to Reporting Specialist for final briefing.`,
            timestamp: new Date().toISOString()
        }]
    };
}
