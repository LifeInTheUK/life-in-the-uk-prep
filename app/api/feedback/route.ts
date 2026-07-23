import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/src/db";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "@/src/config";

const CATEGORIES = ["typo", "wrong_info", "confusing", "duplicate", "other"] as const;
type Category = (typeof CATEGORIES)[number];

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
// Signed-in users are identifiable/accountable (real account, bannable), so
// they get a slightly higher ceiling than anonymous IP-keyed requests, whose
// identity is weaker (shared NAT/proxy IPs) and easier to spoof/rotate.
const RATE_LIMIT_MAX_SIGNED_IN = 5;
const RATE_LIMIT_MAX_ANONYMOUS = 2;

// Site-wide caps across ALL users/IPs combined, independent of the
// per-identity limit above - stops a distributed flood (many different
// identities each staying under their own per-identity limit) from still
// overwhelming the feedback pipeline (DB writes, Telegram notifications).
const GLOBAL_MINUTE_KEY = "__global_minute__";
const GLOBAL_MINUTE_WINDOW_MS = 60 * 1000;
const GLOBAL_MINUTE_MAX = 5;
const GLOBAL_HOUR_KEY = "__global_hour__";
const GLOBAL_HOUR_WINDOW_MS = 60 * 60 * 1000;
const GLOBAL_HOUR_MAX = 10;

const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g;
const MAX_DETAILS_LENGTH = 200;

function sanitizeDetails(raw: string): string {
  return raw.replace(CONTROL_CHARS, "").trim();
}

function getClientIp(request: NextRequest): string {
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
async function incrementRateLimit(key: string, windowMs: number): Promise<number> {
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const [{ count }] = await sql`
    INSERT INTO feedback_rate_limits (key, window_start, count)
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT (key, window_start) DO UPDATE
      SET count = feedback_rate_limits.count + 1
    RETURNING count
  `;
  return Number(count);
}

async function notifyTelegram(
  questionId: number,
  category: Category,
  questionText: string,
  details: string | null,
): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn(
      "[feedback] Telegram notify skipped — TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set",
    );
    return;
  }

  let text = `New question feedback\nQuestion #${questionId}: ${questionText}\nCategory: ${category}`;
  if (details) {
    text += `\nDetails: ${details.slice(0, MAX_DETAILS_LENGTH)}`;
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
      },
    );
    const body = await res.text();
    if (!res.ok) {
      console.error(`[feedback] Telegram notify failed: ${res.status} ${body}`);
    } else {
      console.log("[feedback] Telegram notify sent");
    }
  } catch (err) {
    console.error("[feedback] Telegram notify threw", err);
  }
}

export async function POST(request: NextRequest) {
  const { questionId, category, details: rawDetails } = (await request.json()) as {
    questionId: number;
    category: Category;
    details?: string;
  };

  if (!Number.isInteger(questionId) || !CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let details: string | null = null;
  if (category === "other") {
    if (typeof rawDetails !== "string" || rawDetails.length === 0 || rawDetails.length > MAX_DETAILS_LENGTH) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const sanitized = sanitizeDetails(rawDetails);
    if (sanitized.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    details = sanitized;
  }

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id ?? null;
  const ip = getClientIp(request);
  const rateLimitKey = userId ?? ip;

  // All three counters are incremented unconditionally (even on requests
  // that end up rejected) so a client can't probe/reset a limit by testing
  // whether a request would succeed - the attempt itself always counts.
  const identityCount = await incrementRateLimit(rateLimitKey, RATE_LIMIT_WINDOW_MS);
  const globalMinuteCount = await incrementRateLimit(GLOBAL_MINUTE_KEY, GLOBAL_MINUTE_WINDOW_MS);
  const globalHourCount = await incrementRateLimit(GLOBAL_HOUR_KEY, GLOBAL_HOUR_WINDOW_MS);

  const identityMax = userId ? RATE_LIMIT_MAX_SIGNED_IN : RATE_LIMIT_MAX_ANONYMOUS;
  if (
    identityCount > identityMax ||
    globalMinuteCount > GLOBAL_MINUTE_MAX ||
    globalHourCount > GLOBAL_HOUR_MAX
  ) {
    return NextResponse.json(
      { error: "Too many reports. Try again later." },
      { status: 429 },
    );
  }

  await sql`
    INSERT INTO feedback (question_id, user_id, category, details, ip, created_at)
    VALUES (${questionId}, ${userId}, ${category}, ${details}, ${ip}, ${Date.now()})
    ON CONFLICT (user_id, question_id) DO NOTHING
  `;

  const [question] = await sql`
    SELECT question FROM questions WHERE id = ${questionId}
  `;
  if (question) {
    await notifyTelegram(questionId, category, question.question, details);
  }

  return NextResponse.json({ ok: true });
}
