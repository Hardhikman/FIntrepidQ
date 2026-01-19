import { NextRequest, NextResponse } from "next/server";
import { streamAnalysis } from "@/lib/engine/orchestrator";
import { sanitizeForJson } from "@/lib/engine/utils/serialization";

export async function POST(req: NextRequest) {
    try {
        const { threadId, apiKey } = await req.json();
        console.log(`[API] Resume request: threadId=${threadId}`);

        if (!threadId) return NextResponse.json({ error: "Thread ID is required to resume" }, { status: 400 });
        if (!apiKey) return NextResponse.json({ error: "API Key is required" }, { status: 400 });

        const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // resumes the analysis by passing undefined as the ticker
                    const analysisStream = streamAnalysis(undefined, apiKey, alphaVantageKey, threadId);

                    for await (const chunk of analysisStream) {
                        try {
                            const flatChunk = Object.values(chunk)[0] || {};
                            const sanitized = sanitizeForJson(flatChunk);
                            const data = JSON.stringify(sanitized);
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                        } catch (e) {
                            console.error("[Resume API] Stringify error:", e);
                        }
                    }
                    controller.close();
                } catch (error) {
                    console.error("[Resume API] Stream error:", error);
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

    } catch (error) {
        console.error("[Resume API] Error:", error);
        return NextResponse.json({ error: "Failed to resume analysis" }, { status: 500 });
    }
}
