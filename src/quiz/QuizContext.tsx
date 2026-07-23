"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuizEngine, type QuizEngine } from "./useQuizEngine";

const QuizContext = createContext<QuizEngine | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const engine = useQuizEngine();
  return <QuizContext.Provider value={engine}>{children}</QuizContext.Provider>;
}

export function useQuiz(): QuizEngine {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within a QuizProvider");
  return ctx;
}
