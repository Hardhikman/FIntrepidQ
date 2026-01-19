import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
import {
    calculateRSI,
    calculateAnnualizedVolatility,
    calculateSharpeRatio,
    calculateMaxDrawdown,
    calculateVaR,
    calculateSMA,
    calculateMACD
} from "../../math/finance";

function detectTrend(values: (number | null)[]): "increasing" | "decreasing" | "stable" | "unknown" {
    const clean = values.filter((v): v is number => v !== null && v !== undefined);
    if (clean.length < 2) return "unknown";
    // YF returns Newest at index 0
    if (clean[0] > clean[1] * 1.05) return "increasing";
    if (clean[0] < clean[1] * 0.95) return "decreasing";
    return "stable";
}

export async function getDeepFinancials(ticker: string) {
    try {
        const quote = await yahooFinance.quote(ticker) as any;

        // 1. Core Summary Stats - Expanded modules for full parity
        const stats = await yahooFinance.quoteSummary(ticker, {
            modules: [
                "summaryDetail",
                "defaultKeyStatistics",
                "financialData",
                "assetProfile",
            ],
        }) as any;

        // 2. Technicals via chart() - 5 years for 200-week SMA
        let prices: number[] = [];
        let chartData: any = {};
        try {
            const fiveYearsAgo = new Date();
            fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
            chartData = await yahooFinance.chart(ticker, { period1: fiveYearsAgo, interval: "1d" });
            const quotes = (chartData.quotes || []) as any[];
            prices = quotes.map((q: any) => q.close).filter((p: any): p is number => p !== null && p !== undefined);
        } catch (e) {
            console.warn(`Chart data failed for ${ticker}:`, e);
        }

        const returns = prices.slice(-252).map((p, i, arr) => i > 0 ? (p - arr[i - 1]) / arr[i - 1] : 0).slice(1);

        // 3. Trends via fundamentalsTimeSeries
        let fundamentals: any[] = [];
        try {
            // type is 'annual', 'quarterly', or 'trailing' for frequency.
            const fundamentalsResult = await yahooFinance.fundamentalsTimeSeries(ticker, {
                module: "all",
                period1: new Date(new Date().setFullYear(new Date().getFullYear() - 3)), // 3 years for better trends
                type: "annual",
            });
            fundamentals = (fundamentalsResult as any) || [];
        } catch (e) {
            console.warn(`Fundamentals failed for ${ticker}:`, e);
        }

        const getSeries = (key: string) => {
            if (!fundamentals || !Array.isArray(fundamentals)) return [];
            // Properties might be raw or prefixed based on type
            const annualKey = `annual${key.charAt(0).toUpperCase() + key.slice(1)}`;
            return fundamentals
                .map(item => item[key] ?? item[annualKey] ?? null)
                .filter(v => v !== null)
                .reverse(); // Newest first
        };

        const revenueAnnual = getSeries("totalRevenue");
        const ebitAnnual = getSeries("EBIT");
        const debtAnnual = getSeries("totalDebt");
        const fcfAnnual = getSeries("freeCashFlow");
        const interestAnnual = getSeries("interestExpense");

        // Balance sheet items for ROCE calculation (Python parity)
        const totalAssetsAnnual = getSeries("totalAssets");
        const currentLiabilitiesAnnual = getSeries("currentLiabilities");

        // Calculate ICR series
        const icrAnnual: (number | null)[] = [];
        const minLength = Math.min(ebitAnnual.length, interestAnnual.length);
        for (let i = 0; i < minLength; i++) {
            if (ebitAnnual[i] !== null && interestAnnual[i] !== null && interestAnnual[i] !== 0) {
                icrAnnual.push(ebitAnnual[i] / Math.abs(interestAnnual[i]));
            } else {
                icrAnnual.push(null);
            }
        }

        const icrValue = icrAnnual.length > 0 ? icrAnnual[0] : null; // Current ICR is the most recent one

        // Calculate ROCE (Python parity)
        // ROCE = EBIT / (Total Assets - Current Liabilities)
        let roce: number | null = null;
        if (ebitAnnual.length > 0 && totalAssetsAnnual.length > 0 && currentLiabilitiesAnnual.length > 0) {
            const ebit = ebitAnnual[0]; // Most recent
            const totalAssets = totalAssetsAnnual[0];
            const currentLiabilities = currentLiabilitiesAnnual[0];

            if (ebit !== null && totalAssets !== null && currentLiabilities !== null) {
                const capitalEmployed = totalAssets - currentLiabilities;
                if (capitalEmployed !== 0) {
                    roce = ebit / capitalEmployed;
                }
            }
        }

        // Deep mapping to match Python parity and preserve zero values
        const summary = stats.summaryDetail || {};
        const keyStats = stats.defaultKeyStatistics || {};
        const financialData = stats.financialData || {};

        return {
            ticker,
            price: quote.regularMarketPrice,
            companyName: quote.longName,
            summary: {
                ...summary,
                dividendYield: summary.dividendYield ?? summary.trailingAnnualDividendYield ?? keyStats.trailingAnnualDividendYield ?? summary.trailingAnnualDividendRate,
            },
            keyStats: {
                ...keyStats,
                payoutRatio: keyStats.payoutRatio ?? summary.payoutRatio,
                returnOnAssets: financialData.returnOnAssets ?? keyStats.returnOnAssets,
                pegRatio: keyStats.pegRatio ?? financialData.pegRatio,
                priceToBook: keyStats.priceToBook ?? summary.priceToBook,
            },
            financials: {
                ...financialData,
                // Yahoo Finance returns D/E as percentage (e.g., 403 instead of 4.03) - normalize to ratio
                debtToEquity: ((financialData.debtToEquity ?? keyStats.debtToEquity ?? summary.debtToEquity) || 0) / 100,
                trailingPE: summary.trailingPE ?? keyStats.trailingPE ?? quote.trailingPE,
                forwardPE: summary.forwardPE ?? keyStats.forwardPE ?? quote.forwardPE,
                returnOnEquity: financialData.returnOnEquity ?? keyStats.returnOnEquity,
                freeCashflow: financialData.freeCashflow ?? (fcfAnnual.length > 0 ? fcfAnnual[0] : null),
                icr: icrValue,
                roce: roce, // ROCE = EBIT / Capital Employed (Python parity)
                operatingCashflow: financialData.operatingCashflow ?? (fcfAnnual.length > 0 ? fcfAnnual[0] : null),
            },
            growth: {
                revenueGrowth: financialData.revenueGrowth ?? keyStats.revenueGrowth,
                profitMargins: financialData.profitMargins ?? keyStats.profitMargins,
                revenueTrend: detectTrend(revenueAnnual),
                ebitTrend: detectTrend(ebitAnnual),
                debtTrend: detectTrend(debtAnnual),
                fcfTrend: detectTrend(fcfAnnual),
                revenueAnnual: revenueAnnual,
            },
            technicals: {
                rsi: prices.length >= 14 ? calculateRSI(prices.slice(-100)) : null,
                sma50: calculateSMA(prices, 50),
                sma200: calculateSMA(prices, 200),
                sma200Weeks: calculateSMA(prices, 1000), // ~200 weeks
                macd: calculateMACD(prices.slice(-100)),
                currentPrice: quote.regularMarketPrice,
                volume: summary.volume ?? quote.regularMarketVolume,
            },
            risk: {
                volatility: calculateAnnualizedVolatility(returns),
                sharpe: calculateSharpeRatio(returns),
                maxDrawdown: calculateMaxDrawdown(prices.slice(-252)),
                var95: calculateVaR(returns, 0.95),
                beta: keyStats.beta ?? summary.beta ?? quote.beta,
            },
        };
    } catch (error: any) {
        console.error(`Error fetching financials for ${ticker}:`, error);
        throw error;
    }
}
