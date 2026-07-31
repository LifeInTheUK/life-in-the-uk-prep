-- db/migrations/0002_question_proposals.sql
--
-- Question proposals: signed-in users suggest new questions for review.
-- No FK to neon_auth."user" — same bare TEXT user_id convention as
-- progress/history/friends (see db/migrations/0001_friends.sql). `status`
-- (default 'pending') has no in-app transition UI yet, but is the only way
-- to mark a row reviewed without deleting it, so it's kept.
CREATE TABLE IF NOT EXISTS question_proposals (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB,
  answer JSONB,
  explanation TEXT,
  topic TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS question_proposals_user_id_idx ON question_proposals (user_id);

CREATE INDEX IF NOT EXISTS question_proposals_status_idx ON question_proposals (status);
