import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/src/db";
import {
  IS_PRODUCTION,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  FEEDBACK_RATE_LIMIT_WINDOW_MS,
  FEEDBACK_RATE_LIMIT_MAX_SIGNED_IN,
  FEEDBACK_RATE_LIMIT_MAX_ANONYMOUS,
  FEEDBACK_GLOBAL_MINUTE_MAX,
  FEEDBACK_GLOBAL_HOUR_MAX,
} from "@/src/config";
import {
  getClientIp,
  incrementRateLimit,
  checkBanned,
  recordViolationAndMaybeBan,
} from "@/lib/rateLimit";

const CATEGORIES = [
  "typo",
  "wrong_info",
  "confusing",
  "duplicate",
  "other",
] as const;
type Category = (typeof CATEGORIES)[number];

// Site-wide caps across ALL users/IPs combined, independent of the
// per-identity limit above - stops a distributed flood (many different
// identities each staying under their own per-identity limit) from still
// overwhelming the feedback pipeline (DB writes, Telegram notifications).
const GLOBAL_MINUTE_KEY = "__global_minute__";
const GLOBAL_MINUTE_WINDOW_MS = 60 * 1000;
const GLOBAL_HOUR_KEY = "__global_hour__";
const GLOBAL_HOUR_WINDOW_MS = 60 * 60 * 1000;

const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g;
const MAX_DETAILS_LENGTH = 200;

function sanitizeDetails(raw: string): string {
  return raw.replace(CONTROL_CHARS, "").trim();
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

  // Don't send Telegram notifications in development mode to avoid spamming the chat with test feedback submissions.
  if (!IS_PRODUCTION) {
    return; // Don't send Telegram notifications in development mode
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
  const {
    questionId,
    category,
    details: rawDetails,
  } = (await request.json()) as {
    questionId: number;
    category: Category;
    details?: string;
  };

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id ?? null;
  const ip = getClientIp(request);
  const rateLimitKey = userId ?? ip;

  if (await checkBanned(rateLimitKey, "feedback")) {
    return NextResponse.json({ error: "banned" }, { status: 403 });
  }

  if (!Number.isInteger(questionId) || !CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let details: string | null = null;
  if (category === "other") {
    if (
      typeof rawDetails !== "string" ||
      rawDetails.length === 0 ||
      rawDetails.length > MAX_DETAILS_LENGTH
    ) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const sanitized = sanitizeDetails(rawDetails);
    if (sanitized.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    details = sanitized;
  }

  // All three counters are incremented unconditionally (even on requests
  // that end up rejected) so a client can't probe/reset a limit by testing
  // whether a request would succeed - the attempt itself always counts.
  const identityCount = await incrementRateLimit(
    rateLimitKey,
    FEEDBACK_RATE_LIMIT_WINDOW_MS,
  );
  const globalMinuteCount = await incrementRateLimit(
    GLOBAL_MINUTE_KEY,
    GLOBAL_MINUTE_WINDOW_MS,
  );
  const globalHourCount = await incrementRateLimit(
    GLOBAL_HOUR_KEY,
    GLOBAL_HOUR_WINDOW_MS,
  );

  const identityMax = userId
    ? FEEDBACK_RATE_LIMIT_MAX_SIGNED_IN
    : FEEDBACK_RATE_LIMIT_MAX_ANONYMOUS;
  if (identityCount > identityMax) {
    await recordViolationAndMaybeBan(rateLimitKey, "feedback");
  }
  if (
    identityCount > identityMax ||
    globalMinuteCount > FEEDBACK_GLOBAL_MINUTE_MAX ||
    globalHourCount > FEEDBACK_GLOBAL_HOUR_MAX
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
