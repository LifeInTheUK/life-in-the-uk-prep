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

export function calculateSM2(
    sm2: SM2Data,
    quality: number,
    currentSessionCount: number,
): SM2Data {
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

    // `next` is the completed-session count at which this question becomes due
    // again — spacing is measured in test sessions taken, not calendar days, so
    // review frequency tracks actual practice. quality < 3 (wrong answer) is due
    // immediately (no session wait); quality >= 3 is due after `i` more sessions.
    const sessionsUntilDue = quality < 3 ? 0 : i;
    next = currentSessionCount + sessionsUntilDue;

    return { ...sm2, n, ef, i, next };
}
