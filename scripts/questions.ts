import type { Question } from "../src/types";

// The question bank now lives in Neon Postgres (see db/migrations/0000_baseline.sql), seeded
// via scripts/seed-questions.ts. This array is no longer the source of
// truth — it's a staging area: add new questions here, then run
// `npm run seed:questions` or `node --experimental-strip-types --env-file=.env.local scripts/seed-questions.ts`
// to upsert them into the database (existing rows not present here are left
// untouched, never deleted).
export const questions: Question[] = [];
