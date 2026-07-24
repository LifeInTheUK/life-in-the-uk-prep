export type CaptchaChallenge = { token: string; question: string };

export type AppFeedbackResult =
  | { ok: true }
  | { ok: false; reason: "rate_limited" | "captcha_invalid" | "other" };

export async function fetchCaptcha(): Promise<CaptchaChallenge | null> {
  try {
    const res = await fetch("/api/captcha");
    if (!res.ok) return null;
    return (await res.json()) as CaptchaChallenge;
  } catch {
    return null;
  }
}

export async function submitAppFeedback(
  details: string,
  captchaToken: string,
  captchaAnswer: number,
): Promise<AppFeedbackResult> {
  try {
    const res = await fetch("/api/app-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ details, captchaToken, captchaAnswer }),
    });
    if (res.ok) return { ok: true };
    if (res.status === 429 || res.status === 403) return { ok: false, reason: "rate_limited" };
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    if (body?.error === "invalid_captcha") return { ok: false, reason: "captcha_invalid" };
    return { ok: false, reason: "other" };
  } catch {
    return { ok: false, reason: "other" };
  }
}
