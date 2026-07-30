import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/src/db";

// Deliberately unauthenticated (mirrors GET /api/captcha) — the invite
// landing page needs to show who invited a visitor before they sign in.
// Read-only, single indexed SELECT, no side effect — no rate limiting needed.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const [row] = await sql`
    SELECT fit.user_id, u.name, u.image, (u.id IS NULL) AS deleted
    FROM friend_invite_tokens fit
    LEFT JOIN neon_auth."user" u ON u.id::text = fit.user_id
    WHERE fit.token = ${token}
  `;

  if (!row) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  return NextResponse.json({
    inviterId: row.user_id as string,
    inviterName: row.deleted ? null : (row.name as string | null),
    inviterImage: row.deleted ? null : (row.image as string | null),
    accountDeleted: row.deleted as boolean,
  });
}
