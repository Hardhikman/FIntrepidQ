/**
 * Utility to sanitize objects for JSON serialization.
 * Handles cases like Infinity, NaN, and BigInt which are not standard JSON.
 * Includes circular reference protection.
 */
export function sanitizeForJson(obj: any, seen = new WeakSet()): any {
    if (obj === null || obj === undefined) {
        return null;
    }

    if (typeof obj === "number") {
        if (Number.isNaN(obj) || !Number.isFinite(obj)) {
            return null;
        }
        return obj;
    }

    if (typeof obj === "string" || typeof obj === "boolean") {
        return obj;
    }

    if (typeof obj === "bigint") {
        return obj.toString();
    }

    if (typeof obj === "object") {
        // Handle circular references
        if (seen.has(obj)) {
            return "[Circular]";
        }
        seen.add(obj);

        if (Array.isArray(obj)) {
            return obj.map(item => sanitizeForJson(item, seen));
        }

        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeForJson(value, seen);
        }
        return sanitized;
    }

    return String(obj);
}
