import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { auth } from "@/auth";
import type { TestResult } from "@/src/history";

const MAX_ENTRIES = 50;

export async function GET() {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data =
            (await kv.get<TestResult[]>(`history:${session.user.email}`)) ||
            [];
        return NextResponse.json(data);
    } catch {
        // KV not configured (e.g. local dev without a Vercel KV store attached).
        return NextResponse.json([]);
    }
}

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = (await request.json()) as TestResult;

    try {
        const key = `history:${session.user.email}`;
        const existing = (await kv.get<TestResult[]>(key)) || [];
        existing.push(result);
        await kv.set(key, existing.slice(-MAX_ENTRIES));
        return NextResponse.json({ ok: true });
    } catch {
        // KV not configured — no-op, the client's localStorage write already succeeded.
        return NextResponse.json({ ok: true });
    }
}
