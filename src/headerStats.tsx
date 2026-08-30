"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface HeaderStatsValue {
  totalQuestions: number;
  scoreCurrent: number;
  scoreTotal: number;
  animateScore: boolean;
  sessionStartedAt: number | null;
  sessionTimeLimitMs: number;
  setTotalQuestions: (n: number) => void;
  setScore: (current: number, total: number, animate: boolean) => void;
  setSessionTimer: (startedAt: number | null, limitMs: number) => void;
}

const HeaderStatsContext = createContext<HeaderStatsValue | null>(null);

export function HeaderStatsProvider({ children }: { children: ReactNode }) {
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [score, setScoreState] = useState({ current: 0, total: 0, animate: false });
  const [timer, setTimerState] = useState<{ startedAt: number | null; limitMs: number }>({
    startedAt: null,
    limitMs: 0,
  });

  const value: HeaderStatsValue = {
    totalQuestions,
    scoreCurrent: score.current,
    scoreTotal: score.total,
    animateScore: score.animate,
    sessionStartedAt: timer.startedAt,
    sessionTimeLimitMs: timer.limitMs,
    setTotalQuestions,
    setScore: (current, total, animate) => setScoreState({ current, total, animate }),
    setSessionTimer: (startedAt, limitMs) => setTimerState({ startedAt, limitMs }),
  };

  return <HeaderStatsContext.Provider value={value}>{children}</HeaderStatsContext.Provider>;
}

export function useHeaderStats(): HeaderStatsValue {
  const ctx = useContext(HeaderStatsContext);
  if (!ctx) throw new Error("useHeaderStats must be used within a HeaderStatsProvider");
  return ctx;
}
