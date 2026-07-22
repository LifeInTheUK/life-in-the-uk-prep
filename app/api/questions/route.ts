import { NextResponse } from "next/server";
import { sql } from "@/src/db";

export async function GET() {
  const rows = await sql`
    SELECT id, question, options, answer, explanation, topic
    FROM questions
    ORDER BY id
  `;
  const questions = rows.map((row) => ({
    id: row.id,
    q: row.question,
    o: row.options,
    a: row.answer,
    ex: row.explanation,
    topic: row.topic ?? undefined,
  }));
  return NextResponse.json(questions);
}
