import { z } from "zod";

/**
 * Hedge Fund Signal Categories
 */
export const SIGNAL_CATEGORIES = [
    "FUNDAMENTAL",
    "VALUATION",
    "QUALITY",
    "MOMENTUM",
    "RISK",
    "SENTIMENT",
    "DIVIDEND",
] as const;

export type SignalCategory = (typeof SIGNAL_CATEGORIES)[number];

export const SignalIconSchema = z.enum(["🟢", "🚩", "🟡", "⚪", "⚠️", "💀"]);
export type SignalIcon = z.infer<typeof SignalIconSchema>;

/**
 * Structured Signal Model
 */
export const SignalSchema = z.object({
    category: z.enum(SIGNAL_CATEGORIES),
    metric: z.string(),
    value: z.union([z.string(), z.number()]).optional(),
    signal: z.string(),
    icon: SignalIconSchema,
});

export type Signal = z.infer<typeof SignalSchema>;

/**
 * Agent State for LangGraph
 */
export type AgentState = {
    ticker: string;
    companyName?: string;
    financialData?: Record<string, any>;
    newsData?: Record<string, any>;
    rawSummary?: string;
    validationResult?: {
        completenessScore: number;
        confidenceLevel: "High" | "Medium" | "Low";
        missingCriticalMetrics: string[];
        validationReport?: string;
        enrichedData?: Record<string, any>;
    };
    analysisResult?: {
        verdict: "BUY" | "SELL" | "HOLD";
        thesis: string;
        greenFlags: Signal[];
        redFlags: Signal[];
        metricsTable: Signal[];
        technicalProfile: Record<string, any>;
        riskProfile: Record<string, any>;
        futureOutlook?: string;
    };
    agentConversation?: Array<{
        agent: string;
        message: string;
        timestamp: string;
    }>;
    finalReport?: string;
    conflicts?: Array<Record<string, any>>;
    interruptAtHumanReview?: boolean;
};

/**
 * Database Schema Interfaces
 */
export interface AnalysisReport {
    id: number;
    sessionId: string;
    userId: string;
    ticker: string;
    report: string;
    createdAt: Date;
    metadata?: any;
}
