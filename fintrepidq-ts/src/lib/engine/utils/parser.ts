import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

const QueryIntentSchema = z.object({
    intent: z.enum(["ANALYZE", "COMPARE", "QUERY", "UNKNOWN"]),
    tickers: z.array(z.string()).describe("The stock tickers identified in the query"),
    reasoning: z.string().optional(),
});

export type QueryIntent = z.infer<typeof QueryIntentSchema>;

export async function parseQuery(query: string, apiKey: string): Promise<QueryIntent> {
    const model = new ChatGoogleGenerativeAI({
        apiKey,
        model: "gemini-2.5-flash",
        temperature: 0,
    });

    const prompt = `
    Analyze the following stock research query and extract the user's intent and target tickers.
    
    INTENTS:
    - ANALYZE: Explicit request to generate a NEW analysis/report (keywords: "analyze", "deep dive", "research", just a ticker symbol alone)
    - QUERY: Question about a stock that should check EXISTING reports first (keywords: "is X a buy?", "what about X?", "show me X", "tell me about X")
    - COMPARE: A head-to-head comparison between two or more stocks (keywords: "compare", "vs", "versus")
    - UNKNOWN: Use if the query is nonsensical or unrelated to stocks.

    IMPORTANT DISTINCTION:
    - "NVDA" or "Analyze Tesla" or "Deep dive AAPL" = ANALYZE (generate new)
    - "Is Tesla a buy?" or "What about AMZN?" or "Show me Apple" = QUERY (check existing first)

    QUERY: "${query}"

    Return the analysis as a JSON object with "intent" and "tickers" (array of strings).
  `;

    try {
        const structuredModel = model.withStructuredOutput(QueryIntentSchema);
        const result = await structuredModel.invoke(prompt);
        return result;
    } catch (error) {
        console.error("Query parsing failed, falling back to basic extraction:", error);
        // Fallback regex
        const tickers = query.match(/[A-Z]{1,5}/g) || [];
        const lowerQuery = query.toLowerCase();

        // Fallback intent detection
        let intent: "ANALYZE" | "COMPARE" | "QUERY" | "UNKNOWN" = "UNKNOWN";
        if (lowerQuery.includes("compare") || lowerQuery.includes(" vs ")) {
            intent = "COMPARE";
        } else if (lowerQuery.includes("is ") || lowerQuery.includes("what about") || lowerQuery.includes("show me")) {
            intent = "QUERY";
        } else if (tickers.length >= 1) {
            intent = "ANALYZE";
        }

        return { intent, tickers };
    }
}

