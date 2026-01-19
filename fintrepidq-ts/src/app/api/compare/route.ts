import { NextRequest, NextResponse } from "next/server";
import { getLatestReportForTicker } from "@/db/utils";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export async function POST(req: NextRequest) {
    try {
        const { tickers, apiKey } = await req.json();

        if (!tickers || !Array.isArray(tickers) || tickers.length < 2) {
            return NextResponse.json({ error: "At least two tickers are required for comparison" }, { status: 400 });
        }
        if (!apiKey) return NextResponse.json({ error: "Gemini API Key is required" }, { status: 400 });

        const reports: Record<string, any> = {};
        const missing: string[] = [];

        for (const t of tickers) {
            const report = await getLatestReportForTicker(t);
            if (report) {
                reports[t] = report.report;
            } else {
                missing.push(t);
            }
        }

        if (missing.length > 0) {
            return NextResponse.json({
                error: "Missing Research",
                message: `Research reports not found for: ${missing.join(", ")}. Please analyze them individually first.`,
                missing
            }, { status: 404 });
        }

        // Synthesis Comparison using Gemini
        const model = new ChatGoogleGenerativeAI({
            apiKey,
            model: "gemini-2.5-flash", // Use the latest fast model
            temperature: 0.2,
        });

        const prompt = `
      You are an Institutional Equity Research Analyst. 
      Analyze and compare the following two stock research reports. 
      
      Provide a "Head-to-Head" comparison across these 7 categories:
      1. FUNDAMENTAL 
      2. VALUATION
      3. QUALITY
      4. MOMENTUM
      5. RISK
      6. SENTIMENT
      7. DIVIDEND

      Format your response in a clear, professional Markdown format. 
      Use tables for side-by-side data if possible.
      Conclude with a "Final Verdict" on which stock presents a better risk-adjusted opportunity.

      TICKER 1: ${tickers[0]}
      REPORT 1: 
      ${reports[tickers[0]]}

      TICKER 2: ${tickers[1]}
      REPORT 2:
      ${reports[tickers[1]]}
    `;

        const response = await model.invoke(prompt);

        return NextResponse.json({
            comparison: response.content,
            tickers
        });

    } catch (error) {
        console.error("[API] Comparison error:", error);
        return NextResponse.json({
            error: "Comparison failed",
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
