import type { SM2Data } from "./types";
import { getAuthState } from "./authState";

export function postProgress(id: number, sm2Data: SM2Data): void {
    if (getAuthState()) {
        fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, sm2Data }),
        }).catch(() => {});
    }
}

export async function fetchProgressFromServer(): Promise<Record<number, SM2Data>> {
    try {
        const res = await fetch("/api/progress");
        if (!res.ok) return {};
        return await res.json();
    } catch {
        return {};
    }
}

export function calculateSM2(sm2: SM2Data, quality: number): SM2Data {
    let { n, ef, i, next } = sm2;

    if (quality >= 3) {
        if (n === 0) i = 1;
        else if (n === 1) i = 6;
        else i = Math.round(i * ef);
        n++;
    } else {
        n = 0;
        i = 1; // Reset interval
    }

    // Adjust ease factor
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ef < 1.3) ef = 1.3;

    // Calculate next review timestamp (quality < 3 means review very soon, else scale by days)
    const delayMs = quality < 3 ? 60 * 1000 : i * 24 * 60 * 60 * 1000;
    next = Date.now() + delayMs;

    return { ...sm2, n, ef, i, next };
}
