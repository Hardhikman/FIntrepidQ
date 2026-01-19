import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import * as dbUtils from "../../../db/utils";

/**
 * Tool: Get Latest Report for a Ticker
 */
export const getTickerReportTool = new DynamicStructuredTool({
    name: "get_ticker_report",
    description: "Retrieves the most recent institutional equity analysis report for a specific ticker from the database.",
    schema: z.object({
        ticker: z.string().describe("The stock ticker symbol (e.g., AAPL)."),
    }),
    func: async ({ ticker }) => {
        const report = await dbUtils.getLatestReportForTicker(ticker);
        if (!report) {
            return `No report found for ${ticker} in the database. Try recommending a fresh analysis.`;
        }
        return JSON.stringify({
            ticker: report.ticker,
            date: report.createdAt,
            analysis: report.report,
            metadata: report.metadata
        }, null, 2);
    },
});

/**
 * Tool: Get All Analyzed Tickers
 */
export const getAllAnalyzedTickersTool = new DynamicStructuredTool({
    name: "get_all_analyzed_tickers",
    description: "Returns a list of all company tickers that have been analyzed and are available in the database.",
    schema: z.object({}),
    func: async () => {
        const tickers = await dbUtils.getAllTickers();
        if (tickers.length === 0) {
            return "The database is currently empty. No tickers have been analyzed yet.";
        }
        return `Available tickers in database: ${tickers.join(", ")}`;
    },
});

/**
 * Tool: Compare Tickers
 */
export const compareTickersTool = new DynamicStructuredTool({
    name: "compare_tickers",
    description: "Retrieves latest reports for multiple tickers to compare their investment theses, scores, and risks.",
    schema: z.object({
        tickers: z.array(z.string()).describe("List of tickers to compare."),
    }),
    func: async ({ tickers }) => {
        const results = [];
        for (const ticker of tickers) {
            const report = await dbUtils.getLatestReportForTicker(ticker);
            if (report) {
                results.push({
                    ticker: report.ticker,
                    date: report.createdAt,
                    analysis: report.report
                });
            } else {
                results.push({ ticker, status: "No report found" });
            }
        }
        return JSON.stringify(results, null, 2);
    },
});

export const DATABASE_TOOLS = [
    getTickerReportTool,
    getAllAnalyzedTickersTool,
    compareTickersTool
];
