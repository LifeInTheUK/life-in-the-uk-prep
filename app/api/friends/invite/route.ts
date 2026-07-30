import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/src/db";
import { SITE_URL } from "@/src/config";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ON CONFLICT DO UPDATE (no-op) rather than DO NOTHING so RETURNING still
  // fires when the row already exists — the token is meant to be persistent
  // and reusable, never rotated.
  const [{ token }] = await sql`
    INSERT INTO friend_invite_tokens (user_id, token, created_at)
    VALUES (${session.user.id}, ${randomUUID()}, ${Date.now()})
    ON CONFLICT (user_id) DO UPDATE SET user_id = friend_invite_tokens.user_id
    RETURNING token
  `;

  return NextResponse.json({ token, url: `${SITE_URL}/friends/add/${token}` });
}
