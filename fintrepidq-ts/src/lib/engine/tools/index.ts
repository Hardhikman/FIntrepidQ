import { getDeepFinancials } from "./finance";
import { searchWeb, resolveTicker, checkStrategicTriggers, searchGoogleNewsBatch } from "./search";
import { searchGoogleNews } from "./news";

export const TOOLS = {
    getDeepFinancials,
    searchWeb,
    resolveTicker,
    checkStrategicTriggers,
    searchGoogleNews,
    searchGoogleNewsBatch,
};

export type ToolName = keyof typeof TOOLS;
