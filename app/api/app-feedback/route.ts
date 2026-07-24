import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/src/db";
import {
  getClientIp,
  incrementRateLimit,
  checkBanned,
  recordViolationAndMaybeBan,
} from "@/lib/rateLimit";
import {
  IS_PRODUCTION,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  APP_FEEDBACK_RATE_LIMIT_WINDOW_MS,
  APP_FEEDBACK_RATE_LIMIT_MAX_PER_IDENTITY,
  APP_FEEDBACK_GLOBAL_MAX,
} from "@/src/config";

const MAX_DETAILS_LENGTH = 200;
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g;

const GLOBAL_KEY = "appfb:__global_hour__";

function sanitizeDetails(raw: string): string {
  return raw.replace(CONTROL_CHARS, "").trim();
}

async function verifyCaptcha(
  token: unknown,
  answer: unknown,
): Promise<boolean> {
  if (typeof token !== "string" || typeof answer !== "number") return false;

  const [row] = await sql`
    DELETE FROM captcha_challenges WHERE token = ${token} RETURNING answer, expires_at
  `;
  if (!row) return false;
  if (Number(row.expires_at) < Date.now()) return false;
  return Number(row.answer) === answer;
}

async function notifyTelegram(details: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn(
      "[app-feedback] Telegram notify skipped — TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set",
    );
    return;
  }

  // Don't send Telegram notifications in development mode to avoid spamming the chat with test feedback submissions.
  if (!IS_PRODUCTION) {
    return; // Don't send Telegram notifications in development mode
  }

  const text = `New app feedback\n${details}`;
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
      console.error(
        `[app-feedback] Telegram notify failed: ${res.status} ${body}`,
      );
    } else {
      console.log("[app-feedback] Telegram notify sent");
    }
  } catch (err) {
    console.error("[app-feedback] Telegram notify threw", err);
  }
}

export async function POST(request: NextRequest) {
  const {
    details: rawDetails,
    captchaToken,
    captchaAnswer,
  } = (await request.json()) as {
    details?: string;
    captchaToken?: string;
    captchaAnswer?: number;
  };

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id ?? null;
  const ip = getClientIp(request);
  const rawIdentity = userId ?? ip;

  if (await checkBanned(rawIdentity, "app-feedback")) {
    return NextResponse.json({ error: "banned" }, { status: 403 });
  }

  if (
    typeof rawDetails !== "string" ||
    rawDetails.length === 0 ||
    rawDetails.length > MAX_DETAILS_LENGTH
  ) {
    return NextResponse.json({ error: "invalid_details" }, { status: 400 });
  }
  const details = sanitizeDetails(rawDetails);
  if (details.length === 0) {
    return NextResponse.json({ error: "invalid_details" }, { status: 400 });
  }

  const captchaOk = await verifyCaptcha(captchaToken, captchaAnswer);
  if (!captchaOk) {
    return NextResponse.json({ error: "invalid_captcha" }, { status: 400 });
  }

  const identityKey = `appfb:${rawIdentity}`;

  const identityCount = await incrementRateLimit(
    identityKey,
    APP_FEEDBACK_RATE_LIMIT_WINDOW_MS,
  );
  const globalCount = await incrementRateLimit(
    GLOBAL_KEY,
    APP_FEEDBACK_RATE_LIMIT_WINDOW_MS,
  );

  if (identityCount > APP_FEEDBACK_RATE_LIMIT_MAX_PER_IDENTITY) {
    await recordViolationAndMaybeBan(rawIdentity, "app-feedback");
  }
  if (
    identityCount > APP_FEEDBACK_RATE_LIMIT_MAX_PER_IDENTITY ||
    globalCount > APP_FEEDBACK_GLOBAL_MAX
  ) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  await sql`
    INSERT INTO app_feedback (user_id, details, ip, created_at)
    VALUES (${userId}, ${details}, ${ip}, ${Date.now()})
  `;

  await notifyTelegram(details);

  return NextResponse.json({ ok: true });
}
