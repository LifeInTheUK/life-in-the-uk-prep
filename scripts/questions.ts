import type { Question } from "../src/types";

// The question bank now lives in Neon Postgres (see db/schema.sql), seeded
// via scripts/migrate-questions.ts. This array is no longer the source of
// truth — it's a staging area: add new questions here, then run
// `node --experimental-strip-types --env-file=.env.local scripts/migrate-questions.ts`
// to upsert them into the database (existing rows not present here are left
// untouched, never deleted).
export const questions: Question[] = [];
