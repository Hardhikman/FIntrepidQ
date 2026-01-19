import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const analysisReports = sqliteTable("analysis_reports", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionId: text("session_id").notNull(),
    userId: text("user_id").notNull(),
    ticker: text("ticker").notNull(),
    report: text("report").notNull(),
    metadata: text("metadata", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(new Date()),
});

export type AnalysisReport = typeof analysisReports.$inferSelect;
export type NewAnalysisReport = typeof analysisReports.$inferInsert;
