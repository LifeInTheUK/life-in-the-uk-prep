import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/src/db";
import type { TestResult } from "@/src/history";

const MAX_ENTRIES = 50;

export async function GET() {
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows, countRows] = await Promise.all([
        sql`
          SELECT score, total, completed_at
          FROM history
          WHERE user_id = ${session.user.id}
          ORDER BY completed_at DESC
          LIMIT ${MAX_ENTRIES}
        `,
        sql`
          SELECT COUNT(*) AS count
          FROM history
          WHERE user_id = ${session.user.id}
        `,
    ]);

    const entries: TestResult[] = rows.map((row) => ({
        timestamp: Number(row.completed_at),
        score: row.score,
        total: row.total,
    }));
    const total = Number(countRows[0].count);
    return NextResponse.json({ entries, total });
}

export async function POST(request: NextRequest) {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id ?? null;

    const result = (await request.json()) as TestResult;

    await sql`
      INSERT INTO history (user_id, score, total, completed_at)
      VALUES (${userId}, ${result.score}, ${result.total}, ${result.timestamp})
    `;

    return NextResponse.json({ ok: true });
}
