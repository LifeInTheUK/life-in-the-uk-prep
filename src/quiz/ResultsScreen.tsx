"use client";

import { useEffect, useRef } from "react";
import { animateNumber } from "../animateNumber";
import { launchConfetti } from "./confetti";

export default function ResultsScreen({
  firstTryScore,
  initialQuestionsCount,
  timedOut,
}: {
  firstTryScore: number;
  initialQuestionsCount: number;
  timedOut: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);

  const requiredToPass = Math.ceil(initialQuestionsCount * 0.75);
  const passed = firstTryScore >= requiredToPass;
  const scorePct = Math.round((firstTryScore / initialQuestionsCount) * 100);

  useEffect(() => {
    if (scoreRef.current) animateNumber(scoreRef.current, firstTryScore, (v) => String(v), 700);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (passed) launchConfetti(containerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="relative overflow-hidden text-center py-6 fade-in">
      <div
        className={
          "inline-flex items-center justify-center w-14 h-14 rounded-full mb-5 " +
          (passed ? "bg-good-soft text-good" : "bg-bad-soft text-bad")
        }
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {passed ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          )}
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">{passed ? "Test passed" : "Test failed"}</h2>
      {timedOut && (
        <p className="text-xs font-medium text-bad mb-2">
          Time&apos;s up — the 45-minute limit was reached before you finished.
        </p>
      )}
      <p className="text-sm text-muted mb-6">
        {passed
          ? "You met the 75% requirement for the official test."
          : "You need 75% to pass the official test."}
      </p>
      <div className="flex items-center justify-center gap-2 mb-8 tabular">
        <span id="result-score" ref={scoreRef} className="text-4xl font-bold">
          0
        </span>
        <span className="text-xl text-muted">/ {initialQuestionsCount}</span>
        <span className="text-sm text-muted border-l border-line pl-3 ml-1">{scorePct}%</span>
      </div>
      <div className="bg-bg rounded-xl p-4 text-sm text-muted text-left">
        <strong className="text-ink">Progress saved.</strong> Weak points have been logged and will be
        prioritised in your next practice test.
      </div>
    </div>
  );
}
