import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/src/db";
import {
  FRIENDS_ADD_RATE_LIMIT_WINDOW_MS,
  FRIENDS_ADD_RATE_LIMIT_MAX_PER_IDENTITY,
} from "@/src/config";
import {
  incrementRateLimit,
  checkBanned,
  recordViolationAndMaybeBan,
} from "@/lib/rateLimit";

const ENDPOINT = "friends-add";

export async function POST(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;

  const identityKey = `friendsadd:${me}`;
  if (await checkBanned(identityKey, ENDPOINT)) {
    return NextResponse.json({ error: "banned" }, { status: 403 });
  }

  const count = await incrementRateLimit(identityKey, FRIENDS_ADD_RATE_LIMIT_WINDOW_MS);
  if (count > FRIENDS_ADD_RATE_LIMIT_MAX_PER_IDENTITY) {
    await recordViolationAndMaybeBan(identityKey, ENDPOINT);
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { token } = (await request.json()) as { token?: string };
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const [invite] = await sql`
    SELECT user_id FROM friend_invite_tokens WHERE token = ${token}
  `;
  if (!invite) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 400 });
  }

  const inviterId = invite.user_id as string;
  if (inviterId === me) {
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
  }

  const now = Date.now();
  // Two separate statements, not a transaction (the Neon serverless driver's
  // tagged-template calls are each their own round-trip). A partial failure
  // between the two leaves an asymmetric one-directional row, which
  // self-heals the next time either side calls this endpoint with a token —
  // ON CONFLICT DO NOTHING on the already-existing direction is a no-op and
  // only the missing direction gets inserted.
  await sql`
    INSERT INTO friends (user_id, friend_id, created_at)
    VALUES (${me}, ${inviterId}, ${now})
    ON CONFLICT (user_id, friend_id) DO NOTHING
  `;
  await sql`
    INSERT INTO friends (user_id, friend_id, created_at)
    VALUES (${inviterId}, ${me}, ${now})
    ON CONFLICT (user_id, friend_id) DO NOTHING
  `;

  return NextResponse.json({ ok: true, friendId: inviterId });
}
