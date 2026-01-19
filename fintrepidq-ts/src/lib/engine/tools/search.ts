import { searchGoogleNews } from "./news";

// Python parity: 300ms base delay between requests
const BASE_DELAY = 300;

/**
 * Search web using Google News RSS feed.
 * Simplified from DDG - uses RSS only for reliability.
 */
export async function searchWeb(query: string, maxResults: number = 5) {
    try {
        // Rate limit delay (Python parity: 300ms)
        await new Promise(r => setTimeout(r, BASE_DELAY));

        const newsResults = await searchGoogleNews(query, maxResults);
        return newsResults.map(r => ({
            title: r.title,
            url: r.url,
            content: r.snippet,
        }));
    } catch (error) {
        console.error(`[Search] Google News RSS failed for "${query}":`, error);
        return [];
    }
}

// Exchange priority for picking primary listing (higher = preferred)
const EXCHANGE_PRIORITY: Record<string, number> = {
    // Major Asian exchanges (primary listings for Asian companies)
    "KSC": 100,   // Korea Stock Exchange
    "KOE": 100,   // Korea Exchange (alt)
    "TSE": 100,   // Tokyo Stock Exchange
    "TYO": 100,   // Tokyo (alt)
    "HKG": 100,   // Hong Kong Stock Exchange
    "SHH": 95,    // Shanghai
    "SHZ": 95,    // Shenzhen
    "TAI": 95,    // Taiwan
    "TWO": 95,    // Taiwan OTC

    // Indian exchanges
    "NSI": 90,    // NSE India
    "BSE": 85,    // BSE India

    // Major Western exchanges
    "NMS": 80,    // NASDAQ
    "NYQ": 80,    // NYSE
    "LSE": 75,    // London
    "PAR": 70,    // Paris
    "FRA": 70,    // Frankfurt

    // OTC/Pink Sheets (deprioritize)
    "PNK": 10,    // OTC Pink
    "OTC": 10,    // OTC Markets
};

/**
 * Search Yahoo Finance for ticker suggestions and pick the best (primary) one
 */
async function searchYahooTicker(query: string): Promise<string | null> {
    try {
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        if (!response.ok) return null;

        const data = await response.json();
        const quotes = data.quotes || [];

        if (quotes.length === 0) return null;

        // Sort by exchange priority (prefer primary exchanges over OTC)
        quotes.sort((a: any, b: any) => {
            const priorityA = EXCHANGE_PRIORITY[a.exchange] || 50;
            const priorityB = EXCHANGE_PRIORITY[b.exchange] || 50;
            return priorityB - priorityA;
        });

        const best = quotes[0];
        console.log(`📍 Yahoo resolved '${query}' to ${best.symbol} (${best.exchange})`);
        return best.symbol;
    } catch (error) {
        console.error(`Yahoo ticker search failed:`, error);
        return null;
    }
}

/**
 * Resolve a company name or query to a stock ticker symbol.
 * Uses Yahoo Finance search to find primary exchange listing.
 */
export async function resolveTicker(query: string): Promise<string> {
    const cleanQuery = query.trim();

    // Basic ticker check (2-5 uppercase chars) - likely already a US ticker
    if (/^[A-Z]{2,5}$/.test(cleanQuery)) {
        return cleanQuery;
    }

    // Check if it's already an international ticker format (e.g., 005930.KS)
    if (/^[0-9A-Z]+\.[A-Z]{1,3}$/.test(cleanQuery.toUpperCase())) {
        return cleanQuery.toUpperCase();
    }

    console.log(`🔍 Resolving ticker for '${query}'...`);

    // Try Yahoo Finance search first (best for finding primary exchange)
    const yahooResult = await searchYahooTicker(query);
    if (yahooResult) {
        return yahooResult;
    }

    // Fallback to web search if Yahoo fails
    try {
        const searchQuery = `stock ticker symbol for ${query}`;
        const results = await searchWeb(searchQuery, 1);

        if (results.length > 0) {
            const text = results.map((r: any) => `${r.title} ${r.content}`).join(" ");

            // Look for parenthesized tickers like (AAPL)
            const explicitMatch = text.match(/\(([A-Z]{2,12})\)/);
            if (explicitMatch) {
                return explicitMatch[1];
            }

            // Generic uppercase word match
            const genericMatch = text.match(/\b[A-Z]{2,12}\b/);
            if (genericMatch) {
                return genericMatch[0];
            }
        }
    } catch (error) {
        console.error(`Warning: Ticker resolution failed for ${query}:`, error);
    }

    return query.toUpperCase();
}

/**
 * Batch search for strategic triggers using Google News RSS.
 */
export async function searchGoogleNewsBatch(queries: string[], maxResults: number = 3) {
    const allResults = [];

    for (const q of queries) {
        try {
            const results = await searchGoogleNews(q, maxResults);

            const mapped = results.slice(0, maxResults).map((r: any) => ({
                title: r.title,
                url: r.url,
                source: r.source || "Google News",
                snippet: r.snippet,
                publishedDate: r.publishedDate,
                content: `[${r.publishedDate ? new Date(r.publishedDate).toLocaleDateString() : "Recent"}] ${r.title} - ${r.snippet}`
            }));

            allResults.push(...mapped);
            // 300ms delay between queries (Python parity)
            await new Promise(r => setTimeout(r, BASE_DELAY));
        } catch (e) {
            console.error(`Error in batch search for ${q}`, e);
        }
    }
    return allResults;
}

export async function checkStrategicTriggers(ticker: string) {
    const queries = [
        // Original Strategic Triggers (Parity with Python)
        `${ticker} quarterly earnings beat guidance estimates`,
        `${ticker} company acquisition merger deal`,
        `${ticker} expansion new market new clients`,
        `${ticker} new product innovation R&D investment`,
        `${ticker} industry sector trends tailwinds`,

        // New Qualitative Triggers
        `${ticker} management leadership vision ethics CEO`,
        `${ticker} brand reputation sentiment customer trust`,
        `${ticker} macroeconomic impact interest rates inflation`,
        `${ticker} ESG environment social governance rating`,
        `${ticker} insider trading management buying selling`,

        // Specific Red Flags
        `${ticker} investigation legal proceeding lawsuit`,
        `${ticker} management reshuffle CEO exit leadership change`,
        `${ticker} promoter share pledge reduction selling`,

        // Investor Relations
        `${ticker} investor presentation earnings call transcript`,
        `${ticker} annual report future outlook guidance`,
        `${ticker} management discussion future plans strategy`
    ];

    // Reuse the batch logic for consistency (Python uses max_results=3)
    return searchGoogleNewsBatch(queries, 3);
}
