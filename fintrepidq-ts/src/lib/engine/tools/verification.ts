/**
 * Data Accuracy Verification
 * Compares primary data (Yahoo) with secondary data (Alpha Vantage) to detect conflicts.
 * Parity with Python verify_data_accuracy()
 */

export interface VerificationConflict {
    metric: string;
    primaryValue: any;
    secondaryValue: any;
    discrepancy: number; // Percent difference
    severity: "Low" | "Medium" | "High";
}

export interface VerificationResult {
    conflicts: VerificationConflict[];
    verificationReport: string;
}

export function verifyDataAccuracy(primaryData: any, secondaryData: any): VerificationResult {
    const conflicts: VerificationConflict[] = [];

    // Helper to calculate percent difference
    const getDiff = (a: number, b: number) => {
        if (!a || !b) return 0;
        return Math.abs((a - b) / a) * 100;
    };

    // 1. Check Market Cap (Critical)
    const pCap = primaryData.summary?.marketCap;
    const sCap = secondaryData.overview?.MarketCapitalization;
    if (pCap && sCap) {
        const diff = getDiff(pCap, parseFloat(sCap));
        if (diff > 5) { // Flag > 5% difference
            conflicts.push({
                metric: "Market Cap",
                primaryValue: pCap,
                secondaryValue: sCap,
                discrepancy: diff,
                severity: diff > 15 ? "High" : "Medium"
            });
        }
    }

    // 2. Check P/E Ratio
    const pPE = primaryData.financials?.trailingPE;
    const sPE = secondaryData.overview?.PERatio;
    if (pPE && sPE) {
        const diff = getDiff(pPE, parseFloat(sPE));
        if (diff > 10) {
            conflicts.push({
                metric: "Trailing P/E",
                primaryValue: pPE,
                secondaryValue: sPE,
                discrepancy: diff,
                severity: diff > 20 ? "High" : "Medium"
            });
        }
    }

    // 3. Check Price
    const pPrice = primaryData.price;
    const sPrice = secondaryData.quote?.["05. price"];
    if (pPrice && sPrice) {
        const diff = getDiff(pPrice, parseFloat(sPrice));
        if (diff > 2) { // Prices should be very close
            conflicts.push({
                metric: "Current Price",
                primaryValue: pPrice,
                secondaryValue: sPrice,
                discrepancy: diff,
                severity: diff > 5 ? "High" : "Medium"
            });
        }
    }

    // Generate report
    let report = "";
    if (conflicts.length > 0) {
        report = "### ⚠️ Data Source Conflicts Detected\n";
        conflicts.forEach(c => {
            report += `- **${c.metric}**: Discrepancy of ${c.discrepancy.toFixed(1)}% between Yahoo (${c.primaryValue}) and Alpha Vantage (${c.secondaryValue}). Severity: ${c.severity}\n`;
        });
    } else {
        report = "### ✅ Data Accuracy Verified\nNo significant discrepancies found between Yahoo Finance and Alpha Vantage.";
    }

    return { conflicts, verificationReport: report };
}
