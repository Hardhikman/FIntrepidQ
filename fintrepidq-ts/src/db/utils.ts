import { db } from "./index";
import { analysisReports } from "./schema";
import { eq, desc } from "drizzle-orm";

export async function saveReport(data: {
    ticker: string;
    report: string;
    sessionId: string;
    userId: string;
    metadata?: any;
}) {
    // Retention Logic: Keep only latest 3 per ticker
    const existing = await getReportsByTicker(data.ticker);
    if (existing.length >= 3) {
        // Delete the oldest ones beyond the latest 2 (to make room for the new 1)
        const toDelete = existing.slice(2);
        for (const report of toDelete) {
            await db.delete(analysisReports).where(eq(analysisReports.id, report.id));
        }
    }

    return await db.insert(analysisReports).values({
        ticker: data.ticker.toUpperCase(),
        report: data.report,
        sessionId: data.sessionId,
        userId: data.userId,
        metadata: data.metadata || {},
    }).returning();
}

export async function getReportsByTicker(ticker: string) {
    return await db.select()
        .from(analysisReports)
        .where(eq(analysisReports.ticker, ticker.toUpperCase()))
        .orderBy(desc(analysisReports.createdAt));
}

export async function getLatestReportForTicker(ticker: string) {
    const result = await db.select()
        .from(analysisReports)
        .where(eq(analysisReports.ticker, ticker.toUpperCase()))
        .orderBy(desc(analysisReports.createdAt))
        .limit(1);
    return result[0] || null;
}

export async function checkTickerAvailability(tickers: string[]) {
    const availability: Record<string, boolean> = {};
    for (const ticker of tickers) {
        const report = await getLatestReportForTicker(ticker);
        availability[ticker] = !!report;
    }
    return availability;
}

export async function getLatestReports(limit = 10) {
    return await db.select()
        .from(analysisReports)
        .orderBy(desc(analysisReports.createdAt))
        .limit(limit);
}

export async function getAllTickers() {
    const results = await db.select({ ticker: analysisReports.ticker })
        .from(analysisReports)
        .groupBy(analysisReports.ticker);
    return results.map(r => r.ticker);
}

export async function deleteReport(id: number) {
    return await db.delete(analysisReports).where(eq(analysisReports.id, id)).returning();
}

export async function getReportById(id: number) {
    const result = await db.select()
        .from(analysisReports)
        .where(eq(analysisReports.id, id))
        .limit(1);
    return result[0] || null;
}

