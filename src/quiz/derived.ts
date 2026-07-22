import type { QuizState } from "./types";

export function isMultiSelect(state: QuizState): boolean {
  return Array.isArray(state.currentQuestion?.a);
}

export function requiredMultiCount(state: QuizState): number {
  const a = state.currentQuestion?.a;
  return Array.isArray(a) ? a.length : 0;
}

export function canSubmitMulti(state: QuizState): boolean {
  return state.selectedOptions.length === requiredMultiCount(state);
}
