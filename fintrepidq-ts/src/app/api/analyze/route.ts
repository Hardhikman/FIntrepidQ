import { NextRequest, NextResponse } from "next/server";
import { streamAnalysis } from "@/lib/engine/orchestrator";
import { TOOLS } from "@/lib/engine/tools";

export async function POST(req: NextRequest) {
    try {
        const { ticker, apiKey } = await req.json();

        if (!ticker) return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
        if (!apiKey) return NextResponse.json({ error: "Gemini API Key is required" }, { status: 400 });

        const resolvedTicker = await TOOLS.resolveTicker(ticker);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const analysisStream = streamAnalysis(resolvedTicker, apiKey);
                    for await (const state of analysisStream) {
                        const data = JSON.stringify(state);
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("[API] Analysis error:", error);
        return NextResponse.json({
            error: "Analysis failed",
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
