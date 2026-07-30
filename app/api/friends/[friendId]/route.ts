import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/src/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ friendId: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { friendId } = await params;
  const me = session.user.id;

  // Removes both directions unconditionally — works even if the friend
  // deleted their account (no FK to violate). A DELETE on a nonexistent row
  // is just a no-op, matching /api/account's idempotent-DELETE convention.
  await sql`DELETE FROM friends WHERE user_id = ${me} AND friend_id = ${friendId}`;
  await sql`DELETE FROM friends WHERE user_id = ${friendId} AND friend_id = ${me}`;

  return NextResponse.json({ ok: true });
}
