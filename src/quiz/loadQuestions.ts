import type { Question } from "../types";

let questions: Question[] = [];

export async function loadQuestions(): Promise<Question[]> {
  if (questions.length > 0) return questions;
  const res = await fetch("/api/questions");
  questions = await res.json();
  return questions;
}
