"use client";

import { useEffect, useState } from "react";
import { fetchCaptcha, submitAppFeedback, type CaptchaChallenge } from "./appFeedback";

const MAX_DETAILS_LENGTH = 200;

export default function AppFeedbackModal({ onClose }: { onClose: () => void }) {
  const [details, setDetails] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [ok, setOk] = useState(true);
  const [reason, setReason] = useState<"rate_limited" | "captcha_invalid" | "other">("other");

  async function loadCaptcha() {
    setCaptcha(null);
    setAnswer("");
    const challenge = await fetchCaptcha();
    setCaptcha(challenge);
  }

  useEffect(() => {
    loadCaptcha();
  }, []);

  useEffect(() => {
    if (status !== "done") return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [status, onClose]);

  const trimmedDetails = details.trim();
  const canSubmit =
    trimmedDetails.length > 0 && captcha !== null && answer.trim().length > 0 && status !== "submitting";

  async function submit(): Promise<void> {
    if (!canSubmit || !captcha) return;
    setStatus("submitting");
    const result = await submitAppFeedback(trimmedDetails, captcha.token, Number(answer));
    if (result.ok) {
      setOk(true);
    } else {
      setOk(false);
      setReason(result.reason);
    }
    setStatus("done");
  }

  function statusTitle(): string {
    if (status !== "done") return "Send feedback";
    if (ok) return "Thanks — feedback sent";
    if (reason === "rate_limited") return "Too many submissions — try again later";
    if (reason === "captcha_invalid") return "Wrong answer — try the new question below";
    return "Something went wrong, try again later";
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface border border-line rounded-xl p-5 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">{statusTitle()}</h3>
          <button type="button" aria-label="Close" className="text-muted hover:text-ink" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {status !== "done" && (
          <>
            <div className="mb-4">
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={MAX_DETAILS_LENGTH}
                rows={3}
                placeholder="What's on your mind?"
                className="w-full text-sm bg-bg border border-line rounded-lg p-3 focus:outline-none focus:border-accent transition-colors resize-none"
              />
              <p className="text-[11px] text-muted text-right mt-1 tabular">
                {details.length}/{MAX_DETAILS_LENGTH}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-muted mb-1">
                {captcha ? `What is ${captcha.question}?` : "Loading..."}
              </label>
              <input
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={!captcha}
                className="w-full text-sm bg-bg border border-line rounded-lg p-3 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <button
              type="button"
              disabled={!canSubmit}
              className="w-full bg-accent hover:bg-accent-dark text-white font-medium text-sm py-2.5 px-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              onClick={submit}
            >
              Submit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
