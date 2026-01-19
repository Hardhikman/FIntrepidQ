/**
 * Alpha Vantage Client for Data Enrichment
 * Port of Python alpha_vantage_client.py
 */

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";

interface AVResponse {
    status: "success" | "error";
    data?: any;
    error?: string;
}

async function makeAVRequest(func: string, symbol: string, apiKey: string): Promise<any> {
    const params = new URLSearchParams({
        function: func,
        symbol: symbol.toUpperCase(),
        apikey: apiKey
    });

    try {
        const res = await fetch(`${ALPHA_VANTAGE_BASE_URL}?${params}`);
        const data = await res.json();

        if (data["Error Message"]) {
            return { error: data["Error Message"] };
        }
        if (data["Note"]) {
            console.warn(`[Alpha Vantage] API limit note: ${data["Note"]}`);
        }
        return data;
    } catch (e) {
        console.error(`[Alpha Vantage] Request failed:`, e);
        return { error: String(e) };
    }
}

export async function getAlphaVantageData(ticker: string, apiKey: string): Promise<AVResponse> {
    if (!apiKey) {
        return { status: "error", error: "ALPHA_VANTAGE_API_KEY not configured" };
    }

    console.log(`[Alpha Vantage] Fetching enrichment data for ${ticker}...`);

    const [overview, quote] = await Promise.all([
        makeAVRequest("OVERVIEW", ticker, apiKey),
        makeAVRequest("GLOBAL_QUOTE", ticker, apiKey)
    ]);

    // Check for errors
    const errors: string[] = [];
    if (overview.error) errors.push(`overview: ${overview.error}`);
    if (quote.error) errors.push(`quote: ${quote.error}`);

    if (errors.length === 2) {
        return { status: "error", error: errors.join("; ") };
    }

    return {
        status: "success",
        data: {
            overview: overview,
            quote: quote["Global Quote"] || {}
        }
    };
}

/**
 * Fill missing metrics from Alpha Vantage into Yahoo data
 * Port of Python fill_missing_from_alpha_vantage()
 */
export function fillMissingFromAlphaVantage(
    primaryData: Record<string, any>,
    avData: { overview?: any; quote?: any }
): { filledData: Record<string, any>; filledMetrics: string[] } {
    const filledData = { ...primaryData };
    const filledMetrics: string[] = [];
    const overview = avData.overview || {};
    const quote = avData.quote || {};

    const parseVal = (val: any): number | null => {
        if (val === null || val === undefined || val === "" || val === "None") return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
    };

    // Help with nested isMissing - explicit null/undefined check to preserve 0
    const isMissingPath = (obj: any, path: string): boolean => {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current === null || current === undefined) return true;
            current = current[part];
        }
        return current === null || current === undefined;
    };

    // 1. current_price
    if (isMissingPath(filledData, "price")) {
        const avPrice = parseVal(quote["05. price"]);
        if (avPrice !== null) {
            filledData.price = avPrice;
            filledMetrics.push("current_price");
        }
    }

    // 2. trailing_pe
    if (isMissingPath(filledData, "financials.trailingPE")) {
        const avPE = parseVal(overview["PERatio"]);
        if (avPE !== null) {
            filledData.financials = { ...filledData.financials, trailingPE: avPE };
            filledMetrics.push("trailing_pe");
        }
    }

    // 3. forward_pe
    if (isMissingPath(filledData, "keyStats.forwardPE")) {
        const avFwdPE = parseVal(overview["ForwardPE"]);
        if (avFwdPE !== null) {
            filledData.keyStats = { ...filledData.keyStats, forwardPE: avFwdPE };
            filledMetrics.push("forward_pe");
        }
    }

    // 4. peg_ratio
    if (isMissingPath(filledData, "keyStats.pegRatio")) {
        const avPEG = parseVal(overview["PEGRatio"]);
        console.log(`[Alpha Vantage] PEG Ratio from AV: ${overview["PEGRatio"]} -> parsed: ${avPEG}`);
        if (avPEG !== null) {
            filledData.keyStats = { ...filledData.keyStats, pegRatio: avPEG };
            filledMetrics.push("peg_ratio");
        }
    } else {
        console.log(`[Alpha Vantage] PEG Ratio already exists: ${filledData.keyStats?.pegRatio}`);
    }

    // 5. return_on_equity
    if (isMissingPath(filledData, "financials.returnOnEquity")) {
        const avROE = parseVal(overview["ReturnOnEquityTTM"]);
        if (avROE !== null) {
            filledData.financials = { ...filledData.financials, returnOnEquity: avROE };
            filledMetrics.push("return_on_equity");
        }
    }

    // 6. profit_margins
    if (isMissingPath(filledData, "growth.profitMargins")) {
        const avPM = parseVal(overview["ProfitMargin"]);
        if (avPM !== null) {
            filledData.growth = { ...filledData.growth, profitMargins: avPM };
            filledMetrics.push("profit_margins");
        }
    }

    // 7. revenue_growth
    if (isMissingPath(filledData, "growth.revenueGrowth")) {
        const avRevGrowth = parseVal(overview["QuarterlyRevenueGrowthYOY"]);
        if (avRevGrowth !== null) {
            filledData.growth = { ...filledData.growth, revenueGrowth: avRevGrowth };
            filledMetrics.push("revenue_growth");
        }
    }

    // 8. dividend_yield
    if (isMissingPath(filledData, "summary.dividendYield")) {
        const avDiv = parseVal(overview["DividendYield"]);
        if (avDiv !== null) {
            filledData.summary = { ...filledData.summary, dividendYield: avDiv };
            filledMetrics.push("dividend_yield");
        }
    }

    // 9. beta
    if (isMissingPath(filledData, "risk.beta")) {
        const avBeta = parseVal(overview["Beta"]);
        if (avBeta !== null) {
            filledData.risk = { ...filledData.risk, beta: avBeta };
            filledMetrics.push("beta");
        }
    }

    // 10. market_cap
    if (isMissingPath(filledData, "summary.marketCap")) {
        const avMC = parseVal(overview["MarketCapitalization"]);
        if (avMC !== null) {
            filledData.summary = { ...filledData.summary, marketCap: avMC };
            filledMetrics.push("market_cap");
        }
    }

    // 11. payout_ratio
    if (isMissingPath(filledData, "keyStats.payoutRatio")) {
        const avPayout = parseVal(overview["PayoutRatio"]);
        if (avPayout !== null) {
            filledData.keyStats = { ...filledData.keyStats, payoutRatio: avPayout };
            filledMetrics.push("payout_ratio");
        }
    }

    // 12. return_on_assets
    if (isMissingPath(filledData, "keyStats.returnOnAssets")) {
        const avROA = parseVal(overview["ReturnOnAssetsTTM"]);
        if (avROA !== null) {
            filledData.keyStats = { ...filledData.keyStats, returnOnAssets: avROA };
            filledMetrics.push("return_on_assets");
        }
    }

    // 13. operating_cashflow
    if (isMissingPath(filledData, "financials.operatingCashflow")) {
        const avOCF = parseVal(overview["OperatingCashflowTTM"]); // AV Overview has this or we could get it from CF
        if (avOCF !== null) {
            filledData.financials = { ...filledData.financials, operatingCashflow: avOCF };
            filledMetrics.push("operating_cashflow");
        }
    }

    // 14. ROCE (Calculated: EBIT / Capital Employed) - Not provided by AV, so we calculate it
    // Capital Employed = Total Assets - Current Liabilities
    // We use OperatingIncome as a proxy for EBIT
    if (isMissingPath(filledData, "keyStats.roce")) {
        const operatingIncome = parseVal(overview["OperatingMarginTTM"]);
        const totalAssets = parseVal(overview["TotalAssets"]);
        const currentLiabilities = parseVal(overview["CurrentLiabilities"]);

        // If we have the components, calculate ROCE
        // Note: This is an approximation. For a true ROCE, you'd need full balance sheet data.
        if (operatingIncome !== null && totalAssets && currentLiabilities) {
            const capitalEmployed = totalAssets - currentLiabilities;
            if (capitalEmployed > 0) {
                // We can't directly calculate ROCE from margin, we'd need absolute EBIT.
                // For now, leave it unfillable unless we pull more data.
            }
        }
    }

    return { filledData, filledMetrics };
}
