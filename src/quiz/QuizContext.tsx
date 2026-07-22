"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuizEngine, type QuizEngine } from "./useQuizEngine";
import { canSubmitMulti, isMultiSelect } from "./derived";

const QuizContext = createContext<QuizEngine | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const engine = useQuizEngine();
  const { state, selectOption, submitMulti, next, restart } = engine;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key >= "1" && e.key <= "9") {
        const idx = Number(e.key) - 1;
        if (idx < state.currentDisplayOptions.length) {
          e.preventDefault();
          selectOption(idx);
        }
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        // A focused button already handles Enter/Space natively; only step
        // in when the key press isn't targeting one, to avoid double-firing.
        if (document.activeElement instanceof HTMLButtonElement) return;

        if (state.phase === "active" && state.answered) {
          e.preventDefault();
          next();
        } else if (state.phase === "results") {
          e.preventDefault();
          restart();
        } else if (isMultiSelect(state) && canSubmitMulti(state)) {
          e.preventDefault();
          submitMulti();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [state, selectOption, submitMulti, next, restart]);

  return <QuizContext.Provider value={engine}>{children}</QuizContext.Provider>;
}

export function useQuiz(): QuizEngine {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within a QuizProvider");
  return ctx;
}
