"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { SM2Data } from "./types";
import { postProgress, fetchProgressFromServer } from "./sm2";

const DEFAULT_SM2: SM2Data = { n: 0, ef: 2.5, i: 0, next: 0, attempts: 0, correct: 0 };

interface Aggregate {
  attempts: number;
  correct: number;
}

function computeAggregate(data: Record<number, SM2Data>): Aggregate {
  let attempts = 0;
  let correct = 0;
  for (const key in data) {
    attempts += data[key].attempts || 0;
    correct += data[key].correct || 0;
  }
  return { attempts, correct };
}

interface ProgressValue {
  aggregate: Aggregate;
  getSM2: (id: number) => SM2Data;
  recordAnswer: (id: number, sm2Data: SM2Data) => void;
  refreshFromServer: () => Promise<void>;
  reset: () => void;
}

const ProgressContext = createContext<ProgressValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Record<number, SM2Data>>({});
  const aggregate = computeAggregate(data);

  const value: ProgressValue = {
    aggregate,
    getSM2: (id) => (data[id] ? { ...data[id] } : { ...DEFAULT_SM2 }),
    recordAnswer: (id, sm2Data) => {
      setData((prev) => ({ ...prev, [id]: sm2Data }));
      postProgress(id, sm2Data);
    },
    refreshFromServer: async () => {
      const serverData = await fetchProgressFromServer();
      setData((prev) => ({ ...prev, ...serverData }));
    },
    reset: () => {
      setData({});
    },
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}
