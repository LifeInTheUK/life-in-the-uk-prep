-- db/migrations/0000_baseline.sql
--
-- Historical baseline: this is every table that existed before the
-- numbered migration system (scripts/migrate.ts) was introduced, moved
-- here verbatim from the old db/schema.sql. All statements are idempotent
-- (IF NOT EXISTS), so re-running this against a database that already has
-- these tables is always safe. Add new schema changes as
-- db/migrations/0001_<description>.sql, 0002_<description>.sql, etc -
-- never edit this file after it's been applied anywhere.
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  answer JSONB NOT NULL,
  explanation TEXT NOT NULL,
  topic TEXT
);

CREATE TABLE IF NOT EXISTS progress (
  user_id TEXT NOT NULL,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  n INTEGER NOT NULL,
  ef REAL NOT NULL,
  i INTEGER NOT NULL,
  next BIGINT NOT NULL,
  attempts INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  last_correct BOOLEAN,
  last_selected JSONB,
  PRIMARY KEY (user_id, question_id)
);

CREATE TABLE IF NOT EXISTS history (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  completed_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS history_user_id_idx ON history(user_id);

CREATE TABLE IF NOT EXISTS feedback (
  id BIGSERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  user_id TEXT,
  category TEXT NOT NULL,
  details TEXT,
  ip TEXT,
  created_at BIGINT NOT NULL,
  UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS feedback_question_id_idx ON feedback(question_id);

-- Fixed-window counter for POST /api/feedback rate limiting, keyed on
-- user_id if signed in else IP. A single atomic UPSERT (INSERT ... ON
-- CONFLICT DO UPDATE) increments the count under Postgres's row lock, so
-- concurrent requests from the same key can't race past the limit the way
-- a separate SELECT-then-INSERT check could.
CREATE TABLE IF NOT EXISTS feedback_rate_limits (
  key TEXT NOT NULL,
  window_start BIGINT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

CREATE TABLE IF NOT EXISTS app_feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  details TEXT NOT NULL,
  ip TEXT,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS captcha_challenges (
  token TEXT PRIMARY KEY,
  answer INTEGER NOT NULL,
  expires_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limit_violations (
  key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  occurred_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limit_violations_key_endpoint_idx
  ON rate_limit_violations (key, endpoint, occurred_at);

CREATE TABLE IF NOT EXISTS identity_bans (
  key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  banned_until BIGINT NOT NULL,
  PRIMARY KEY (key, endpoint)
);

-- Populated automatically by scripts/record-release.ts on every production
-- Vercel deploy (see CLAUDE.md's "Stale-build detection" section). sha is
-- truncated to 7 chars to match GIT_COMMIT_SHA/VERCEL_GIT_COMMIT_SHA's
-- existing convention in src/config.ts.
CREATE TABLE IF NOT EXISTS releases (
  sha TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  released_at BIGINT NOT NULL
);
