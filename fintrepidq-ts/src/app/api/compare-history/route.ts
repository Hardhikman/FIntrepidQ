import { NextRequest, NextResponse } from "next/server";
import { getReportsByTicker } from "@/db/utils";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * POST /api/compare-history - Compare latest report with previous report for the same ticker
 */
export async function POST(req: NextRequest) {
    try {
        const { ticker, apiKey } = await req.json();

        if (!ticker) {
            return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
        }
        if (!apiKey) {
            return NextResponse.json({ error: "API Key is required" }, { status: 400 });
        }

        // Get all reports for this ticker (ordered by date, newest first)
        const reports = await getReportsByTicker(ticker);

        if (reports.length < 2) {
            return NextResponse.json({
                error: "Not enough reports",
                message: `Only ${reports.length} report(s) found for ${ticker}. Need at least 2 reports to compare.`,
                reportCount: reports.length
            }, { status: 400 });
        }

        const latestReport = reports[0];
        const previousReport = reports[1];

        // Generate comparison using Gemini
        const model = new ChatGoogleGenerativeAI({
            apiKey,
            model: "gemini-2.5-flash",
            temperature: 0.2,
        });

        const prompt = `
You are an Institutional Equity Research Analyst tracking changes in a stock's fundamentals over time.

Compare these TWO reports for ${ticker.toUpperCase()} and identify:
1. **Key Changes**: What fundamental metrics changed significantly?
2. **Trend Direction**: Is the stock improving or deteriorating?
3. **Notable Shifts**: Any changes in sentiment, risk profile, or valuation?
4. **Action Items**: Should the investment thesis be updated?

Format your response in clear Markdown with sections.

---

**LATEST REPORT** (${latestReport.createdAt}):
${latestReport.report}

---

**PREVIOUS REPORT** (${previousReport.createdAt}):
${previousReport.report}
`;

        const response = await model.invoke(prompt);

        return NextResponse.json({
            comparison: response.content,
            ticker: ticker.toUpperCase(),
            latestDate: latestReport.createdAt,
            previousDate: previousReport.createdAt,
            reportCount: reports.length
        });

    } catch (error) {
        console.error("[API] Historical comparison error:", error);
        return NextResponse.json({
            error: "Comparison failed",
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
