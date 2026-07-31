import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/src/db";
import { TOPIC_ORDER } from "@/src/topics";
import {
  IS_PRODUCTION,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  PROPOSE_QUESTION_RATE_LIMIT_WINDOW_MS,
  PROPOSE_QUESTION_RATE_LIMIT_MAX_PER_IDENTITY,
} from "@/src/config";
import {
  incrementRateLimit,
  checkBanned,
  recordViolationAndMaybeBan,
} from "@/lib/rateLimit";

const ENDPOINT = "propose-question";

const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g;
const MAX_QUESTION_LENGTH = 500;
const MAX_OPTION_LENGTH = 200;
const MAX_EXPLANATION_LENGTH = 1000;
const MAX_OPTIONS = 6;

function sanitize(raw: string): string {
  return raw.replace(CONTROL_CHARS, "").trim();
}

async function notifyTelegram(
  userId: string,
  question: string,
  options: string[] | null,
  answer: number | number[] | null,
  explanation: string | null,
  topic: string | null,
): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn(
      "[propose-question] Telegram notify skipped — TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set",
    );
    return;
  }
  if (!IS_PRODUCTION) {
    return;
  }

  const answerSet = new Set(
    answer === null ? [] : Array.isArray(answer) ? answer : [answer],
  );

  let text = `New question proposal from user ${userId}\nQuestion: ${question}`;
  if (options) {
    text += `\nOptions:\n${options
      .map((o, i) => `${answerSet.has(i) ? "✓" : "-"} ${o}`)
      .join("\n")}`;
  }
  if (explanation) {
    text += `\nExplanation: ${explanation}`;
  }
  if (topic) {
    text += `\nTopic: ${topic}`;
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
      console.error(`[propose-question] Telegram notify failed: ${res.status} ${body}`);
    } else {
      console.log("[propose-question] Telegram notify sent");
    }
  } catch (err) {
    console.error("[propose-question] Telegram notify threw", err);
  }
}

export async function POST(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;

  const identityKey = `proposeq:${me}`;
  if (await checkBanned(identityKey, ENDPOINT)) {
    return NextResponse.json({ error: "banned" }, { status: 403 });
  }

  const count = await incrementRateLimit(identityKey, PROPOSE_QUESTION_RATE_LIMIT_WINDOW_MS);
  if (count > PROPOSE_QUESTION_RATE_LIMIT_MAX_PER_IDENTITY) {
    await recordViolationAndMaybeBan(identityKey, ENDPOINT);
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as {
    question?: string;
    options?: string[];
    answer?: number | number[];
    explanation?: string;
    topic?: string;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof body.question !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const question = sanitize(body.question);
  if (question.length === 0 || question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let options: string[] | null = null;
  let answer: number | number[] | null = null;

  const hasOptions = body.options !== undefined && body.options !== null;
  if (hasOptions) {
    if (!Array.isArray(body.options) || body.options.some((o) => typeof o !== "string")) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const sanitized = body.options.map(sanitize).filter((o) => o.length > 0);
    if (
      sanitized.length < 2 ||
      sanitized.length > MAX_OPTIONS ||
      sanitized.some((o) => o.length > MAX_OPTION_LENGTH)
    ) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    options = sanitized;

    const rawAnswer = body.answer;
    const indices = Array.isArray(rawAnswer) ? rawAnswer : rawAnswer === undefined ? [] : [rawAnswer];
    const uniqueIndices = new Set(indices);
    if (
      indices.length === 0 ||
      uniqueIndices.size !== indices.length ||
      indices.some((i) => !Number.isInteger(i) || i < 0 || i >= options!.length)
    ) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    answer = Array.isArray(rawAnswer) ? indices : indices[0];
  } else if (body.answer !== undefined && body.answer !== null) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let explanation: string | null = null;
  if (body.explanation !== undefined && body.explanation !== null) {
    if (typeof body.explanation !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const sanitized = sanitize(body.explanation);
    if (sanitized.length > MAX_EXPLANATION_LENGTH) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    explanation = sanitized.length > 0 ? sanitized : null;
  }

  let topic: string | null = null;
  if (body.topic !== undefined && body.topic !== null && body.topic !== "") {
    if (typeof body.topic !== "string" || !(TOPIC_ORDER as readonly string[]).includes(body.topic)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    topic = body.topic;
  }

  await sql`
    INSERT INTO question_proposals (user_id, question, options, answer, explanation, topic, created_at)
    VALUES (
      ${me},
      ${question},
      ${options ? JSON.stringify(options) : null},
      ${answer !== null ? JSON.stringify(answer) : null},
      ${explanation},
      ${topic},
      ${Date.now()}
    )
  `;

  await notifyTelegram(me, question, options, answer, explanation, topic);

  return NextResponse.json({ ok: true });
}
