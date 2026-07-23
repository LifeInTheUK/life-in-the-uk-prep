const REPORTED_KEY = "ukTestReportedQuestions";

export type FeedbackCategory = "typo" | "wrong_info" | "confusing" | "duplicate";

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

export async function submitFeedback(
    questionId: number,
    category: FeedbackCategory,
): Promise<boolean> {
    try {
        const res = await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId, category }),
        });
        return res.ok;
    } catch {
        return false;
    }
}
