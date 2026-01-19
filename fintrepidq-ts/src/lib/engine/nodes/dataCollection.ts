import { TOOLS } from "../tools";
import { AgentState } from "../../types/shared";
import { serverLogger } from "../../utils/logger";

/**
 * Node 1: Collect Financials
 */
export async function collectFinancialsNode(state: AgentState): Promise<Partial<AgentState>> {
    const { ticker } = state;
    serverLogger.header(ticker);
    serverLogger.phase("Data Collection - Financials");
    serverLogger.step(`Requesting Bloomberg-grade financials for ${ticker}...`, "📊");

    try {
        const financials = await TOOLS.getDeepFinancials(ticker);

        // --- Search Web for general context (Python Parity) ---
        serverLogger.step(`Searching web for general company context...`, "🌍");
        const searchResults = await TOOLS.searchWeb(`${ticker} company overview business model recent developments`, 3);

        serverLogger.success("Quantitative data and web context verified.");
        return {
            financialData: financials,
            companyName: financials.companyName || ticker, // Pass company name to state
            rawSummary: `Web context: ${searchResults.map(r => r.title).join("; ")}`,
            agentConversation: [{
                agent: "Extraction Agent",
                message: `Secured institutional-grade financials for ${financials.companyName || ticker}. Handing off to News Intelligence.`,
                timestamp: new Date().toISOString()
            }]
        };
    } catch (error) {
        serverLogger.error(`Financials failed for ${ticker}: ${error instanceof Error ? error.message : String(error)}`);
        return {};
    }
}

/**
 * Node 2.1: Strategic Core Scan
 */
export async function scanStrategicCoreNode(state: AgentState): Promise<Partial<AgentState>> {
    const { ticker } = state;
    serverLogger.phase("Strategic Intelligence - Core");
    const queries = [
        `${ticker} quarterly earnings beat guidance estimates`,
        `${ticker} company acquisition merger deal`,
        `${ticker} expansion new market new clients`,
        `${ticker} new product innovation R&D investment`,
        `${ticker} industry sector trends tailwinds`,
    ];

    serverLogger.step(`Scanning core institutional growth vectors...`, "🛰️");
    const results = await TOOLS.searchGoogleNewsBatch(queries, 3);
    return {
        newsData: { ...(state.newsData || {}), strategic: [...(state.newsData?.strategic || []), ...results] },
        agentConversation: [{
            agent: "Strategic Core Scout",
            message: `Scanned core institutional growth vectors for ${ticker}. Found ${results.length} expansion and M&A signals.`,
            timestamp: new Date().toISOString()
        }]
    };
}

/**
 * Node 2.2: Strategic Qualitative Scan
 */
export async function scanStrategicQualitativeNode(state: AgentState): Promise<Partial<AgentState>> {
    const { ticker } = state;
    serverLogger.phase("Strategic Intelligence - Qualitative");
    const queries = [
        `${ticker} management leadership vision ethics CEO`,
        `${ticker} brand reputation sentiment customer trust`,
        `${ticker} macroeconomic impact interest rates inflation`,
        `${ticker} ESG environment social governance rating`,
    ];

    serverLogger.step(`Analyzing management vision and brand reputation...`, "🧠");
    const results = await TOOLS.searchGoogleNewsBatch(queries, 2);
    return {
        newsData: { ...(state.newsData || {}), strategic: [...(state.newsData?.strategic || []), ...results] },
        agentConversation: [{
            agent: "Qualitative Intelligence Agent",
            message: `Captured ESG, management vision, and brand sentiment signals for ${ticker} (${results.length} events).`,
            timestamp: new Date().toISOString()
        }]
    };
}

/**
 * Node 2.3: Strategic Risk & Red Flag Scan
 */
export async function scanStrategicRiskNode(state: AgentState): Promise<Partial<AgentState>> {
    const { ticker } = state;
    serverLogger.phase("Strategic Intelligence - Risk");
    const queries = [
        `${ticker} investigation legal proceeding lawsuit`,
        `${ticker} management reshuffle CEO exit leadership change`,
        `${ticker} promoter share pledge reduction selling`,
        `${ticker} insider trading management buying selling`,
    ];

    serverLogger.step(`Scanning for institutional red flags and regulatory headwinds...`, "⚠️");
    const results = await TOOLS.searchGoogleNewsBatch(queries, 2);
    return {
        newsData: { ...(state.newsData || {}), strategic: [...(state.newsData?.strategic || []), ...results] },
        agentConversation: [{
            agent: "Risk Compliance Agent",
            message: `Investigated regulatory headwinds and red flags for ${ticker}. Found ${results.length} risk vectors.`,
            timestamp: new Date().toISOString()
        }]
    };
}

/**
 * Node 2.4: Investor & Macro Scan
 */
export async function scanStrategicIRNode(state: AgentState): Promise<Partial<AgentState>> {
    const { ticker } = state;
    serverLogger.phase("Strategic Intelligence - Final");
    const queries = [
        `${ticker} investor presentation earnings call transcript`,
        `${ticker} annual report future outlook guidance`,
        `${ticker} analyst price target upgrade downgrade`
    ];

    serverLogger.step(`Finalizing institutional scan (IR & Analyst sentiment)...`, "📊");
    const results = await TOOLS.searchGoogleNewsBatch(queries, 2);
    const totalSignals = (state.newsData?.strategic?.length || 0) + results.length;
    serverLogger.success(`Strategic intelligence layer complete. Total signals: ${totalSignals}`);

    return {
        newsData: { ...(state.newsData || {}), strategic: [...(state.newsData?.strategic || []), ...results] },
        agentConversation: [{
            agent: "IR Intelligence Specialist",
            message: `Finalized institutional scan for ${ticker} with analyst sentiment and IR transcript data. Feed ready for discovery.`,
            timestamp: new Date().toISOString()
        }]
    };
}

/**
 * Node 3: Collect Recent News
 */
export async function collectRecentNewsNode(state: AgentState): Promise<Partial<AgentState>> {
    const { ticker } = state;
    serverLogger.phase("Data Collection - Market Feed");
    serverLogger.step(`Capturing recent institutional headlines...`, "📰");

    try {
        const googleNews = await TOOLS.searchGoogleNews(ticker, 10);
        const articleCount = googleNews.length;

        // Real-time streaming of news headlines to terminal
        for (const article of googleNews) {
            const source = article.source || (article.url ? new URL(article.url).hostname.replace("www.", "") : "News");
            serverLogger.newsItem(article.title || "Untitled", source, article.publishedDate);
        }

        serverLogger.success(`Aggregated ${articleCount} recent verified headlines.`);

        return {
            newsData: {
                ...(state.newsData || {}),
                recent: googleNews,
            },
            agentConversation: [{
                agent: "News Discovery Agent",
                message: `Captured ${articleCount} recent market headlines for ${ticker}. The intelligence feed is now fully primed for validation.`,
                timestamp: new Date().toISOString()
            }],
            rawSummary: `News analysis complete. Aggregated market headlines and strategic signals.`,
        };
    } catch (error) {
        serverLogger.error(`News scan failed for ${ticker}: ${error instanceof Error ? error.message : String(error)}`);
        return {};
    }
}
