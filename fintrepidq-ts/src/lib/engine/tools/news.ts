import Parser from "rss-parser";

const parser = new Parser();

/**
 * Resolve Google News redirect URLs to original source URLs.
 * Parity with Python's googlenewsdecoder.
 */
async function resolveGoogleNewsUrl(url: string): Promise<string> {
    if (!url || !url.includes("news.google.com")) {
        return url;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { decode } = require("google-news-url-decoder");
        const decoded = await decode(url);
        return decoded || url;
    } catch {
        return url; // Return original if decoding fails
    }
}

export async function searchGoogleNews(query: string, maxResults: number = 10) {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

    try {
        const feed = await parser.parseURL(url);
        const items = feed.items.slice(0, maxResults);

        // Resolve URLs in parallel (Python parity with ThreadPoolExecutor)
        const resolvedUrls = await Promise.all(
            items.map(item => resolveGoogleNewsUrl(item.link || ""))
        );

        return items.map((item, i) => ({
            title: item.title,
            url: resolvedUrls[i],
            publishedDate: item.pubDate,
            source: item.source || "Google News",
            snippet: item.contentSnippet || item.content || ""
        }));
    } catch (error) {
        console.error(`Error fetching Google News for ${query}:`, error);
        return [];
    }
}
