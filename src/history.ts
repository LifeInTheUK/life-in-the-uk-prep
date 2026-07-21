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
    history.push({ timestamp: Date.now(), score, total });
    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history.slice(-MAX_ENTRIES)),
    );
}
