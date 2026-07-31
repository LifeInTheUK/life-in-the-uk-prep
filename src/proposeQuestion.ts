export type ProposeQuestionResult =
  | { ok: true }
  | { ok: false; reason: "rate_limited" | "invalid" | "other" };

export type ProposeQuestionInput = {
  question: string;
  options?: string[];
  answer?: number | number[];
  explanation?: string;
  topic?: string;
};

export async function submitQuestionProposal(
  input: ProposeQuestionInput,
): Promise<ProposeQuestionResult> {
  try {
    const res = await fetch("/api/propose-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) return { ok: true };
    if (res.status === 429 || res.status === 403) return { ok: false, reason: "rate_limited" };
    if (res.status === 400) return { ok: false, reason: "invalid" };
    return { ok: false, reason: "other" };
  } catch {
    return { ok: false, reason: "other" };
  }
}
