import { AgentState } from "../../types/shared";
import { serverLogger } from "../../utils/logger";

/**
 * Synthesis Node
 * Formats the final report for the user.
 */
export async function synthesisNode(state: AgentState): Promise<Partial<AgentState>> {
    serverLogger.phase("Final Synthesis");
    const { ticker, analysisResult, validationResult, companyName } = state;
    serverLogger.step("Report finalized and ready for transmission.", "✓");

    const completeness = validationResult?.completenessScore || 0;
    const confidence = validationResult?.confidenceLevel || "Low";

    let dataQualitySection = `## ⚠️ Data Quality & Confidence\n- **Confidence Level**: ${confidence}\n- **Completeness**: ${completeness.toFixed(0)}%\n`;

    if (completeness < 70) {
        dataQualitySection += `> [!WARNING]\n> **DATA QUALITY ALERT**: This report is based on partial data (${completeness.toFixed(0)}%). Institutional caution is advised. Missing: ${validationResult?.missingCriticalMetrics.join(", ")}\n\n`;
    }

    const metadata = `## Report Metadata\n- **Analysis Date**: ${new Date().toLocaleDateString()}\n- **Asset**: ${companyName || ticker}\n- **Engine**: FIntrepidQ Multi-Agent (v3)\n\n`;

    const finalReport = `${metadata}\n${dataQualitySection}\n${analysisResult?.thesis || "Analysis unavailable."}`;

    serverLogger.timeEnd("Overall Analysis");

    return {
        finalReport,
        agentConversation: [{
            agent: "Reporting Specialist",
            message: `Final equity analysis report for ${ticker} is published and formatted. ${completeness < 70 ? "Data quality warning included." : "Data verified."} Mission complete.`,
            timestamp: new Date().toISOString()
        }]
    };
}
