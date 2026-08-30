import { useEffect, useReducer, useRef } from "react";
import type { Question, SessionQuestion } from "../types";
import type { SM2Data } from "../types";
import { calculateSM2 } from "../sm2";
import {
  SESSION_SIZE,
  SESSION_NEW_RATIO,
  SESSION_IMPROVE_RATIO,
  SESSION_TIME_LIMIT_MS,
  CHAPTER_QUOTA_RATIOS,
} from "../config";
import { TOPIC_ORDER } from "../topics";
import { initialQuizState, quizReducer } from "./reducer";
import type { QuizState } from "./types";
import { loadQuestions } from "./loadQuestions";
import { useHeaderStats } from "../headerStats";
import { useProgress } from "../progressContext";
import { useHistoryState } from "../historyContext";

// Persists the in-progress session (queue, current question, score, answered
// state) across a full page reload — a reload previously always built a
// fresh randomized queue via buildSessionQueue(), changing the question the
// user was looking at. sessionStorage (not localStorage) matches the app's
// existing tab-scoped-only semantics for anonymous session data — it survives
// a reload but not a closed tab, and never leaks a stale session into a new
// tab.
const SESSION_STORAGE_KEY = "quizActiveSession";

// Answer index/explanation are stripped before writing to sessionStorage —
// both are plaintext-readable via devtools while a question is still
// unanswered, which would let a user look up the correct answer before
// picking one. Every other field (question text, options, sm2/accuracy
// snapshot) is harmless to store since it doesn't reveal correctness.
// restore() re-fetches the live bank to put `a`/`ex` back into memory (never
// into storage) before dispatching SESSION_RESTORED, so the app functions
// exactly as before restoring — OptionsList still needs `question.a` at
// render time (to detect multi-select and to reveal the correct answer once
// answered), just never sourced from the persisted snapshot.
type StorableSessionQuestion = Omit<SessionQuestion, "a" | "ex">;
type StorableQuizState = Omit<QuizState, "sessionQueue" | "currentQuestion"> & {
  sessionQueue: StorableSessionQuestion[];
  currentQuestion: StorableSessionQuestion | null;
};

function stripAnswer(q: SessionQuestion): StorableSessionQuestion {
  const { a: _a, ex: _ex, ...rest } = q;
  return rest;
}

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

// Draw from three buckets within a pool — new / answered-wrong-before /
// always-correct-so-far — at a fixed ratio, with a shortfall fill (new ->
// improve -> correct) for when a bucket runs dry. Appends picks straight into
// `selected` and records their ids in the shared `usedIds` set so a question
// already picked for one chapter can never be picked again for another.
function selectForPool(
  pool: SessionQuestion[],
  quota: number,
  usedIds: Set<number>,
  selected: SessionQuestion[],
): void {
  const newQ = pool.filter((q) => q.sm2.attempts === 0).sort(byDueThenWeakest);
  const improveQ = pool
    .filter((q) => q.sm2.attempts > 0 && q.sm2.correct < q.sm2.attempts)
    .sort(byDueThenWeakest);
  const correctQ = pool
    .filter((q) => q.sm2.attempts > 0 && q.sm2.correct === q.sm2.attempts)
    .sort(byDueThenWeakest);

  const newCount = Math.round(quota * SESSION_NEW_RATIO);
  const improveCount = Math.round(quota * SESSION_IMPROVE_RATIO);
  const correctCount = quota - newCount - improveCount;

  const startLength = selected.length;
  function take(source: SessionQuestion[], count: number): void {
    for (const q of source) {
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

  let shortfall = quota - (selected.length - startLength);
  if (shortfall > 0) take(newQ, shortfall);
  shortfall = quota - (selected.length - startLength);
  if (shortfall > 0) take(improveQ, shortfall);
  shortfall = quota - (selected.length - startLength);
  if (shortfall > 0) take(correctQ, shortfall);
}

// Sorting the whole bank by "overdue first" alone means unseen questions
// (sm2.next === 0, always the smallest timestamp) come before every
// previously-missed question, so review never surfaces until the entire bank
// has been seen once — selectForPool() above handles that per chapter.
//
// On top of that, the real Life in the UK test draws a fixed number of
// questions from each of 5 official chapters (History and Government most
// heavily weighted) rather than treating the bank as one undifferentiated
// pool — see CHAPTER_QUOTA_RATIOS in src/config.ts. Each chapter runs its own
// new/improve/correct selection scaled to its quota, sharing one usedIds set
// so the same question is never double-picked across chapters.
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

  // Partition by chapter; questions with no topic (or a topic outside the 5
  // known chapters) are dropped from every chapter's pool — there's no 6th
  // catch-all chapter to fold them into.
  const byChapter = new Map<string, SessionQuestion[]>();
  for (const topic of TOPIC_ORDER) byChapter.set(topic, []);
  for (const q of allWithSM2) {
    const pool = q.topic ? byChapter.get(q.topic) : undefined;
    if (pool) pool.push(q);
  }

  // Quotas are ratios of SESSION_SIZE (not fixed counts) so a dev/e2e
  // override like NEXT_PUBLIC_SESSION_SIZE=3 still scales sanely instead of
  // demanding a full 24-question split. "history" absorbs the rounding
  // remainder, same pattern SESSION_CORRECT_RATIO's siblings already use.
  const quotas: Record<string, number> = {};
  let allocated = 0;
  for (const topic of TOPIC_ORDER) {
    if (topic === "history") continue;
    const quota = Math.round(SESSION_SIZE * (CHAPTER_QUOTA_RATIOS[topic] ?? 0));
    quotas[topic] = quota;
    allocated += quota;
  }
  quotas["history"] = Math.max(0, SESSION_SIZE - allocated);

  const selected: SessionQuestion[] = [];
  const usedIds = new Set<number>();
  for (const topic of TOPIC_ORDER) {
    selectForPool(byChapter.get(topic) ?? [], quotas[topic] ?? 0, usedIds, selected);
  }

  // Cross-chapter shortfall — only reachable in extreme edge cases (a
  // chapter's own new/improve/correct pools all ran dry). Backfill from
  // whatever's left in the whole bank, regardless of chapter, so the total
  // never falls short of SESSION_SIZE.
  if (selected.length < SESSION_SIZE) {
    const remaining = allWithSM2
      .filter((q) => !usedIds.has(q.id))
      .sort(byDueThenWeakest);
    for (const q of remaining) {
      if (selected.length >= SESSION_SIZE) break;
      selected.push(q);
      usedIds.add(q.id);
    }
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
  const { setTotalQuestions, setScore, setSessionTimer } = useHeaderStats();
  const { getSM2, recordAnswer } = useProgress();
  const { recordResult } = useHistoryState();

  // useQuizEngine lives above the /test route (mounted once in app/layout.tsx)
  // so its state survives navigating away and back. This guard makes start()
  // idempotent — called from QuizPage's mount effect, it must only actually
  // build a session the first time, both to avoid clobbering an in-progress
  // session on remount and to survive React Strict Mode's double-invoke.
  const startedRef = useRef(false);

  // Snapshot the active session to sessionStorage on every change (skipped
  // while phase is "loading" — the pre-start() placeholder state — so a
  // restore attempt in start() never reads back that placeholder).
  useEffect(() => {
    if (state.phase === "loading") return;
    const storable: StorableQuizState = {
      ...state,
      sessionQueue: state.sessionQueue.map(stripAnswer),
      currentQuestion: state.currentQuestion ? stripAnswer(state.currentQuestion) : null,
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(storable));
  }, [state]);

  // Auto-finishes the session once the 45-minute limit elapses. Wall-clock
  // based (Date.now() - startedAt) rather than a decrementing counter, so a
  // throttled background tab self-corrects instead of drifting — it may fire
  // up to ~60s late while backgrounded, never early. Depends only on
  // phase/startedAt (not full state) so it isn't torn down on every answer.
  useEffect(() => {
    if (state.phase !== "active" || state.startedAt === null) return;
    const startedAt = state.startedAt;
    const id = setInterval(() => {
      if (Date.now() - startedAt >= SESSION_TIME_LIMIT_MS) {
        dispatch({ type: "TIME_EXPIRED" });
        setSessionTimer(null, 0);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [state.phase, state.startedAt]);

  async function start(): Promise<void> {
    if (startedRef.current) return;
    startedRef.current = true;

    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const storable = JSON.parse(stored) as StorableQuizState;
      const qs = await loadQuestions();
      const byId = new Map(qs.map((q) => [q.id, q]));

      function rehydrate(sq: StorableSessionQuestion): SessionQuestion | null {
        const full = byId.get(sq.id);
        if (!full) return null; // question removed from the bank since this session started
        return { ...sq, a: full.a, ex: full.ex };
      }

      const sessionQueue = storable.sessionQueue
        .map(rehydrate)
        .filter((q): q is SessionQuestion => q !== null);
      const currentQuestion = storable.currentQuestion
        ? rehydrate(storable.currentQuestion)
        : null;

      // Only trust the restored snapshot if every question it needs still
      // resolves — a null currentQuestion while phase is "active" means the
      // bank changed underneath it, so fall through to a fresh session
      // instead of restoring broken state.
      if (storable.phase === "results" || currentQuestion !== null) {
        dispatch({
          type: "SESSION_RESTORED",
          snapshot: { ...storable, sessionQueue, currentQuestion },
        });
        setTotalQuestions(storable.totalQuestionCount);
        setScore(storable.firstTryScore, storable.initialQuestionsCount, false);
        setSessionTimer(
          storable.phase === "active" ? storable.startedAt : null,
          SESSION_TIME_LIMIT_MS,
        );
        return;
      }
    }

    const qs = await loadQuestions();
    dispatch({ type: "QUESTIONS_LOADED", total: qs.length });
    setTotalQuestions(qs.length);

    const queue = buildSessionQueue(qs, getSM2);
    const startedAt = Date.now();
    dispatch({ type: "SESSION_STARTED", queue, startedAt });
    setScore(0, queue.length, false);
    setSessionTimer(startedAt, SESSION_TIME_LIMIT_MS);
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
      setSessionTimer(null, 0);
    }
    dispatch({ type: "NEXT_REQUESTED" });
  }

  async function restart(): Promise<void> {
    const qs = await loadQuestions();
    dispatch({ type: "QUESTIONS_LOADED", total: qs.length });
    setTotalQuestions(qs.length);

    const queue = buildSessionQueue(qs, getSM2);
    const startedAt = Date.now();
    dispatch({ type: "SESSION_STARTED", queue, startedAt });
    setScore(0, queue.length, false);
    setSessionTimer(startedAt, SESSION_TIME_LIMIT_MS);
  }

  return { state, start, selectOption, submitMulti, next, restart };
}
