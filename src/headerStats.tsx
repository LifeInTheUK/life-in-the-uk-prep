"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface HeaderStatsValue {
  totalQuestions: number;
  scoreCurrent: number;
  scoreTotal: number;
  animateScore: boolean;
  setTotalQuestions: (n: number) => void;
  setScore: (current: number, total: number, animate: boolean) => void;
}

const HeaderStatsContext = createContext<HeaderStatsValue | null>(null);

export function HeaderStatsProvider({ children }: { children: ReactNode }) {
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [score, setScoreState] = useState({ current: 0, total: 0, animate: false });

  const value: HeaderStatsValue = {
    totalQuestions,
    scoreCurrent: score.current,
    scoreTotal: score.total,
    animateScore: score.animate,
    setTotalQuestions,
    setScore: (current, total, animate) => setScoreState({ current, total, animate }),
  };

  return <HeaderStatsContext.Provider value={value}>{children}</HeaderStatsContext.Provider>;
}

export function useHeaderStats(): HeaderStatsValue {
  const ctx = useContext(HeaderStatsContext);
  if (!ctx) throw new Error("useHeaderStats must be used within a HeaderStatsProvider");
  return ctx;
}
