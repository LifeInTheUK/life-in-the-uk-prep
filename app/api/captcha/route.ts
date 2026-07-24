import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sql } from "@/src/db";

export const dynamic = "force-dynamic";

const CAPTCHA_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const token = randomUUID();
  const expiresAt = Date.now() + CAPTCHA_TTL_MS;

  // This endpoint is intentionally ungated (no auth, no rate limit - issuing
  // a challenge is meant to be cheap), which otherwise lets an unbounded
  // loop of calls grow captcha_challenges forever. Piggyback an opportunistic
  // sweep of expired rows on every issue so the table stays bounded by
  // roughly (issue rate * CAPTCHA_TTL_MS) rather than growing without limit.
  await sql`DELETE FROM captcha_challenges WHERE expires_at < ${Date.now()}`;

  await sql`
    INSERT INTO captcha_challenges (token, answer, expires_at)
    VALUES (${token}, ${a + b}, ${expiresAt})
  `;

  return NextResponse.json({ token, question: `${a} + ${b}` });
}
