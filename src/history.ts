import { getAuthState } from "./authState";

export interface TestResult {
    timestamp: number;
    score: number;
    total: number;
}

const HISTORY_KEY = "ukTestHistory";
const MAX_ENTRIES = 50;

export function getHistory(): TestResult[] {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "null") || [];
}

export function addResult(score: number, total: number): void {
    const history = getHistory();
    const result: TestResult = { timestamp: Date.now(), score, total };
    history.push(result);
    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history.slice(-MAX_ENTRIES)),
    );

    if (getAuthState()) {
        fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
        }).catch(() => {});
    }
}

export async function pullHistoryFromServer(): Promise<void> {
    try {
        const res = await fetch("/api/history");
        if (!res.ok) return;
        const serverHistory: TestResult[] = await res.json();

        const localHistory = getHistory();
        const merged = [...localHistory, ...serverHistory]
            .filter(
                (entry, index, all) =>
                    all.findIndex((e) => e.timestamp === entry.timestamp) ===
                    index,
            )
            .sort((a, b) => a.timestamp - b.timestamp);

        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(merged.slice(-MAX_ENTRIES)),
        );
    } catch {
        // Silent — background sync, never blocks the app.
    }
}
