// scripts/sync-questions.ts
//
// Reads db/questions-export.json (produced by scripts/export-questions.ts
// and hand-edited for review) and upserts every row into `questions` by
// id - INSERT ... ON CONFLICT (id) DO UPDATE. This is the only way
// question content gets into the table (no static in-repo source), so
// it's also the bootstrap path for a freshly-migrated, empty `questions`
// table. Rows present in the DB but absent from the
// file are left untouched (never deleted): questions.id is referenced by
// progress.question_id/feedback.question_id (see
// db/migrations/0000_baseline.sql), so this script never removes rows -
// only inserts new ones or updates existing ones by their unchanged id,
// which is what keeps those foreign keys intact.
//
// Reads DATABASE_URL from the environment like every other script here.
// The npm script defaults to dev (.env.local); to sync to prod, run with
// prod's DATABASE_URL in scope instead, e.g.:
//   DATABASE_URL="<prod-url>" node --experimental-strip-types scripts/sync-questions.ts
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

interface ExportedQuestion {
  id: number;
  question: string;
  options: string[];
  answer: number | number[];
  explanation: string;
  topic: string | null;
}

const sql = neon(process.env.DATABASE_URL!);
const filePath = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "questions-export.json");

async function main() {
  const questions: ExportedQuestion[] = JSON.parse(readFileSync(filePath, "utf-8"));

  let synced = 0;
  for (const q of questions) {
    await sql`
      INSERT INTO questions (id, question, options, answer, explanation, topic)
      VALUES (${q.id}, ${q.question}, ${JSON.stringify(q.options)}, ${JSON.stringify(q.answer)}, ${q.explanation}, ${q.topic ?? null})
      ON CONFLICT (id) DO UPDATE SET
        question = EXCLUDED.question,
        options = EXCLUDED.options,
        answer = EXCLUDED.answer,
        explanation = EXCLUDED.explanation,
        topic = EXCLUDED.topic
    `;
    synced++;
  }

  console.log(`Synced ${synced} questions from ${filePath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
