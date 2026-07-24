// scripts/migrate-app-feedback-schema.ts
//
// One-off: creates the app_feedback and captcha_challenges tables for the
// homepage general-feedback feature. Standalone for the same reason as
// migrate-questions.ts - see that file's header comment.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS app_feedback (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT,
      details TEXT NOT NULL,
      ip TEXT,
      created_at BIGINT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS captcha_challenges (
      token TEXT PRIMARY KEY,
      answer INTEGER NOT NULL,
      expires_at BIGINT NOT NULL
    )
  `;
  console.log("app_feedback and captcha_challenges tables created.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
