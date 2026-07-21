import type { SM2Data } from "./types";

const STORAGE_KEY = "ukTestSm2ById";

export function getSM2(id: number): SM2Data {
    const data: Record<number, SM2Data> =
        JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {};
    // n: repetitions in a row, ef: ease factor, i: interval (days), next: timestamp, attempts: total tries, correct: total correct
    return (
        data[id] || {
            n: 0,
            ef: 2.5,
            i: 0,
            next: 0,
            attempts: 0,
            correct: 0,
        }
    );
}

export function saveSM2(id: number, sm2Data: SM2Data): void {
    const data: Record<number, SM2Data> =
        JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {};
    data[id] = sm2Data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateGlobalAccuracy();
}

export function getAggregateStats(): { attempts: number; correct: number } {
    const data: Record<number, SM2Data> =
        JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {};
    let attempts = 0;
    let correct = 0;

    for (const key in data) {
        attempts += data[key].attempts || 0;
        correct += data[key].correct || 0;
    }

    return { attempts, correct };
}

export function updateGlobalAccuracy(): void {
    const { attempts, correct } = getAggregateStats();

    const accuracyEl = document.getElementById("global-accuracy");
    if (accuracyEl) {
        if (attempts === 0) {
            accuracyEl.textContent = "0%";
        } else {
            const pct = Math.round((correct / attempts) * 100);
            accuracyEl.textContent = pct + "%";
        }
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
