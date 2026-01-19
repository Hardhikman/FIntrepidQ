export function calculateRSI(prices: number[], period: number = 14): number | null {
    if (prices.length <= period) return null;
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        const gain = diff >= 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
}

export function calculateAnnualizedVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance * 252); // Assuming daily returns
}

export function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
    const annualReturn = returns.reduce((a, b) => a + b, 0) * (252 / returns.length);
    const vol = calculateAnnualizedVolatility(returns);
    if (vol === 0) return 0;
    return (annualReturn - riskFreeRate) / vol;
}

export function calculateMaxDrawdown(prices: number[]): number {
    let peak = -Infinity;
    let maxDrawdown = 0;

    for (const price of prices) {
        if (price > peak) peak = price;
        const drawdown = (price - peak) / peak;
        if (drawdown < maxDrawdown) maxDrawdown = drawdown;
    }

    return maxDrawdown;
}

export function calculateVaR(returns: number[], confidence: number = 0.95): number {
    if (returns.length === 0) return 0;
    const sorted = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sorted.length);
    return sorted[index] || 0;
}

export function calculateSMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
}

export function calculateEMA(prices: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const ema: number[] = [prices[0]];
    for (let i = 1; i < prices.length; i++) {
        ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
}

export function calculateMACD(prices: number[]) {
    if (prices.length < 26) return { macd: null, signal: null, histogram: null };
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macdLine = ema12.map((v, i) => v - ema26[i]);
    const signalLine = calculateEMA(macdLine.slice(25), 9); // Signal line is EMA 9 of MACD line
    const latestMacd = macdLine[macdLine.length - 1];
    const latestSignal = signalLine[signalLine.length - 1];
    return {
        macd: latestMacd,
        signal: latestSignal,
        histogram: latestMacd - latestSignal
    };
}
