"use client";

import { useEffect, useState } from "react";
import { submitFeedback, type FeedbackCategory } from "../feedback";

const REPORT_CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: "typo", label: "Typo / spelling" },
  { value: "wrong_info", label: "Wrong or outdated info" },
  { value: "confusing", label: "Confusing wording" },
  { value: "duplicate", label: "Duplicate question" },
];

export default function ReportModal({
  questionId,
  onSubmitted,
  onClose,
}: {
  questionId: number;
  onSubmitted: () => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<FeedbackCategory | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [ok, setOk] = useState(true);

  useEffect(() => {
    if (status !== "done") return;
    const timer = setTimeout(onClose, 1200);
    return () => clearTimeout(timer);
  }, [status, onClose]);

  async function submit(): Promise<void> {
    if (!selected) return;
    setStatus("submitting");
    const result = await submitFeedback(questionId, selected);
    if (result) {
      onSubmitted();
    }
    setOk(result);
    setStatus("done");
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
          <h3 className="text-sm font-semibold">
            {status === "done" ? (ok ? "Thanks — reported" : "Something went wrong, try again later") : "Report a problem"}
          </h3>
          <button type="button" aria-label="Close" className="text-muted hover:text-ink" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {status !== "done" && (
          <>
            <div className="space-y-2 mb-4">
              {REPORT_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={
                    "w-full text-left text-sm p-3 border-2 rounded-lg transition-colors " +
                    (selected === c.value
                      ? "border-accent bg-accent text-white font-semibold"
                      : "border-line hover:border-accent")
                  }
                  onClick={() => setSelected(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!selected || status === "submitting"}
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
