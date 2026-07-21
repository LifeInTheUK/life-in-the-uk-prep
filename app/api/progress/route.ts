import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { auth } from "@/auth";
import type { SM2Data } from "@/src/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data =
      (await kv.get<Record<number, SM2Data>>(
        `progress:${session.user.email}`,
      )) || {};
    return NextResponse.json(data);
  } catch {
    // KV not configured (e.g. local dev without a Vercel KV store attached).
    return NextResponse.json({});
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, sm2Data } = (await request.json()) as {
    id: number;
    sm2Data: SM2Data;
  };

  try {
    const key = `progress:${session.user.email}`;
    const existing = (await kv.get<Record<number, SM2Data>>(key)) || {};
    existing[id] = sm2Data;
    await kv.set(key, existing);
    return NextResponse.json({ ok: true });
  } catch {
    // KV not configured — no-op, the client's localStorage write already succeeded.
    return NextResponse.json({ ok: true });
  }
}
