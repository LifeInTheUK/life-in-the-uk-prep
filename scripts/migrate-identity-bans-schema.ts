// scripts/migrate-identity-bans-schema.ts
//
// One-off: creates rate_limit_violations and identity_bans, backing a
// 24h ban after 3 per-identity rate-limit violations within an hour, for
// both /api/feedback and /api/app-feedback (tracked independently via the
// `endpoint` column). Standalone for the same reason as
// migrate-questions.ts - see that file's header comment.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limit_violations (
      key TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      occurred_at BIGINT NOT NULL
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS rate_limit_violations_key_endpoint_idx
      ON rate_limit_violations (key, endpoint, occurred_at)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS identity_bans (
      key TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      banned_until BIGINT NOT NULL,
      PRIMARY KEY (key, endpoint)
    )
  `;
  console.log("rate_limit_violations and identity_bans tables created.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
