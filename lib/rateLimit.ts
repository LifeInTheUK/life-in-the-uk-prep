import type { NextRequest } from "next/server";
import { sql } from "@/src/db";
import { BAN_VIOLATION_THRESHOLD, BAN_VIOLATION_WINDOW_MS, BAN_DURATION_MS } from "@/src/config";

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  return forwarded.split(",")[0].trim() || "unknown";
}

// Atomically increments the counter for (key, window) and returns the
// post-increment count. Postgres row-locks the conflicting row on
// ON CONFLICT DO UPDATE, so concurrent requests for the same key serialize
// on this single statement instead of racing a separate
// SELECT-count-then-INSERT check (which a burst of parallel requests could
// all pass before any of them committed).
export async function incrementRateLimit(key: string, windowMs: number): Promise<number> {
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const [{ count }] = await sql`
    INSERT INTO feedback_rate_limits (key, window_start, count)
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT (key, window_start) DO UPDATE
      SET count = feedback_rate_limits.count + 1
    RETURNING count
  `;

  // Opportunistic sweep, same pattern as the captcha_challenges sweep in
  // GET /api/captcha - keeps feedback_rate_limits bounded without a cron job.
  // Longest configured window is 1h, so 24h is a safe buffer, not a tight
  // coupling to any specific window size.
  await sql`DELETE FROM feedback_rate_limits WHERE window_start < ${Date.now() - 24 * 60 * 60 * 1000}`;

  return Number(count);
}

// Checks whether (key, endpoint) is currently under an active ban.
export async function checkBanned(key: string, endpoint: string): Promise<boolean> {
  // Opportunistic sweep, same pattern as the captcha_challenges sweep in
  // GET /api/captcha - keeps identity_bans bounded without a cron job.
  await sql`DELETE FROM identity_bans WHERE banned_until < ${Date.now()}`;

  const [row] = await sql`
    SELECT banned_until FROM identity_bans WHERE key = ${key} AND endpoint = ${endpoint}
  `;
  return row !== undefined && Number(row.banned_until) > Date.now();
}

// Logs one rate-limit violation for (key, endpoint), then bans that
// identity from that endpoint (for BAN_DURATION_MS) once BAN_VIOLATION_THRESHOLD
// violations land within BAN_VIOLATION_WINDOW_MS. Call only when the
// per-identity check specifically is what rejected a request - never for
// a global-limit-only rejection.
export async function recordViolationAndMaybeBan(key: string, endpoint: string): Promise<void> {
  const now = Date.now();
  await sql`
    INSERT INTO rate_limit_violations (key, endpoint, occurred_at)
    VALUES (${key}, ${endpoint}, ${now})
  `;

  // Opportunistic sweep, same pattern as the captcha_challenges sweep in
  // GET /api/captcha - keeps rate_limit_violations bounded without a cron
  // job. Ban lookback (BAN_VIOLATION_WINDOW_MS) is only ~1h, so 24h is a
  // safe buffer, not a tight coupling to that window.
  await sql`DELETE FROM rate_limit_violations WHERE occurred_at < ${now - 24 * 60 * 60 * 1000}`;

  const [{ count }] = await sql`
    SELECT COUNT(*) AS count FROM rate_limit_violations
    WHERE key = ${key} AND endpoint = ${endpoint} AND occurred_at > ${now - BAN_VIOLATION_WINDOW_MS}
  `;

  if (Number(count) >= BAN_VIOLATION_THRESHOLD) {
    await sql`
      INSERT INTO identity_bans (key, endpoint, banned_until)
      VALUES (${key}, ${endpoint}, ${now + BAN_DURATION_MS})
      ON CONFLICT (key, endpoint) DO UPDATE
        SET banned_until = ${now + BAN_DURATION_MS}
    `;
  }
}
