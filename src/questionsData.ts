import { unstable_cache } from "next/cache";
import { sql } from "./db";
import type { Question } from "./types";

export const getAllQuestions = unstable_cache(
  async (): Promise<Question[]> => {
    const rows = await sql`
      SELECT id, question, options, answer, explanation, topic
      FROM questions
      ORDER BY id
    `;
    return rows.map((row) => ({
      id: row.id,
      q: row.question,
      o: row.options,
      a: row.answer,
      ex: row.explanation,
      topic: row.topic ?? undefined,
    }));
  },
  ["questions-all"],
  { revalidate: false },
);
