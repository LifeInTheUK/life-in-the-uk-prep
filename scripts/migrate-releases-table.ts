// scripts/migrate-releases-table.ts
//
// Creates the releases table (see db/schema.sql). Standalone for the same
// reason as migrate-questions.ts - see that file's header comment.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS releases (
      sha TEXT PRIMARY KEY,
      message TEXT NOT NULL,
      released_at BIGINT NOT NULL
    )
  `;
  console.log("releases table created.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
