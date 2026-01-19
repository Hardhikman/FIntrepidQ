/**
 * Data Completeness Checker
 * Diagnostic utility to identify missing financial metrics
 */

export interface CompletenessReport {
    ticker: string;
    timestamp: string;
    overallScore: number;
    criticalScore: number;
    optionalScore: number;
    advancedScore: number;
    confidenceLevel: "High" | "Medium" | "Low";
    metrics: {
        critical: MetricStatus[];
        optional: MetricStatus[];
        advanced: MetricStatus[];
    };
    summary: string;
}

export interface MetricStatus {
    name: string;
    path: string;
    available: boolean;
    value: any;
    source?: string;
}

/**
 * Check data completeness and return a detailed report
 */
export function checkDataCompleteness(
    financialData: Record<string, any> | undefined,
    newsData?: Record<string, any>
): CompletenessReport {
    const timestamp = new Date().toISOString();

    if (!financialData) {
        return {
            ticker: "UNKNOWN",
            timestamp,
            overallScore: 0,
            criticalScore: 0,
            optionalScore: 0,
            advancedScore: 0,
            confidenceLevel: "Low",
            metrics: {
                critical: [],
                optional: [],
                advanced: [],
            },
            summary: "❌ CRITICAL: No financial data available. Check data extraction pipeline.",
        };
    }

    const { financials, keyStats, growth, technicals, risk, summary: summaryData, price } = financialData;

    // --- CRITICAL METRICS (Must have for institutional analysis) ---
    const criticalMetrics: MetricStatus[] = [
        {
            name: "Current Price",
            path: "price",
            available: price !== null && price !== undefined,
            value: price,
            source: "Yahoo Finance / Alpha Vantage",
        },
        {
            name: "Market Cap",
            path: "summary.marketCap",
            available: summaryData?.marketCap !== null && summaryData?.marketCap !== undefined,
            value: summaryData?.marketCap,
            source: "Yahoo Finance / Alpha Vantage",
        },
        {
            name: "Revenue Growth",
            path: "growth.revenueGrowth",
            available: growth?.revenueGrowth !== null && growth?.revenueGrowth !== undefined,
            value: growth?.revenueGrowth,
            source: "Yahoo Finance / Alpha Vantage (QuarterlyRevenueGrowthYOY)",
        },
        {
            name: "Profit Margins",
            path: "growth.profitMargins",
            available: growth?.profitMargins !== null && growth?.profitMargins !== undefined,
            value: growth?.profitMargins,
            source: "Yahoo Finance / Alpha Vantage (ProfitMargin)",
        },
        {
            name: "Trailing P/E",
            path: "financials.trailingPE",
            available: financials?.trailingPE !== null && financials?.trailingPE !== undefined,
            value: financials?.trailingPE,
            source: "Yahoo Finance / Alpha Vantage (PERatio)",
        },
        {
            name: "Debt to Equity",
            path: "financials.debtToEquity",
            available: financials?.debtToEquity !== null && financials?.debtToEquity !== undefined,
            value: financials?.debtToEquity,
            source: "Yahoo Finance (not in Alpha Vantage OVERVIEW)",
        },
        {
            name: "Free Cash Flow",
            path: "financials.freeCashflow",
            available: financials?.freeCashflow !== null && financials?.freeCashflow !== undefined,
            value: financials?.freeCashflow,
            source: "Yahoo Finance (not in Alpha Vantage OVERVIEW)",
        },
        {
            name: "Return on Equity",
            path: "financials.returnOnEquity",
            available: financials?.returnOnEquity !== null && financials?.returnOnEquity !== undefined,
            value: financials?.returnOnEquity,
            source: "Yahoo Finance / Alpha Vantage (ReturnOnEquityTTM)",
        },
    ];

    // --- OPTIONAL METRICS (Nice to have) ---
    const optionalMetrics: MetricStatus[] = [
        {
            name: "Forward P/E",
            path: "keyStats.forwardPE",
            available: keyStats?.forwardPE !== null && keyStats?.forwardPE !== undefined,
            value: keyStats?.forwardPE,
            source: "Yahoo Finance / Alpha Vantage (ForwardPE)",
        },
        {
            name: "PEG Ratio",
            path: "keyStats.pegRatio",
            available: keyStats?.pegRatio !== null && keyStats?.pegRatio !== undefined,
            value: keyStats?.pegRatio,
            source: "Yahoo Finance / Alpha Vantage (PEGRatio)",
        },
        {
            name: "Dividend Yield",
            path: "summary.dividendYield",
            available: summaryData?.dividendYield !== null && summaryData?.dividendYield !== undefined,
            value: summaryData?.dividendYield,
            source: "Yahoo Finance / Alpha Vantage (DividendYield)",
        },
        {
            name: "Payout Ratio",
            path: "keyStats.payoutRatio",
            available: keyStats?.payoutRatio !== null && keyStats?.payoutRatio !== undefined,
            value: keyStats?.payoutRatio,
            source: "Yahoo Finance / Alpha Vantage (PayoutRatio)",
        },
        {
            name: "Return on Assets",
            path: "keyStats.returnOnAssets",
            available: keyStats?.returnOnAssets !== null && keyStats?.returnOnAssets !== undefined,
            value: keyStats?.returnOnAssets,
            source: "Yahoo Finance / Alpha Vantage (ReturnOnAssetsTTM)",
        },
        {
            name: "ROCE",
            path: "financials.roce",
            available: financials?.roce !== null && financials?.roce !== undefined,
            value: financials?.roce,
            source: "Calculated: EBIT / (Total Assets - Current Liabilities)",
        },
        {
            name: "Price to Book",
            path: "keyStats.priceToBook",
            available: keyStats?.priceToBook !== null && keyStats?.priceToBook !== undefined,
            value: keyStats?.priceToBook,
            source: "Yahoo Finance (PriceToBookRatio in Alpha Vantage - not mapped)",
        },
        {
            name: "Beta",
            path: "risk.beta",
            available: risk?.beta !== null && risk?.beta !== undefined,
            value: risk?.beta,
            source: "Yahoo Finance / Alpha Vantage (Beta)",
        },
        {
            name: "Operating Cash Flow",
            path: "financials.operatingCashflow",
            available: financials?.operatingCashflow !== null && financials?.operatingCashflow !== undefined,
            value: financials?.operatingCashflow,
            source: "Yahoo Finance / Alpha Vantage (OperatingCashflowTTM)",
        },
    ];

    // --- ADVANCED METRICS (For deep-dive analysis) ---
    const advancedMetrics: MetricStatus[] = [
        {
            name: "RSI (Technicals)",
            path: "technicals.rsi",
            available: technicals?.rsi !== null && technicals?.rsi !== undefined,
            value: technicals?.rsi,
            source: "Calculated from price history",
        },
        {
            name: "Sharpe Ratio (Risk)",
            path: "risk.sharpe",
            available: risk?.sharpe !== null && risk?.sharpe !== undefined,
            value: risk?.sharpe,
            source: "Calculated from returns",
        },
        {
            name: "Revenue Trends (Annual)",
            path: "growth.revenueAnnual",
            available: growth?.revenueAnnual?.length !== undefined && growth?.revenueAnnual?.length > 0,
            value: growth?.revenueAnnual?.length ? `${growth.revenueAnnual.length} years` : null,
            source: "Yahoo Finance financial statements",
        },
        {
            name: "ICR (Interest Coverage)",
            path: "financials.icr",
            available: financials?.icr !== null && financials?.icr !== undefined,
            value: financials?.icr,
            source: "Calculated from EBIT/Interest",
        },
        {
            name: "Volume Trends",
            path: "technicals.volume",
            available: technicals?.volume !== null && technicals?.volume !== undefined,
            value: technicals?.volume,
            source: "Yahoo Finance quote data",
        },
        {
            name: "News Sentiment",
            path: "newsData.recent",
            available: newsData?.recent?.length !== undefined && newsData?.recent?.length > 0,
            value: newsData?.recent?.length ? `${newsData.recent.length} articles` : null,
            source: "News API / Google News",
        },
    ];

    // --- Calculate Scores ---
    const criticalAvailable = criticalMetrics.filter((m) => m.available).length;
    const optionalAvailable = optionalMetrics.filter((m) => m.available).length;
    const advancedAvailable = advancedMetrics.filter((m) => m.available).length;

    const criticalScore = (criticalAvailable / criticalMetrics.length) * 100;
    const optionalScore = (optionalAvailable / optionalMetrics.length) * 100;
    const advancedScore = (advancedAvailable / advancedMetrics.length) * 100;

    const totalAvailable = criticalAvailable + optionalAvailable + advancedAvailable;
    const totalMetrics = criticalMetrics.length + optionalMetrics.length + advancedMetrics.length;
    const overallScore = (totalAvailable / totalMetrics) * 100;

    // --- Confidence Level ---
    let confidenceLevel: "High" | "Medium" | "Low" = "Low";
    if (criticalScore >= 90 && overallScore >= 80) {
        confidenceLevel = "High";
    } else if (criticalScore >= 70 && overallScore >= 60) {
        confidenceLevel = "Medium";
    }

    // --- Generate Summary ---
    const missingCritical = criticalMetrics.filter((m) => !m.available);
    const missingOptional = optionalMetrics.filter((m) => !m.available);
    const missingAdvanced = advancedMetrics.filter((m) => !m.available);

    let reportSummary = `📊 Data Completeness: ${overallScore.toFixed(0)}% | Confidence: ${confidenceLevel}\n`;
    reportSummary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    reportSummary += `Critical: ${criticalAvailable}/${criticalMetrics.length} (${criticalScore.toFixed(0)}%)\n`;
    reportSummary += `Optional: ${optionalAvailable}/${optionalMetrics.length} (${optionalScore.toFixed(0)}%)\n`;
    reportSummary += `Advanced: ${advancedAvailable}/${advancedMetrics.length} (${advancedScore.toFixed(0)}%)\n`;

    if (missingCritical.length > 0) {
        reportSummary += `\n🚨 MISSING CRITICAL (${missingCritical.length}):\n`;
        missingCritical.forEach((m) => {
            reportSummary += `   ❌ ${m.name} (${m.path}) — Source: ${m.source}\n`;
        });
    }

    if (missingOptional.length > 0) {
        reportSummary += `\n⚠️ MISSING OPTIONAL (${missingOptional.length}):\n`;
        missingOptional.forEach((m) => {
            reportSummary += `   ⬜ ${m.name} (${m.path}) — Source: ${m.source}\n`;
        });
    }

    if (missingAdvanced.length > 0) {
        reportSummary += `\n📉 MISSING ADVANCED (${missingAdvanced.length}):\n`;
        missingAdvanced.forEach((m) => {
            reportSummary += `   ⬜ ${m.name} (${m.path}) — Source: ${m.source}\n`;
        });
    }

    return {
        ticker: financialData.ticker || "UNKNOWN",
        timestamp,
        overallScore,
        criticalScore,
        optionalScore,
        advancedScore,
        confidenceLevel,
        metrics: {
            critical: criticalMetrics,
            optional: optionalMetrics,
            advanced: advancedMetrics,
        },
        summary: reportSummary,
    };
}

/**
 * Print completeness report to console with rich formatting
 */
export function printCompletenessReport(report: CompletenessReport): void {
    console.log("\n" + "=".repeat(60));
    console.log(`📈 DATA COMPLETENESS REPORT: ${report.ticker}`);
    console.log("=".repeat(60));
    console.log(report.summary);
    console.log("=".repeat(60) + "\n");
}

/**
 * Quick diagnostic - returns just the missing metrics
 */
export function getMissingMetrics(
    financialData: Record<string, any> | undefined,
    newsData?: Record<string, any>
): { critical: string[]; optional: string[]; advanced: string[] } {
    const report = checkDataCompleteness(financialData, newsData);
    return {
        critical: report.metrics.critical.filter((m) => !m.available).map((m) => m.name),
        optional: report.metrics.optional.filter((m) => !m.available).map((m) => m.name),
        advanced: report.metrics.advanced.filter((m) => !m.available).map((m) => m.name),
    };
}
