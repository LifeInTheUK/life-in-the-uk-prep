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
