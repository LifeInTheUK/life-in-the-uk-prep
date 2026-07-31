// scripts/export-questions.ts
//
// Dumps the live `questions` table to a gitignored JSON file
// (db/questions-export.json) for manual review/editing, then re-synced
// back via scripts/sync-questions.ts. Standalone script (own neon()
// client, no src/db.ts import) for the same reason as
// scripts/seed-questions.ts - see that file's header comment.
//
// Reads DATABASE_URL from the environment like every other script here.
// The npm script defaults to dev (.env.local); to export prod, run with
// prod's DATABASE_URL in scope instead, e.g.:
//   DATABASE_URL="<prod-url>" node --experimental-strip-types scripts/export-questions.ts
import { neon } from "@neondatabase/serverless";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const sql = neon(process.env.DATABASE_URL!);
const outPath = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "questions-export.json");

async function main() {
  const rows = await sql`
    SELECT id, question, options, answer, explanation, topic
    FROM questions
    ORDER BY id
  `;

  writeFileSync(outPath, JSON.stringify(rows, null, 2) + "\n");
  console.log(`Exported ${rows.length} questions to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
