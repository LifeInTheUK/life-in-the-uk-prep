// scripts/migrate.ts
//
// Applies every pending file in db/migrations/, in filename order, tracked
// via the schema_migrations table. Standalone (own neon() client, not
// src/db.ts) for the same reason as every file it replaces - see
// db/migrations/0000_baseline.sql's header comment.
import { neon } from "@neondatabase/serverless";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const sql = neon(process.env.DATABASE_URL!);
const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at BIGINT NOT NULL
    )
  `;

  const applied = new Set(
    (await sql`SELECT id FROM schema_migrations`).map((row) => row.id as string),
  );

  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  let appliedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const id = file.replace(/\.sql$/, "");
    if (applied.has(id)) {
      skippedCount++;
      continue;
    }

    // Naive split - the Neon driver rejects true multi-statement calls
    // ("cannot insert multiple commands into a prepared statement"), but
    // this only supports plain semicolon-terminated DDL: a DO $$ ... $$
    // block, a function/trigger definition, or a semicolon inside a
    // string literal will be silently mis-split. Keep migrations to
    // simple single-statement-per-`;` DDL (see CLAUDE.md).
    const text = readFileSync(join(migrationsDir, file), "utf-8");
    const statements = text
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await sql.query(statement);
    }

    await sql`INSERT INTO schema_migrations (id, applied_at) VALUES (${id}, ${Date.now()})`;
    console.log(`Applied ${file}`);
    appliedCount++;
  }

  console.log(`${appliedCount} applied, ${skippedCount} already up to date.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
