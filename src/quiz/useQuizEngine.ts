import { useEffect, useReducer } from "react";
import type { Question, SessionQuestion } from "../types";
import { getSM2, saveSM2, updateGlobalAccuracy, calculateSM2 } from "../sm2";
import { addResult } from "../history";
import { SESSION_SIZE } from "../config";
import { initialQuizState, quizReducer } from "./reducer";
import { clearSession, loadStoredSession, saveSession } from "./session";
import { loadQuestions } from "./loadQuestions";
import { useHeaderStats } from "../headerStats";

function isMultiQuestion(q: SessionQuestion): boolean {
  return Array.isArray(q.a);
}

function buildSessionQueue(questions: Question[]): SessionQuestion[] {
  const allWithSM2: SessionQuestion[] = questions.map((q) => {
    const sm2Data = getSM2(q.id);
    const accuracy = sm2Data.attempts > 0 ? sm2Data.correct / sm2Data.attempts : 0;
    return { ...q, sm2: sm2Data, accuracy, isFirstTry: true };
  });

  // Shuffle first so equal-priority questions (e.g. all unseen) come out in
  // random order instead of array order.
  for (let i = allWithSM2.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allWithSM2[i], allWithSM2[j]] = [allWithSM2[j], allWithSM2[i]];
  }

  allWithSM2.sort((a, b) => {
    if (a.sm2.next !== b.sm2.next) return a.sm2.next - b.sm2.next; // overdue first
    return a.accuracy - b.accuracy; // lowest accuracy first
  });

  return allWithSM2.slice(0, SESSION_SIZE);
}

export interface QuizEngine {
  state: ReturnType<typeof quizReducer>;
  selectOption: (renderedIdx: number) => void;
  submitMulti: () => void;
  next: () => void;
  restart: () => Promise<void>;
}

export function useQuizEngine(): QuizEngine {
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);
  const { setTotalQuestions, setScore } = useHeaderStats();

  useEffect(() => {
    let ignore = false;

    (async () => {
      const qs = await loadQuestions();
      if (ignore) return;

      dispatch({ type: "QUESTIONS_LOADED", total: qs.length });
      setTotalQuestions(qs.length);

      const restored = loadStoredSession();
      if (restored) {
        dispatch({
          type: "SESSION_RESTORED",
          queue: restored.sessionQueue,
          firstTryScore: restored.firstTryScore,
          initialQuestionsCount: restored.initialQuestionsCount,
        });
        setScore(restored.firstTryScore, restored.initialQuestionsCount, false);
      } else {
        const queue = buildSessionQueue(qs);
        saveSession({ sessionQueue: queue, firstTryScore: 0, initialQuestionsCount: queue.length });
        dispatch({ type: "SESSION_STARTED", queue });
        setScore(0, queue.length, false);
      }
      updateGlobalAccuracy();
    })();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    saveSM2(q.id, {
      ...nextSm2,
      attempts: qStats.attempts,
      correct: qStats.correct,
      lastCorrect: isCorrect,
      lastSelected: selected,
    });

    const updatedQueue = state.sessionQueue.slice(1);
    const newFirstTryScore =
      isCorrect && q.isFirstTry ? state.firstTryScore + 1 : state.firstTryScore;
    saveSession({
      sessionQueue: updatedQueue,
      firstTryScore: newFirstTryScore,
      initialQuestionsCount: state.initialQuestionsCount,
    });

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
      clearSession();
      addResult(state.firstTryScore, state.initialQuestionsCount);
    }
    dispatch({ type: "NEXT_REQUESTED" });
  }

  async function restart(): Promise<void> {
    const qs = await loadQuestions(); // already cached by mount effect
    const queue = buildSessionQueue(qs);
    saveSession({ sessionQueue: queue, firstTryScore: 0, initialQuestionsCount: queue.length });
    dispatch({ type: "SESSION_STARTED", queue });
    setScore(0, queue.length, false);
    updateGlobalAccuracy();
  }

  return { state, selectOption, submitMulti, next, restart };
}
