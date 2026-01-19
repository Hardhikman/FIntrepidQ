import { NextRequest, NextResponse } from "next/server";
import { parseQuery } from "@/lib/engine/utils/parser";
import { streamAnalysis } from "@/lib/engine/orchestrator";
import { TOOLS } from "@/lib/engine/tools";
import { sanitizeForJson } from "@/lib/engine/utils/serialization";
import { getLatestReportForTicker } from "@/db/utils";

export async function POST(req: NextRequest) {
    try {
        const { query, apiKey, ticker: legacyTicker, threadId } = await req.json();
        const effectiveQuery = query || legacyTicker;
        console.log(`[API] Research request: ticker=${effectiveQuery}, threadId=${threadId}`);

        if (!effectiveQuery) return NextResponse.json({ error: "Query is required" }, { status: 400 });
        if (!apiKey) return NextResponse.json({ error: "Gemini API Key is required" }, { status: 400 });

        // 1. NLP Intent Discovery
        const { intent, tickers } = await parseQuery(effectiveQuery, apiKey);

        // 2. Routing
        if (intent === "COMPARE" && tickers.length >= 2) {
            return NextResponse.json({
                type: "ROUTED_TO_COMPARE",
                tickers
            });
        }

        // 3. QUERY Intent: Check DB first, return existing report if found
        if (intent === "QUERY" && tickers.length > 0) {
            const resolvedTicker = await TOOLS.resolveTicker(tickers[0]);
            const existingReport = await getLatestReportForTicker(resolvedTicker);

            if (existingReport) {
                console.log(`[API] Found existing report for ${resolvedTicker}, returning from DB`);
                return NextResponse.json({
                    type: "EXISTING_REPORT",
                    ticker: resolvedTicker,
                    report: existingReport.report,
                    createdAt: existingReport.createdAt,
                    message: `Showing saved report for ${resolvedTicker}. Type "Analyze ${resolvedTicker}" to generate a fresh report.`
                });
            } else {
                console.log(`[API] No existing report for ${resolvedTicker}`);
                return NextResponse.json({
                    type: "NO_REPORT_FOUND",
                    ticker: resolvedTicker,
                    message: `No saved report found for ${resolvedTicker}. Type "Analyze ${resolvedTicker}" to generate a new report.`
                });
            }
        }

        // 4. ANALYZE Intent: Generate new report
        if (intent === "ANALYZE" && tickers.length > 0) {
            const resolvedTicker = await TOOLS.resolveTicker(tickers[0]);

            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                async start(controller) {
                    try {
                        const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
                        const analysisStream = streamAnalysis(resolvedTicker, apiKey, alphaVantageKey, threadId);

                        for await (const chunk of analysisStream) {
                            try {
                                const flatChunk = Object.values(chunk)[0] || {};
                                const sanitized = sanitizeForJson(flatChunk);
                                const data = JSON.stringify(sanitized);
                                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                            } catch (stringifyError) {
                                console.error("[API] Failed to stringify state chunk:", stringifyError);
                            }
                        }
                        controller.close();
                    } catch (error) {
                        console.error("[API] Stream error:", error);
                        controller.error(error);
                    }
                },
            });

            return new Response(stream, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache, no-transform",
                    "X-Accel-Buffering": "no",
                    "Connection": "keep-alive",
                },
            });
        }

        return NextResponse.json({ error: "Could not understand research intent." }, { status: 400 });

    } catch (error) {
        console.error("[API] Unified Research error:", error);
        return NextResponse.json({ error: "Research failed" }, { status: 500 });
    }
}
