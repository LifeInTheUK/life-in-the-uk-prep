import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/src/db";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "@/src/config";

const CATEGORIES = ["typo", "wrong_info", "confusing", "duplicate"] as const;
type Category = (typeof CATEGORIES)[number];

function notifyTelegram(
  questionId: number,
  category: Category,
  questionText: string,
): void {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const text = `New question feedback\nQuestion #${questionId}: ${questionText}\nCategory: ${category}`;
  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
  }).catch(() => {
    // Best-effort — never block or fail the feedback submission on this.
  });
}

export async function POST(request: NextRequest) {
  const { questionId, category } = (await request.json()) as {
    questionId: number;
    category: Category;
  };

  if (!Number.isInteger(questionId) || !CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id ?? null;

  await sql`
    INSERT INTO feedback (question_id, user_id, category, created_at)
    VALUES (${questionId}, ${userId}, ${category}, ${Date.now()})
    ON CONFLICT (user_id, question_id) DO NOTHING
  `;

  const [question] = await sql`
    SELECT question FROM questions WHERE id = ${questionId}
  `;
  if (question) {
    notifyTelegram(questionId, category, question.question);
  }

  return NextResponse.json({ ok: true });
}
