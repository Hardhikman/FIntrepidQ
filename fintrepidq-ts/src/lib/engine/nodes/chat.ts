import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { searchWeb } from "../tools/search";
import { searchGoogleNews } from "../tools/news";
import { DATABASE_TOOLS } from "../tools/databaseTools";
import { CHAT_AGENT_PROMPT } from "../assets/prompts/ChatAgent";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { AgentState } from "../../types/shared";

/**
 * Tool: Google Search (Web)
 */
export const searchWebTool = new DynamicStructuredTool({
    name: "search_web",
    description: "Search the web for the latest information when database reports are outdated or missing.",
    schema: z.object({
        query: z.string().describe("The search query."),
    }),
    func: async ({ query }) => {
        const results = await searchWeb(query, 5);
        return JSON.stringify(results, null, 2);
    },
});

/**
 * Tool: Search Google News
 */
export const searchGoogleNewsTool = new DynamicStructuredTool({
    name: "search_google_news",
    description: "Search for recent news headlines about a company.",
    schema: z.object({
        query: z.string().describe("The search query (ticker or company name)."),
    }),
    func: async ({ query }) => {
        const results = await searchGoogleNews(query, 10);
        return JSON.stringify(results, null, 2);
    },
});

/**
 * Builds the Chat Agent
 * Parity with Python build_chat_agent()
 */
export function buildChatAgent(apiKey: string) {
    const llm = new ChatGoogleGenerativeAI({
        apiKey,
        model: "gemini-2.5-flash",
        temperature: 0.3,
    });

    const tools = [
        ...DATABASE_TOOLS,
        searchWebTool,
        searchGoogleNewsTool
    ];

    const memory = new MemorySaver();

    // Using createReactAgent for the Chat Agent logic
    return createReactAgent({
        llm,
        tools,
        checkpointSaver: memory,
        messageModifier: CHAT_AGENT_PROMPT
    });
}

/**
 * Chat Node wrapper
 */
export async function chatNode(state: AgentState, config: { apiKey: string, thread_id: string }) {
    const agent = buildChatAgent(config.apiKey);

    // We expect the user input to be in state.agentConversation
    const lastUserMessage = [...(state.agentConversation || [])]
        .reverse()
        .find(m => m.agent === "User")?.message || "Hello";

    const result = await agent.invoke({
        messages: [{ role: "user", content: lastUserMessage }]
    }, {
        configurable: { thread_id: config.thread_id }
    });

    const lastMessage = result.messages[result.messages.length - 1];

    return {
        agentConversation: [{
            agent: "Equity Analysis Assistant",
            message: String(lastMessage.content),
            timestamp: new Date().toISOString()
        }]
    };
}
