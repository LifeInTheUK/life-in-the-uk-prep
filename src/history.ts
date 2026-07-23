import { getAuthState } from "./authState";

export interface TestResult {
    timestamp: number;
    score: number;
    total: number;
}

export function postHistory(result: TestResult): void {
    if (getAuthState()) {
        fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
        }).catch(() => {});
    }
}

export async function fetchHistoryFromServer(): Promise<TestResult[]> {
    try {
        const res = await fetch("/api/history");
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}
