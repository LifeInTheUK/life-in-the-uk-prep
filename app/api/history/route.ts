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

    const rows = await sql`
      SELECT score, total, completed_at
      FROM history
      WHERE user_id = ${session.user.id}
      ORDER BY completed_at DESC
      LIMIT ${MAX_ENTRIES}
    `;

    const data: TestResult[] = rows.map((row) => ({
        timestamp: Number(row.completed_at),
        score: row.score,
        total: row.total,
    }));
    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = (await request.json()) as TestResult;

    await sql`
      INSERT INTO history (user_id, score, total, completed_at)
      VALUES (${session.user.id}, ${result.score}, ${result.total}, ${result.timestamp})
    `;

    return NextResponse.json({ ok: true });
}
