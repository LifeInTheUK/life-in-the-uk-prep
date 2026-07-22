"use client";

import Link from "next/link";
import { useQuiz } from "./QuizContext";

const ENTER_KBD = (
  <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 h-5 text-[11px] font-mono rounded border border-white/30 bg-white/10">
    ↵
  </kbd>
);

export default function NavigationBar() {
  const { state, next, restart } = useQuiz();
  const showNext = state.phase === "active" && state.answered;
  const showRestartHome = state.phase === "results";

  return (
    <div id="navigation" className="order-2 sm:order-3 mt-6 flex justify-end">
      {showRestartHome && (
        <Link
          id="home-btn"
          href="/"
          className="mr-2 w-full sm:w-auto bg-surface border border-line hover:border-accent hover:text-accent active:scale-[0.98] text-ink font-medium text-sm py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          Go Home
        </Link>
      )}
      {showNext && (
        <button
          id="next-btn"
          className="btn-shine w-full sm:w-auto bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          onClick={next}
        >
          {state.sessionQueue.length === 0 ? "View Results" : "Next Question"} {ENTER_KBD}
        </button>
      )}
      {showRestartHome && (
        <button
          id="restart-btn"
          className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-medium text-sm py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          onClick={restart}
        >
          Start New Test {ENTER_KBD}
        </button>
      )}
    </div>
  );
}
