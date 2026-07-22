import { NextResponse } from "next/server";
import { sql } from "@/src/db";

export async function GET() {
  const rows = await sql`SELECT count(*) FROM questions`;
  return NextResponse.json({ count: Number(rows[0].count) });
}
