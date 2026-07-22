import type { QuizAction, QuizState } from "./types";

function shuffledDisplayOptions(
  options: string[],
): { text: string; originalIndex: number }[] {
  const shuffled = options.map((text, originalIndex) => ({ text, originalIndex }));
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const initialQuizState: QuizState = {
  phase: "loading",
  totalQuestionCount: 0,
  sessionQueue: [],
  currentQuestion: null,
  initialQuestionsCount: 0,
  firstTryScore: 0,
  selectedOptions: [],
  currentDisplayOptions: [],
  answered: false,
  lastResult: null,
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "QUESTIONS_LOADED":
      return { ...state, totalQuestionCount: action.total };

    case "SESSION_STARTED":
      return {
        ...state,
        phase: "active",
        sessionQueue: action.queue,
        currentQuestion: action.queue[0] ?? null,
        initialQuestionsCount: action.queue.length,
        firstTryScore: 0,
        selectedOptions: [],
        answered: false,
        lastResult: null,
        currentDisplayOptions: action.queue[0]
          ? shuffledDisplayOptions(action.queue[0].o)
          : [],
      };

    case "SESSION_RESTORED":
      return {
        ...state,
        phase: "active",
        sessionQueue: action.queue,
        currentQuestion: action.queue[0] ?? null,
        initialQuestionsCount: action.initialQuestionsCount,
        firstTryScore: action.firstTryScore,
        selectedOptions: [],
        answered: false,
        lastResult: null,
        currentDisplayOptions: action.queue[0]
          ? shuffledDisplayOptions(action.queue[0].o)
          : [],
      };

    case "OPTION_TOGGLED": {
      if (state.answered) return state;
      const current = state.currentQuestion;
      if (!current) return state;
      const requiredCount = Array.isArray(current.a) ? current.a.length : 0;
      const idxInArray = state.selectedOptions.indexOf(action.idx);

      if (idxInArray > -1) {
        const selectedOptions = state.selectedOptions.slice();
        selectedOptions.splice(idxInArray, 1);
        return { ...state, selectedOptions };
      }

      if (state.selectedOptions.length < requiredCount) {
        return { ...state, selectedOptions: [...state.selectedOptions, action.idx] };
      }
      return state;
    }

    case "ANSWER_SUBMITTED":
      return {
        ...state,
        answered: true,
        sessionQueue: action.payload.updatedQueue,
        firstTryScore: action.payload.newFirstTryScore,
        lastResult: {
          isCorrect: action.payload.isCorrect,
          selectedOriginal: action.payload.selectedOriginal,
          correctRenderedIdx: action.payload.correctRenderedIdx,
          explanation: action.payload.explanation,
          historicalAccuracyPct: action.payload.historicalAccuracyPct,
          questionId: action.payload.questionId,
        },
      };

    case "NEXT_REQUESTED": {
      if (state.sessionQueue.length === 0) {
        return { ...state, phase: "results" };
      }
      const next = state.sessionQueue[0];
      return {
        ...state,
        currentQuestion: next,
        answered: false,
        selectedOptions: [],
        lastResult: null,
        currentDisplayOptions: shuffledDisplayOptions(next.o),
      };
    }

    default:
      return state;
  }
}
