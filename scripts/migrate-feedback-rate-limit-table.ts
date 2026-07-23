// scripts/migrate-feedback-rate-limit-table.ts
//
// Follow-up to migrate-feedback-columns.ts: replaces the sliding-window
// rate-limit indexes (feedback_ratelimit_user_idx/feedback_ratelimit_ip_idx,
// which backed a SELECT-COUNT-then-INSERT check racy under concurrent
// requests) with a dedicated feedback_rate_limits table using an atomic
// UPSERT counter instead. Standalone for the same reason as
// migrate-questions.ts - see that file's header comment.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`DROP INDEX IF EXISTS feedback_ratelimit_user_idx`;
  await sql`DROP INDEX IF EXISTS feedback_ratelimit_ip_idx`;
  await sql`
    CREATE TABLE IF NOT EXISTS feedback_rate_limits (
      key TEXT NOT NULL,
      window_start BIGINT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (key, window_start)
    )
  `;
  console.log("feedback_rate_limits table created, old sliding-window indexes dropped.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
