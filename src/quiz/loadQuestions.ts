import type { Question } from "../types";

export async function loadQuestions(): Promise<Question[]> {
  const res = await fetch("/api/questions");
  return res.json();
}
