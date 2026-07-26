// scripts/seed-questions.ts
//
// Repeatable data seed (idempotent upsert), not a schema migration - run
// again any time src/questions.ts changes. Standalone script —
// deliberately does not import src/db.ts or src/config.ts. Those files
// are shared with the Next.js app, whose bundler
// (moduleResolution: "bundler") forbids ".ts" extensions in relative
// imports, while this script runs via plain Node
// (`node --experimental-strip-types`), whose ESM resolver requires them.
// Routing this script through src/db.ts would force one or the other to
// break. Self-contained means it works under both.
import { neon } from "@neondatabase/serverless";
import { questions } from "./questions.ts";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  let inserted = 0;
  for (const q of questions) {
    await sql`
      INSERT INTO questions (id, question, options, answer, explanation, topic)
      VALUES (${q.id}, ${q.q}, ${JSON.stringify(q.o)}, ${JSON.stringify(q.a)}, ${q.ex}, ${q.topic ?? null})
      ON CONFLICT (id) DO UPDATE SET
        question = EXCLUDED.question,
        options = EXCLUDED.options,
        answer = EXCLUDED.answer,
        explanation = EXCLUDED.explanation,
        topic = EXCLUDED.topic
    `;
    inserted++;
  }
  console.log(`Seeded ${inserted} questions.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
