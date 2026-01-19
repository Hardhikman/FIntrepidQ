import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("equity_ai.db");
export const db = drizzle(sqlite, { schema });

// Migration helper (Sync for SQLite simple use case)
export async function initDb() {
    // In a real Next.js app, we'd use drizzle-kit push or similar in dev
    console.log("Database initialized.");
}
