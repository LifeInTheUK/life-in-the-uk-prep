"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { postHistory, fetchHistoryFromServer, type TestResult } from "./history";

const MAX_ENTRIES = 50;

interface HistoryValue {
  history: TestResult[];
  recordResult: (score: number, total: number) => void;
  refreshFromServer: () => Promise<void>;
  reset: () => void;
}

const HistoryContext = createContext<HistoryValue | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<TestResult[]>([]);

  const value: HistoryValue = {
    history,
    recordResult: (score, total) => {
      const result: TestResult = { timestamp: Date.now(), score, total };
      setHistory((prev) => [...prev, result].slice(-MAX_ENTRIES));
      postHistory(result);
    },
    refreshFromServer: async () => {
      const serverHistory = await fetchHistoryFromServer();
      setHistory((prev) => {
        const merged = [...prev, ...serverHistory]
          .filter(
            (entry, index, all) =>
              all.findIndex((e) => e.timestamp === entry.timestamp) === index,
          )
          .sort((a, b) => a.timestamp - b.timestamp);
        return merged.slice(-MAX_ENTRIES);
      });
    },
    reset: () => setHistory([]),
  };

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistoryState(): HistoryValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistoryState must be used within a HistoryProvider");
  return ctx;
}
