"use client";

import { useState } from "react";
import type { LastResult } from "./types";
import { hasReported } from "../feedback";
import ReportModal from "./ReportModal";

export default function FeedbackPanel({ lastResult }: { lastResult: LastResult }) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(() => hasReported(lastResult.questionId));

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-2">
        <span
          className={
            "pop-in inline-flex items-center gap-1.5 text-sm font-semibold " +
            (lastResult.isCorrect ? "text-good" : "text-bad")
          }
        >
          {lastResult.isCorrect ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {lastResult.isCorrect ? "Correct" : "Incorrect"}
        </span>
        <span className="flex items-center gap-2 text-xs text-muted tabular">
          {lastResult.historicalAccuracyPct}% historical
          {!reported && !reportOpen && (
            <button
              type="button"
              aria-label="Report an issue with this question"
              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-muted hover:text-bad hover:bg-bad-soft transition-colors"
              onClick={() => setReportOpen(true)}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18M3 4h13l-2 4 2 4H3" />
              </svg>
            </button>
          )}
        </span>
      </div>
      <p className="text-sm text-muted leading-relaxed">{lastResult.explanation}</p>
      {reportOpen && (
        <ReportModal
          questionId={lastResult.questionId}
          onSubmitted={() => setReported(true)}
          onClose={() => setReportOpen(false)}
        />
      )}
    </>
  );
}
