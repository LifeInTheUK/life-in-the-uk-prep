import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/src/db";
import type { SM2Data } from "@/src/types";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT question_id, n, ef, i, next, attempts, correct, last_correct, last_selected
    FROM progress
    WHERE user_id = ${session.user.id}
  `;

  const data: Record<number, SM2Data> = {};
  for (const row of rows) {
    data[row.question_id] = {
      n: row.n,
      ef: row.ef,
      i: row.i,
      next: Number(row.next),
      attempts: row.attempts,
      correct: row.correct,
      lastCorrect: row.last_correct ?? undefined,
      lastSelected: row.last_selected ?? undefined,
    };
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, sm2Data } = (await request.json()) as {
    id: number;
    sm2Data: SM2Data;
  };

  await sql`
    INSERT INTO progress (user_id, question_id, n, ef, i, next, attempts, correct, last_correct, last_selected)
    VALUES (
      ${session.user.id}, ${id}, ${sm2Data.n}, ${sm2Data.ef}, ${sm2Data.i}, ${sm2Data.next},
      1, ${sm2Data.lastCorrect ? 1 : 0}, ${sm2Data.lastCorrect ?? null},
      ${sm2Data.lastSelected !== undefined ? JSON.stringify(sm2Data.lastSelected) : null}
    )
    ON CONFLICT (user_id, question_id) DO UPDATE SET
      n = EXCLUDED.n, ef = EXCLUDED.ef, i = EXCLUDED.i, next = EXCLUDED.next,
      attempts = progress.attempts + 1,
      correct = progress.correct + CASE WHEN EXCLUDED.last_correct THEN 1 ELSE 0 END,
      last_correct = EXCLUDED.last_correct, last_selected = EXCLUDED.last_selected
  `;

  return NextResponse.json({ ok: true });
}
