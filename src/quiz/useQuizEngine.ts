import { useReducer, useRef } from "react";
import type { Question, SessionQuestion } from "../types";
import type { SM2Data } from "../types";
import { calculateSM2 } from "../sm2";
import {
  SESSION_SIZE,
  SESSION_NEW_RATIO,
  SESSION_IMPROVE_RATIO,
} from "../config";
import { initialQuizState, quizReducer } from "./reducer";
import { loadQuestions } from "./loadQuestions";
import { useHeaderStats } from "../headerStats";
import { useProgress } from "../progressContext";
import { useHistoryState } from "../historyContext";

function isMultiQuestion(q: SessionQuestion): boolean {
  return Array.isArray(q.a);
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function byDueThenWeakest(a: SessionQuestion, b: SessionQuestion): number {
  if (a.sm2.next !== b.sm2.next) return a.sm2.next - b.sm2.next; // overdue first
  return a.accuracy - b.accuracy; // lowest accuracy first
}

// Sorting the whole bank by "overdue first" alone means unseen questions
// (sm2.next === 0, always the smallest timestamp) come before every
// previously-missed question, so review never surfaces until the entire bank
// has been seen once. Instead, draw from three buckets every session — new /
// answered-wrong-before / always-correct-so-far — at a fixed ratio, with a
// shortfall fill (new -> improve -> correct) for when a bucket runs dry.
function buildSessionQueue(
  questions: Question[],
  getSM2: (id: number) => SM2Data,
): SessionQuestion[] {
  const allWithSM2: SessionQuestion[] = questions.map((q) => {
    const sm2Data = getSM2(q.id);
    const accuracy = sm2Data.attempts > 0 ? sm2Data.correct / sm2Data.attempts : 0;
    return { ...q, sm2: sm2Data, accuracy, isFirstTry: true };
  });

  // Shuffle first so equal-priority questions (e.g. all unseen) come out in
  // random order instead of array order.
  shuffle(allWithSM2);

  const newQ = allWithSM2.filter((q) => q.sm2.attempts === 0).sort(byDueThenWeakest);
  const improveQ = allWithSM2
    .filter((q) => q.sm2.attempts > 0 && q.sm2.correct < q.sm2.attempts)
    .sort(byDueThenWeakest);
  const correctQ = allWithSM2
    .filter((q) => q.sm2.attempts > 0 && q.sm2.correct === q.sm2.attempts)
    .sort(byDueThenWeakest);

  const newCount = Math.round(SESSION_SIZE * SESSION_NEW_RATIO);
  const improveCount = Math.round(SESSION_SIZE * SESSION_IMPROVE_RATIO);
  const correctCount = SESSION_SIZE - newCount - improveCount;

  const selected: SessionQuestion[] = [];
  const usedIds = new Set<number>();
  function take(pool: SessionQuestion[], count: number): void {
    for (const q of pool) {
      if (count <= 0) break;
      if (usedIds.has(q.id)) continue;
      selected.push(q);
      usedIds.add(q.id);
      count--;
    }
  }

  take(newQ, newCount);
  take(improveQ, improveCount);
  take(correctQ, correctCount);

  if (selected.length < SESSION_SIZE) {
    const shortfall = SESSION_SIZE - selected.length;
    take(newQ, shortfall);
  }
  if (selected.length < SESSION_SIZE) {
    take(improveQ, SESSION_SIZE - selected.length);
  }
  if (selected.length < SESSION_SIZE) {
    take(correctQ, SESSION_SIZE - selected.length);
  }

  return shuffle(selected);
}

export interface QuizEngine {
  state: ReturnType<typeof quizReducer>;
  start: () => Promise<void>;
  selectOption: (renderedIdx: number) => void;
  submitMulti: () => void;
  next: () => void;
  restart: () => Promise<void>;
}

export function useQuizEngine(): QuizEngine {
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);
  const { setTotalQuestions, setScore } = useHeaderStats();
  const { getSM2, recordAnswer } = useProgress();
  const { recordResult } = useHistoryState();

  // useQuizEngine lives above the /test route (mounted once in app/layout.tsx)
  // so its state survives navigating away and back. This guard makes start()
  // idempotent — called from QuizPage's mount effect, it must only actually
  // build a session the first time, both to avoid clobbering an in-progress
  // session on remount and to survive React Strict Mode's double-invoke.
  const startedRef = useRef(false);

  async function start(): Promise<void> {
    if (startedRef.current) return;
    startedRef.current = true;

    const qs = await loadQuestions();
    dispatch({ type: "QUESTIONS_LOADED", total: qs.length });
    setTotalQuestions(qs.length);

    const queue = buildSessionQueue(qs, getSM2);
    dispatch({ type: "SESSION_STARTED", queue });
    setScore(0, queue.length, false);
  }

  function submitAnswer(selected: number | number[]): void {
    const q = state.currentQuestion;
    if (!q || state.answered) return;

    const isMulti = isMultiQuestion(q);
    let isCorrect: boolean;
    let correctRenderedIdx: number | null = null;

    if (isMulti) {
      const correctAnswers = [...(q.a as number[])].sort((a, b) => a - b);
      const selectedSorted = [...(selected as number[])].sort((a, b) => a - b);
      isCorrect = JSON.stringify(correctAnswers) === JSON.stringify(selectedSorted);
    } else {
      isCorrect = selected === q.a;
      correctRenderedIdx = state.currentDisplayOptions.findIndex(
        (opt) => opt.originalIndex === q.a,
      );
    }

    // Side effects — synchronous, before dispatch, so StrictMode's reducer
    // double-invoke (which never touches action creators) can't double-write.
    const qStats = getSM2(q.id);
    if (q.isFirstTry) {
      qStats.attempts = (qStats.attempts || 0) + 1;
      if (isCorrect) qStats.correct = (qStats.correct || 0) + 1;
    }
    const nextSm2 = calculateSM2(q.sm2, isCorrect ? 4 : 1);
    recordAnswer(q.id, {
      ...nextSm2,
      attempts: qStats.attempts,
      correct: qStats.correct,
      lastCorrect: isCorrect,
      lastSelected: selected,
    });

    const updatedQueue = state.sessionQueue.slice(1);
    const newFirstTryScore =
      isCorrect && q.isFirstTry ? state.firstTryScore + 1 : state.firstTryScore;

    dispatch({
      type: "ANSWER_SUBMITTED",
      payload: {
        isCorrect,
        selectedOriginal: selected,
        updatedQueue,
        newFirstTryScore,
        correctRenderedIdx,
        explanation: q.ex,
        historicalAccuracyPct: Math.round(
          ((qStats.correct || 0) / (qStats.attempts || 1)) * 100,
        ),
        questionId: q.id,
      },
    });

    if (isCorrect && q.isFirstTry) {
      setScore(newFirstTryScore, state.initialQuestionsCount, true);
    }
  }

  function selectOption(renderedIdx: number): void {
    const q = state.currentQuestion;
    if (!q || state.answered) return;

    if (isMultiQuestion(q)) {
      dispatch({ type: "OPTION_TOGGLED", idx: renderedIdx });
      return;
    }

    const originalIdx = state.currentDisplayOptions[renderedIdx].originalIndex;
    submitAnswer(originalIdx);
  }

  function submitMulti(): void {
    const q = state.currentQuestion;
    if (!q || state.answered) return;
    const selectedOriginals = state.selectedOptions
      .map((i) => state.currentDisplayOptions[i].originalIndex)
      .sort((a, b) => a - b);
    submitAnswer(selectedOriginals);
  }

  function next(): void {
    if (state.sessionQueue.length === 0) {
      recordResult(state.firstTryScore, state.initialQuestionsCount);
    }
    dispatch({ type: "NEXT_REQUESTED" });
  }

  async function restart(): Promise<void> {
    const qs = await loadQuestions();
    const queue = buildSessionQueue(qs, getSM2);
    dispatch({ type: "SESSION_STARTED", queue });
    setScore(0, queue.length, false);
  }

  return { state, start, selectOption, submitMulti, next, restart };
}
