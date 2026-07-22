"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { initQuiz } from "./quiz";

export default function QuizPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initQuiz().then(() => setLoading(false));
  }, []);

  return (
    <div className="order-2 sm:order-3 flex flex-col sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
      {loading && (
        <p className="order-1 text-sm text-muted py-8 text-center">
          Loading questions...
        </p>
      )}
      <div id="quiz-container" className="order-1 fade-in">
        {/* Question rendered here */}
      </div>

      <div id="navigation" className="order-2 sm:order-3 mt-6 flex justify-end">
        <Link
          id="home-btn"
          href="/"
          className="hidden mr-2 w-full sm:w-auto bg-surface border border-line hover:border-accent hover:text-accent active:scale-[0.98] text-ink font-medium text-sm py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          Go Home
        </Link>
        <button
          id="next-btn"
          className="hidden w-full sm:w-auto bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          Next Question
          <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 h-5 text-[11px] font-mono rounded border border-white/30 bg-white/10">
            ↵
          </kbd>
        </button>
        <button
          id="restart-btn"
          className="hidden w-full sm:w-auto bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-medium text-sm py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          Start Again
          <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 h-5 text-[11px] font-mono rounded border border-white/30 bg-white/10">
            ↵
          </kbd>
        </button>
      </div>

      <div
        id="feedback-container"
        className="hidden order-3 sm:order-2 mt-5 pt-5 border-t border-line"
        role="status"
        aria-live="polite"
      >
        {/* Feedback rendered here */}
      </div>
    </div>
  );
}
