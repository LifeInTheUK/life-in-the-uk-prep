-- db/schema.sql
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
