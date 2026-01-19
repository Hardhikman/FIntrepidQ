/**
 * FIntrepidQ Server-Side Terminal Logger
 * Mimics the institutional look of the original CLI logger.
 */

const COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",

    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",

    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m",
};

class IntrepidLogger {
    private format(color: keyof typeof COLORS, text: string) {
        return `${COLORS[color]}${text}${COLORS.reset}`;
    }

    header(ticker: string) {
        console.log("\n" + this.format("bgCyan", `  FINTREPID-Q  `) + this.format("bgBlue", `  ANALYSIS: ${ticker.toUpperCase()}  `) + "\n");
    }

    phase(name: string) {
        console.log(this.format("bright", this.format("magenta", `\n ▶ PHASE: ${name.toUpperCase()}`)));
        console.log(this.format("dim", " ──────────────────────────────────────────────────"));
    }

    step(message: string, icon = "🔹") {
        console.log(` ${icon} ${message}`);
    }

    tool(name: string, args?: any) {
        const argsStr = args ? this.format("dim", ` (${JSON.stringify(args).slice(0, 50)}...)`) : "";
        console.log(`   ${this.format("cyan", "⚡ TOOL:")} ${this.format("white", name)}${argsStr}`);
    }

    success(message: string) {
        console.log(` ${this.format("green", "✓")} ${this.format("dim", message)}`);
    }

    error(message: string) {
        console.log(` ${this.format("red", "✗")} ${this.format("bright", message)}`);
    }

    warn(message: string) {
        console.log(` ${this.format("yellow", "⚠️")} ${this.format("yellow", message)}`);
    }

    info(message: string) {
        console.log(` ${this.format("blue", "ℹ️")} ${this.format("dim", message)}`);
    }

    metric(label: string, value: any) {
        console.log(`   ${this.format("yellow", "📊 " + label + ":")} ${this.format("white", String(value))}`);
    }

    divider() {
        console.log(this.format("dim", " ──────────────────────────────────────────────────\n"));
    }

    /**
     * Real-time news item streaming (Python parity: log_news_item)
     */
    newsItem(title: string, source: string, date?: string) {
        const truncTitle = title.length > 60 ? title.slice(0, 57) + "..." : title;
        const dateStr = date ? this.format("dim", ` (${date})`) : "";
        console.log(`  📰 ${this.format("cyan", source)} ${truncTitle}${dateStr}`);
    }

    /**
     * Alpha Vantage enrichment feedback
     */
    avEnrichment(metric: string, value: any) {
        console.log(`   ${this.format("green", "✓")} Filled ${this.format("cyan", metric)}: ${this.format("white", String(value))}`);
    }

    /**
     * Simple table row for metrics (Python parity: log_financial_data simplified)
     */
    tableRow(category: string, metric: string, value: any, format: "price" | "percent" | "ratio" | "large" = "ratio") {
        let formatted = String(value);
        if (value !== null && value !== undefined) {
            if (format === "price") formatted = `$${Number(value).toFixed(2)}`;
            else if (format === "percent") formatted = `${(Number(value) * 100).toFixed(1)}%`;
            else if (format === "large") {
                const num = Number(value);
                if (num >= 1e12) formatted = `$${(num / 1e12).toFixed(2)}T`;
                else if (num >= 1e9) formatted = `$${(num / 1e9).toFixed(2)}B`;
                else if (num >= 1e6) formatted = `$${(num / 1e6).toFixed(2)}M`;
                else formatted = `$${num.toLocaleString()}`;
            }
        } else {
            formatted = this.format("dim", "N/A");
        }
        console.log(`   ${this.format("yellow", category)} ${this.format("dim", metric)}: ${this.format("white", formatted)}`);
    }

    private timers: Record<string, number> = {};

    time(label: string) {
        this.timers[label] = Date.now();
    }

    timeEnd(label: string) {
        if (this.timers[label]) {
            const duration = (Date.now() - this.timers[label]) / 1000;
            console.log(`   ${this.format("dim", `⏱️ ${label} completed in ${duration.toFixed(1)}s`)}`);
            delete this.timers[label];
        }
    }
}

export const serverLogger = new IntrepidLogger();
