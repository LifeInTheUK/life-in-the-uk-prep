import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/src/db";

export async function DELETE() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sql`DELETE FROM neon_auth."user" WHERE id = ${session.user.id}`;

  return NextResponse.json({ ok: true });
}
