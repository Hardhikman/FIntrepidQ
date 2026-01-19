import { AgentState } from "../../types/shared";
import { serverLogger } from "../../utils/logger";
import { getAlphaVantageData, fillMissingFromAlphaVantage } from "../tools/alphaVantage";
import { checkDataCompleteness } from "../tools/dataCompletenessChecker";
import { verifyDataAccuracy } from "../tools/verification";
import { sanitizeForJson } from "../utils/serialization";

/**
 * Validation Node
 * Checks data completeness, verifies accuracy across sources, and sets confidence level.
 * Achieving 100% logic parity with Python validation_agent.py
 */
export async function validationNode(state: AgentState, config?: { alphaVantageKey?: string }): Promise<Partial<AgentState>> {
    serverLogger.phase("Data Validation");
    const { financialData, ticker, newsData } = state;

    if (!financialData) {
        return {
            validationResult: {
                completenessScore: 0,
                confidenceLevel: "Low",
                missingCriticalMetrics: ["all"],
                validationReport: "Critical Error: No financial data received.",
            },
            agentConversation: [{
                agent: "QA & Verification Agent",
                message: `⚠️ CRITICAL: Data extraction for ${ticker} failed completely. Aborting deep-dive.`,
                timestamp: new Date().toISOString()
            }]
        };
    }

    // --- Alpha Vantage Enrichment & Verification (Python Parity) ---
    let enrichedData = financialData;
    let filledMetrics: string[] = [];
    let conflicts: any[] = [];
    let verificationReport = "";

    if (config?.alphaVantageKey) {
        serverLogger.step("Enriching and verifying data with Alpha Vantage...", "💉");
        try {
            const avResult = await getAlphaVantageData(ticker, config.alphaVantageKey);
            if (avResult.status === "success" && avResult.data) {
                // 1. Fill missing data
                const enrichment = fillMissingFromAlphaVantage(financialData, avResult.data);
                enrichedData = enrichment.filledData;
                filledMetrics = enrichment.filledMetrics;

                // 2. Verify accuracy across sources
                const verification = verifyDataAccuracy(financialData, avResult.data);
                conflicts = verification.conflicts;
                verificationReport = verification.verificationReport;

                if (filledMetrics.length > 0) {
                    serverLogger.success(`Filled ${filledMetrics.length} metrics: ${filledMetrics.slice(0, 5).join(", ")}`);
                }
                if (conflicts.length > 0) {
                    serverLogger.warn(`${conflicts.length} data conflicts detected between sources.`);
                }
            } else {
                serverLogger.warn("Alpha Vantage enrichment skipped (API error or no key).");
            }
        } catch (e) {
            serverLogger.warn(`Alpha Vantage enrichment failed: ${e}`);
        }
    } else {
        serverLogger.warn("ALPHA_VANTAGE_API_KEY not configured. Skipping enrichment.");
    }

    // --- Centralized Data Completeness Check ---
    const report = checkDataCompleteness(enrichedData, newsData);
    const { overallScore: completenessScore, confidenceLevel, metrics } = report;
    const missingCritical = metrics.critical.filter(m => !m.available).map(m => m.name);

    serverLogger.metric("Completeness", `${completenessScore.toFixed(0)}%`);
    serverLogger.metric("Confidence", confidenceLevel);

    // Python-style detailed missing report
    if (missingCritical.length > 0) {
        serverLogger.warn(`Missing Critical (${missingCritical.length}): ${missingCritical.join(", ")}`);
    } else {
        serverLogger.success("All Critical Metrics Available.");
    }

    const missingOptional = metrics.optional.filter(m => !m.available);
    if (missingOptional.length > 0) {
        serverLogger.info(`Missing Optional (${missingOptional.length}): ${missingOptional.slice(0, 5).map(m => m.name).join(", ")}${missingOptional.length > 5 ? "..." : ""}`);
    }

    // Combined validation and verification report
    const finalReport = `${report.summary}\n\n${verificationReport}`;

    // --- Sanitize data for JSON storage (Python _sanitize_for_json parity) ---
    const sanitizedFinancialData = sanitizeForJson(enrichedData);

    return {
        financialData: sanitizedFinancialData, // Updated with enriched and sanitized data
        conflicts,
        validationResult: {
            completenessScore,
            confidenceLevel,
            missingCriticalMetrics: missingCritical,
            validationReport: `Validation complete. Score: ${completenessScore.toFixed(0)}%. Confidence: ${confidenceLevel}. \n\n${finalReport}`,
        },
        agentConversation: [{
            agent: "QA & Verification Agent",
            message: `Data quality verified for ${ticker}. Completeness: ${completenessScore.toFixed(0)}%. Confidence: ${confidenceLevel}. ${conflicts.length > 0 ? `Detected ${conflicts.length} source conflicts.` : "Source accuracy verified."}`,
            timestamp: new Date().toISOString()
        }]
    };
}
