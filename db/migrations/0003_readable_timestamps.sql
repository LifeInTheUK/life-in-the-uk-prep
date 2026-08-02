-- db/migrations/0003_readable_timestamps.sql
--
-- Every epoch-millis BIGINT timestamp column gets a paired generated
-- TIMESTAMPTZ column (`<col>_readable`) for human-readable inspection via
-- direct SQL/DB clients. GENERATED ALWAYS ... STORED is computed by
-- Postgres from the source column and kept in sync automatically - purely
-- additive, no existing data touched, no app code changes needed.
ALTER TABLE progress ADD COLUMN IF NOT EXISTS next_readable
  TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(next / 1000.0)) STORED;

ALTER TABLE history ADD COLUMN IF NOT EXISTS completed_at_readable
  TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(completed_at / 1000.0)) STORED;

ALTER TABLE feedback ADD COLUMN IF NOT EXISTS created_at_readable
  TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(created_at / 1000.0)) STORED;

ALTER TABLE feedback_rate_limits ADD COLUMN IF NOT EXISTS window_start_readable
  TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(window_start / 1000.0)) STORED;

ALTER TABLE app_feedback ADD COLUMN IF NOT EXISTS created_at_readable
  TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(created_at / 1000.0)) STORED;

ALTER TABLE captcha_challenges ADD COLUMN IF NOT EXISTS expires_at_readable
  TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(expires_at / 1000.0)) STORED;

ALTER TABLE rate_limit_violations ADD COLUMN IF NOT EXISTS occurred_at_readable
  TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(occurred_at / 1000.0)) STORED;

ALTER TABLE identity_bans ADD COLUMN IF NOT EXISTS banned_until_readable
  TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(banned_until / 1000.0)) STORED;

ALTER TABLE releases ADD COLUMN IF NOT EXISTS released_at_readable
  TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(released_at / 1000.0)) STORED;

ALTER TABLE friend_invite_tokens ADD COLUMN IF NOT EXISTS created_at_readable
  TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(created_at / 1000.0)) STORED;

ALTER TABLE friends ADD COLUMN IF NOT EXISTS created_at_readable
  TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(created_at / 1000.0)) STORED;

ALTER TABLE question_proposals ADD COLUMN IF NOT EXISTS created_at_readable
  TIMESTAMPTZ GENERATED ALWAYS AS (to_timestamp(created_at / 1000.0)) STORED;
