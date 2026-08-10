export interface TestResult {
    timestamp: number;
    score: number;
    total: number;
}

export function postHistory(result: TestResult): void {
    fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
    }).catch(() => {});
}

export interface HistoryResponse {
    entries: TestResult[];
    total: number;
}

export async function fetchHistoryFromServer(): Promise<HistoryResponse> {
    try {
        const res = await fetch("/api/history");
        if (!res.ok) return { entries: [], total: 0 };
        return await res.json();
    } catch {
        return { entries: [], total: 0 };
    }
}
