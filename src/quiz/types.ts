import type { SessionQuestion } from "../types";

export type QuizPhase = "loading" | "active" | "results";

export interface LastResult {
  isCorrect: boolean;
  selectedOriginal: number | number[];
  correctRenderedIdx: number | null; // null for multi-select
  explanation: string;
  historicalAccuracyPct: number;
  questionId: number;
}

export interface QuizState {
  phase: QuizPhase;
  totalQuestionCount: number;
  sessionQueue: SessionQuestion[]; // shifts immediately on answer — see currentQuestion
  currentQuestion: SessionQuestion | null; // frozen displayed question until NEXT_REQUESTED
  initialQuestionsCount: number;
  firstTryScore: number;
  selectedOptions: number[];
  currentDisplayOptions: { text: string; originalIndex: number }[];
  answered: boolean;
  lastResult: LastResult | null;
  startedAt: number | null;
  endReason: "completed" | "timeout";
}

export type QuizAction =
  | { type: "QUESTIONS_LOADED"; total: number }
  | { type: "SESSION_STARTED"; queue: SessionQuestion[]; startedAt: number }
  | { type: "OPTION_TOGGLED"; idx: number }
  | {
      type: "ANSWER_SUBMITTED";
      payload: LastResult & {
        updatedQueue: SessionQuestion[];
        newFirstTryScore: number;
      };
    }
  | { type: "NEXT_REQUESTED" }
  | { type: "SESSION_RESTORED"; snapshot: QuizState }
  | { type: "TIME_EXPIRED" };
