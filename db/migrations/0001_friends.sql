-- db/migrations/0001_friends.sql
--
-- Friends feature: each user gets one persistent, reusable invite token
-- (friend_invite_tokens). Accepting one creates a mutual friendship stored
-- as one row per direction in `friends` (composite PK, no FK to
-- neon_auth."user" — matches progress/history's bare TEXT user_id
-- convention, since this app never owns/migrates that table).
CREATE TABLE IF NOT EXISTS friend_invite_tokens (
  user_id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS friend_invite_tokens_token_idx
  ON friend_invite_tokens (token);

CREATE TABLE IF NOT EXISTS friends (
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS friends_user_id_idx ON friends (user_id);
