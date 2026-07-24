const REPORTED_KEY = "ukTestReportedQuestions";

export type FeedbackCategory = "typo" | "wrong_info" | "confusing" | "duplicate" | "other";

export function getReported(): number[] {
    return JSON.parse(localStorage.getItem(REPORTED_KEY) || "null") || [];
}

export function hasReported(questionId: number): boolean {
    return getReported().includes(questionId);
}

export function markReported(questionId: number): void {
    const reported = getReported();
    if (!reported.includes(questionId)) {
        reported.push(questionId);
        localStorage.setItem(REPORTED_KEY, JSON.stringify(reported));
    }
}

export function clearReported(): void {
    localStorage.removeItem(REPORTED_KEY);
}

export type SubmitFeedbackResult = { ok: true } | { ok: false; rateLimited: boolean };

export async function submitFeedback(
    questionId: number,
    category: FeedbackCategory,
    details?: string,
): Promise<SubmitFeedbackResult> {
    try {
        const res = await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
                details !== undefined ? { questionId, category, details } : { questionId, category },
            ),
        });
        if (res.ok) return { ok: true };
        return { ok: false, rateLimited: res.status === 429 || res.status === 403 };
    } catch {
        return { ok: false, rateLimited: false };
    }
}
