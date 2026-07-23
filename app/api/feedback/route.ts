import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/src/db";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "@/src/config";

const CATEGORIES = ["typo", "wrong_info", "confusing", "duplicate", "other"] as const;
type Category = (typeof CATEGORIES)[number];

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
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

  // Fixed 10-minute window, atomically incremented via ON CONFLICT DO UPDATE
  // - Postgres row-locks the conflicting row, so concurrent requests from
  // the same key serialize on this single statement instead of racing a
  // separate SELECT-count-then-INSERT check (which a burst of parallel
  // requests could all pass before any of them committed).
  const windowStart = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
  const [{ count }] = await sql`
    INSERT INTO feedback_rate_limits (key, window_start, count)
    VALUES (${rateLimitKey}, ${windowStart}, 1)
    ON CONFLICT (key, window_start) DO UPDATE
      SET count = feedback_rate_limits.count + 1
    RETURNING count
  `;
  if (Number(count) > RATE_LIMIT_MAX) {
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
