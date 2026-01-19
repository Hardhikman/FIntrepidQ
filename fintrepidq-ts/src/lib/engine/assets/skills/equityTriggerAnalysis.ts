/**
 * Equity Trigger Analysis Skill
 * Thresholds and rules parsed from SKILL.md
 * 
 * This module provides the signal thresholds for the hedge fund analysis engine.
 * It mirrors the rules defined in context_engineering/skills/equity_trigger_analysis/SKILL.md
 */

// ============================================================================
// THRESHOLDS (from SKILL.md)
// ============================================================================

export const SKILL_THRESHOLDS = {
    // 1️⃣ FUNDAMENTAL SIGNALS
    fundamental: {
        revenueGrowth: {
            strong: 0.15,      // > 15% = 🟢 Strong Growth
            moderate: 0.05,    // > 5% = 🟢 Moderate Growth
            flat: -0.05,       // -5% to 5% = 🟡 Flat
            declining: -0.05   // < -5% = 🚩 Declining
        },
        profitMargins: {
            strong: 0.15,      // > 15% = 🟢 Strong
            moderate: 0.05,    // 5-15% = 🟡 Moderate
            low: 0.05          // < 5% = 🚩 Low/Negative
        },
        roe: {
            strong: 0.15,      // > 15% = 🟢 Strong
            acceptable: 0.08,  // 8-15% = 🟡 Acceptable
            weak: 0.08         // < 8% = 🚩 Weak
        },
        roce: {
            excellent: 0.20,   // > 20% = 🟢 Excellent
            good: 0.15,        // 15-20% = 🟢 Good
            acceptable: 0.10,  // 10-15% = 🟡 Acceptable
            weak: 0.10         // < 10% = 🚩 Weak
        }
    },

    // 2️⃣ VALUATION SIGNALS
    valuation: {
        trailingPE: {
            undervalued: 15,   // < 15 = 🟢 Undervalued
            fairLow: 15,       // 15 = Fair start
            fairHigh: 25,      // 25 = Fair end
            overvalued: 25,    // > 25 = 🚩 Overvalued
            extreme: 50        // > 50 = ⚠️ Extreme
        },
        pegRatio: {
            attractive: 1.0,   // < 1.0 = 🟢 Attractive
            fairLow: 1.0,      // 1.0 = Fair start
            fairHigh: 2.0,     // 2.0 = Fair end
            expensive: 2.0     // > 2.0 = 🚩 Expensive
        },
        priceToBook: {
            value: 1.5,        // < 1.5 = 🟢 Value Stock
            fairLow: 1.5,      // 1.5 = Fair start
            fairHigh: 3.0,     // 3.0 = Fair end
            growthPremium: 3.0 // > 3.0 = 🚩 Growth Premium
        }
    },

    // 3️⃣ QUALITY SIGNALS
    quality: {
        debtToEquity: {
            low: 0.5,          // < 0.5 = 🟢 Low Leverage
            moderateLow: 0.5,  // 0.5 = Moderate start
            moderateHigh: 1.5, // 1.5 = Moderate end
            high: 1.5,         // > 1.5 = 🚩 High Leverage
            dangerous: 2.0     // > 2.0 = 💀 Dangerous
        },
        icr: {
            exceptional: 10.0, // > 10 = 🟢 Exceptional
            strong: 3.0,       // > 3 = 🟢 Strong
            acceptableLow: 2.0,// 2-3 = 🟡 Acceptable
            acceptableHigh: 3.0,
            fairLow: 1.5,      // 1.5-2 = 🟡 Fair
            fairHigh: 2.0,
            risk: 1.0,         // 1-1.5 = 🚩 Risk
            highRisk: 1.0      // < 1 = 💀 High Risk
        }
    },

    // 4️⃣ MOMENTUM SIGNALS
    momentum: {
        rsi: {
            oversold: 30,      // < 30 = 🟢 Oversold (Buying opportunity)
            neutralLow: 30,    // 30 = Neutral start
            neutralHigh: 70,   // 70 = Neutral end
            overbought: 70     // > 70 = 🚩 Overbought
        }
    },

    // 5️⃣ RISK SIGNALS
    risk: {
        sharpe: {
            excellent: 2.0,    // > 2.0 = 🟢 Excellent
            good: 1.0,         // 1-2 = 🟢 Good
            acceptable: 0.0,   // 0-1 = 🟡 Acceptable
            poor: 0.0          // < 0 = 🚩 Poor
        },
        volatility: {
            low: 0.25,         // < 25% = 🟢 Low
            moderateLow: 0.25, // 25% = Moderate start
            moderateHigh: 0.40,// 40% = Moderate end
            high: 0.40         // > 40% = 🚩 High
        },
        maxDrawdown: {
            low: -0.20,        // > -20% = 🟢 Low
            moderateLow: -0.20,// -20% = Moderate start
            moderateHigh: -0.40,// -40% = Moderate end
            high: -0.40,       // <= -40% = 🚩 High Risk
            severe: -0.50      // < -50% = 💀 Severe
        },
        beta: {
            low: 1.0,          // < 1 = 🟢 Low Volatility
            marketLikeLow: 1.0,// 1 = Market-like start
            marketLikeHigh: 1.5,// 1.5 = Market-like end
            high: 1.5,         // > 1.5 = 🚩 High Volatility
            veryHigh: 2.0      // > 2 = 💀 Very High Risk
        },
        var95: {
            low: -0.02,        // > -2% = 🟢 Low Risk
            moderateLow: -0.02,// -2% = Moderate start
            moderateHigh: -0.04,// -4% = Moderate end
            high: -0.04        // <= -4% = 🚩 High Risk
        }
    },

    // 7️⃣ DIVIDEND SIGNALS
    dividend: {
        yield: {
            attractive: 0.03,  // > 3% = 🟢 Attractive
            moderateLow: 0.01, // 1% = Moderate start
            moderateHigh: 0.03,// 3% = Moderate end
            low: 0.01          // < 1% = 🟡 Low/None
        },
        payoutRatio: {
            sustainable: 0.50, // < 50% = 🟢 Sustainable
            moderateLow: 0.50, // 50% = Moderate start
            moderateHigh: 0.70,// 70% = Moderate end
            high: 0.70,        // 70-90% = 🚩 High
            risky: 0.90        // > 90% = 💀 Risky
        }
    }
} as const;

// ============================================================================
// SIGNAL CATEGORIES (from SKILL.md)
// ============================================================================

export const SIGNAL_CATEGORIES = [
    "FUNDAMENTAL",
    "VALUATION",
    "QUALITY",
    "MOMENTUM",
    "RISK",
    "SENTIMENT",
    "DIVIDEND"
] as const;

export type SignalCategory = typeof SIGNAL_CATEGORIES[number];

// ============================================================================
// SIGNAL EVALUATION FUNCTIONS
// ============================================================================

export type SignalIcon = "🟢" | "🟡" | "🚩" | "💀" | "⚪";

export interface EvaluatedSignal {
    category: SignalCategory;
    metric: string;
    value: number | string | undefined;
    signal: string;
    icon: SignalIcon;
}

/**
 * Evaluate Revenue Growth signal
 */
export function evaluateRevenueGrowth(value: number | undefined): EvaluatedSignal {
    const t = SKILL_THRESHOLDS.fundamental.revenueGrowth;
    let signal: string;
    let icon: SignalIcon;

    if (value === undefined || value === null) {
        signal = "N/A";
        icon = "⚪";
    } else if (value > t.strong) {
        signal = "Strong Growth";
        icon = "🟢";
    } else if (value > t.moderate) {
        signal = "Moderate Growth";
        icon = "🟢";
    } else if (value >= t.flat) {
        signal = "Flat";
        icon = "🟡";
    } else {
        signal = "Declining";
        icon = "🚩";
    }

    return { category: "FUNDAMENTAL", metric: "Revenue Growth", value, signal, icon };
}

/**
 * Evaluate ROE signal
 */
export function evaluateROE(value: number | undefined): EvaluatedSignal {
    const t = SKILL_THRESHOLDS.fundamental.roe;
    let signal: string;
    let icon: SignalIcon;

    if (value === undefined || value === null) {
        signal = "N/A";
        icon = "⚪";
    } else if (value > t.strong) {
        signal = "Strong";
        icon = "🟢";
    } else if (value >= t.acceptable) {
        signal = "Acceptable";
        icon = "🟡";
    } else {
        signal = "Weak";
        icon = "🚩";
    }

    return { category: "FUNDAMENTAL", metric: "ROE", value, signal, icon };
}

/**
 * Evaluate Trailing P/E signal
 */
export function evaluateTrailingPE(value: number | undefined): EvaluatedSignal {
    const t = SKILL_THRESHOLDS.valuation.trailingPE;
    let signal: string;
    let icon: SignalIcon;

    if (value === undefined || value === null) {
        signal = "N/A";
        icon = "⚪";
    } else if (value < 0) {
        signal = "Negative (Loss-Making)";
        icon = "🚩";
    } else if (value > t.extreme) {
        signal = "Extreme";
        icon = "🚩";
    } else if (value > t.overvalued) {
        signal = "Overvalued";
        icon = "🚩";
    } else if (value < t.undervalued) {
        signal = "Undervalued";
        icon = "🟢";
    } else {
        signal = "Fair Value";
        icon = "🟡";
    }

    return { category: "VALUATION", metric: "Trailing P/E", value, signal, icon };
}

/**
 * Evaluate PEG Ratio signal
 */
export function evaluatePEGRatio(value: number | undefined): EvaluatedSignal {
    const t = SKILL_THRESHOLDS.valuation.pegRatio;
    let signal: string;
    let icon: SignalIcon;

    if (value === undefined || value === null) {
        signal = "N/A";
        icon = "⚪";
    } else if (value < t.attractive) {
        signal = "Attractive";
        icon = "🟢";
    } else if (value <= t.fairHigh) {
        signal = "Fair";
        icon = "🟡";
    } else {
        signal = "Expensive";
        icon = "🚩";
    }

    return { category: "VALUATION", metric: "PEG Ratio", value, signal, icon };
}

/**
 * Evaluate Debt/Equity signal
 */
export function evaluateDebtToEquity(value: number | undefined): EvaluatedSignal {
    const t = SKILL_THRESHOLDS.quality.debtToEquity;
    let signal: string;
    let icon: SignalIcon;

    if (value === undefined || value === null) {
        signal = "N/A";
        icon = "⚪";
    } else if (value > t.dangerous) {
        signal = "Dangerous";
        icon = "💀";
    } else if (value > t.high) {
        signal = "High Leverage";
        icon = "🚩";
    } else if (value < t.low) {
        signal = "Low Leverage";
        icon = "🟢";
    } else {
        signal = "Moderate";
        icon = "🟡";
    }

    return { category: "QUALITY", metric: "Debt/Equity", value, signal, icon };
}

/**
 * Evaluate ICR signal
 */
export function evaluateICR(value: number | undefined): EvaluatedSignal {
    const t = SKILL_THRESHOLDS.quality.icr;
    let signal: string;
    let icon: SignalIcon;

    if (value === undefined || value === null) {
        signal = "N/A";
        icon = "⚪";
    } else if (value < t.highRisk) {
        signal = "Unable to cover interest";
        icon = "💀";
    } else if (value < t.risk) {
        signal = "Increasing default risk";
        icon = "🚩";
    } else if (value > t.exceptional) {
        signal = "Exceptional";
        icon = "🟢";
    } else if (value > t.strong) {
        signal = "Strong";
        icon = "🟢";
    } else if (value >= t.acceptableLow) {
        signal = "Acceptable";
        icon = "🟡";
    } else {
        signal = "Fair";
        icon = "🟡";
    }

    return { category: "QUALITY", metric: "ICR", value, signal, icon };
}

/**
 * Evaluate RSI signal
 */
export function evaluateRSI(value: number | undefined): EvaluatedSignal {
    const t = SKILL_THRESHOLDS.momentum.rsi;
    let signal: string;
    let icon: SignalIcon;

    if (value === undefined || value === null) {
        signal = "N/A";
        icon = "⚪";
    } else if (value < t.oversold) {
        signal = "Oversold (Buying Opportunity)";
        icon = "🟢";
    } else if (value > t.overbought) {
        signal = "Overbought (Caution)";
        icon = "🚩";
    } else {
        signal = "Neutral";
        icon = "🟡";
    }

    return { category: "MOMENTUM", metric: "RSI", value, signal, icon };
}

/**
 * Evaluate Sharpe Ratio signal
 */
export function evaluateSharpe(value: number | undefined): EvaluatedSignal {
    const t = SKILL_THRESHOLDS.risk.sharpe;
    let signal: string;
    let icon: SignalIcon;

    if (value === undefined || value === null) {
        signal = "N/A";
        icon = "⚪";
    } else if (value > t.excellent) {
        signal = "Excellent";
        icon = "🟢";
    } else if (value > t.good) {
        signal = "Good";
        icon = "🟢";
    } else if (value > t.acceptable) {
        signal = "Acceptable";
        icon = "🟡";
    } else {
        signal = "Poor";
        icon = "🚩";
    }

    return { category: "RISK", metric: "Sharpe Ratio", value, signal, icon };
}

/**
 * Evaluate Beta signal
 */
export function evaluateBeta(value: number | undefined): EvaluatedSignal {
    const t = SKILL_THRESHOLDS.risk.beta;
    let signal: string;
    let icon: SignalIcon;

    if (value === undefined || value === null) {
        signal = "N/A";
        icon = "⚪";
    } else if (value > t.veryHigh) {
        signal = "Very High Risk";
        icon = "💀";
    } else if (value > t.high) {
        signal = "High Volatility";
        icon = "🚩";
    } else if (value < t.low) {
        signal = "Low Volatility";
        icon = "🟢";
    } else {
        signal = "Market-like";
        icon = "🟡";
    }

    return { category: "RISK", metric: "Beta", value, signal, icon };
}

/**
 * Evaluate Dividend Yield signal
 */
export function evaluateDividendYield(value: number | undefined): EvaluatedSignal {
    const t = SKILL_THRESHOLDS.dividend.yield;
    let signal: string;
    let icon: SignalIcon;

    if (value === undefined || value === null) {
        signal = "N/A";
        icon = "⚪";
    } else if (value > t.attractive) {
        signal = "Attractive";
        icon = "🟢";
    } else if (value >= t.moderateLow) {
        signal = "Moderate";
        icon = "🟡";
    } else {
        signal = "Low/None";
        icon = "🟡";
    }

    return { category: "DIVIDEND", metric: "Dividend Yield", value, signal, icon };
}

/**
 * Evaluate Payout Ratio signal
 */
export function evaluatePayoutRatio(value: number | undefined): EvaluatedSignal {
    const t = SKILL_THRESHOLDS.dividend.payoutRatio;
    let signal: string;
    let icon: SignalIcon;

    if (value === undefined || value === null) {
        signal = "N/A";
        icon = "⚪";
    } else if (value > t.risky) {
        signal = "Potential dividend cut";
        icon = "💀";
    } else if (value > t.high) {
        signal = "Limited flexibility";
        icon = "🚩";
    } else if (value < t.sustainable) {
        signal = "Sustainable";
        icon = "🟢";
    } else {
        signal = "Moderate";
        icon = "🟡";
    }

    return { category: "DIVIDEND", metric: "Payout Ratio", value, signal, icon };
}

/**
 * Evaluate ROCE signal (New - Python parity)
 */
export function evaluateROCE(value: number | undefined): EvaluatedSignal {
    const t = SKILL_THRESHOLDS.fundamental.roce;
    let signal: string;
    let icon: SignalIcon;

    if (value === undefined || value === null) {
        signal = "N/A";
        icon = "⚪";
    } else if (value > t.excellent) {
        signal = "Excellent";
        icon = "🟢";
    } else if (value > t.good) {
        signal = "Good";
        icon = "🟢";
    } else if (value >= t.acceptable) {
        signal = "Acceptable";
        icon = "🟡";
    } else {
        signal = "Weak";
        icon = "🚩";
    }

    return { category: "FUNDAMENTAL", metric: "ROCE", value, signal, icon };
}

/**
 * Evaluate Trend signal (Bullish/Bearish based on price vs SMA200)
 */
export function evaluateTrend(currentPrice?: number, sma200?: number): EvaluatedSignal {
    let signal: string;
    let icon: SignalIcon;

    if (currentPrice === undefined || sma200 === undefined || currentPrice === null || sma200 === null) {
        signal = "N/A";
        icon = "⚪";
    } else if (currentPrice > sma200) {
        signal = "Bullish";
        icon = "🟢";
    } else {
        signal = "Bearish";
        icon = "🚩";
    }

    return { category: "MOMENTUM", metric: "Trend", value: currentPrice && sma200 ? (currentPrice > sma200 ? "Bullish" : "Bearish") : "-", signal, icon };
}

// ============================================================================
// MASTER EVALUATION FUNCTION
// ============================================================================

export interface FinancialData {
    growth?: { revenueGrowth?: number; revenueAnnual?: number[] };
    keyStats?: {
        returnOnEquity?: number; // Fallback location
        trailingPE?: number;
        pegRatio?: number;
        beta?: number;
        payoutRatio?: number;
        priceToBook?: number;
    };
    financials?: {
        debtToEquity?: number;
        icr?: number;
        returnOnEquity?: number; // Primary location (from finance.ts)
        roce?: number;           // Primary location (from finance.ts)
        trailingPE?: number;     // Fallback
    };
    technicals?: { rsi?: number; currentPrice?: number; sma200?: number };
    risk?: { sharpe?: number; beta?: number };
    summary?: { dividendYield?: number };
}

/**
 * Evaluate all signals from financial data using SKILL.md thresholds
 */
export function evaluateAllSignals(data: FinancialData | undefined): EvaluatedSignal[] {
    if (!data) return [];

    const growth = data.growth || {};
    const keyStats = data.keyStats || {};
    const financials = data.financials || {};
    const technicals = data.technicals || {};
    const risk = data.risk || {};
    const summary = data.summary || {};

    const signals: EvaluatedSignal[] = [
        // Fundamental - Use correct paths with fallbacks
        evaluateRevenueGrowth(growth.revenueGrowth ?? growth.revenueAnnual?.[0]),
        evaluateROE(financials.returnOnEquity ?? keyStats.returnOnEquity),
        evaluateROCE(financials.roce),

        // Valuation - Use correct paths with fallbacks
        evaluateTrailingPE(financials.trailingPE ?? keyStats.trailingPE),
        evaluatePEGRatio(keyStats.pegRatio),

        // Quality
        evaluateDebtToEquity(financials.debtToEquity),
        evaluateICR(financials.icr),

        // Momentum
        evaluateRSI(technicals.rsi),
        evaluateTrend(technicals.currentPrice, technicals.sma200),

        // Risk - Use correct paths with fallbacks
        evaluateSharpe(risk.sharpe),
        evaluateBeta(risk.beta ?? keyStats.beta),

        // Dividend
        evaluateDividendYield(summary.dividendYield),
        evaluatePayoutRatio(keyStats.payoutRatio),
    ];

    // Filter out N/A signals
    return signals.filter(s => s.icon !== "⚪");
}

