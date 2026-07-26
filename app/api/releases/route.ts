import { NextResponse } from "next/server";
import { sql } from "@/src/db";

export async function GET() {
  const rows = await sql`
    SELECT sha, message, released_at
    FROM releases
    ORDER BY released_at DESC
  `;
  return NextResponse.json(
    rows.map((r) => ({
      sha: r.sha as string,
      message: r.message as string,
      releasedAt: Number(r.released_at),
    })),
  );
}
