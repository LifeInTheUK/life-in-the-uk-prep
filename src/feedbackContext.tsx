"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { getReported, markReported, clearReported } from "./feedback";

interface FeedbackValue {
  hasReported: (id: number) => boolean;
  markReported: (id: number) => void;
  reset: () => void;
}

const FeedbackContext = createContext<FeedbackValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [reportedIds, setReportedIds] = useState<Set<number>>(() =>
    typeof window === "undefined" ? new Set() : new Set(getReported()),
  );

  const value: FeedbackValue = {
    hasReported: (id) => reportedIds.has(id),
    markReported: (id) => {
      markReported(id);
      setReportedIds((prev) => new Set(prev).add(id));
    },
    reset: () => {
      clearReported();
      setReportedIds(new Set());
    },
  };

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedbackState(): FeedbackValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedbackState must be used within a FeedbackProvider");
  return ctx;
}
