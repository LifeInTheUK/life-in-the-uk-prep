import { NextResponse } from "next/server";
import { sql } from "@/src/db";

export async function GET() {
  const rows = await sql`SELECT id, topic FROM questions ORDER BY id`;
  return NextResponse.json(
    rows.map((row) => ({ id: row.id, topic: row.topic ?? undefined })),
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}
