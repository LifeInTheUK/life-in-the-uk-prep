// scripts/migrate-feedback-columns.ts
//
// One-off: adds the details/ip columns and rate-limit indexes to the
// existing feedback table (already-applied db/schema.sql's CREATE TABLE
// IF NOT EXISTS won't retroactively alter a table that already exists).
// Standalone for the same reason as migrate-questions.ts - see that
// file's header comment.
//
// The two indexes this creates (feedback_ratelimit_user_idx/
// feedback_ratelimit_ip_idx) are superseded and dropped by
// migrate-feedback-rate-limit-table.ts, run after this one - the
// sliding-window count they backed turned out to be racy under
// concurrent requests, replaced with an atomic UPSERT counter table.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS details TEXT`;
  await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ip TEXT`;
  await sql`
    CREATE INDEX IF NOT EXISTS feedback_ratelimit_user_idx
      ON feedback (user_id, created_at) WHERE user_id IS NOT NULL
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS feedback_ratelimit_ip_idx
      ON feedback (ip, created_at) WHERE ip IS NOT NULL
  `;
  console.log("feedback table migrated: details, ip columns + rate-limit indexes added.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
