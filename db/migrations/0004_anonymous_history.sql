-- db/migrations/0004_anonymous_history.sql
--
-- Allow anonymous completed-test telemetry: history.user_id becomes
-- nullable so a signed-out completion can be recorded as one row with
-- user_id = NULL (count-only, no IP, no per-question data) rather than
-- being dropped entirely. Signed-in rows are unaffected. DROP COLUMN ...
-- NOT NULL is a no-op (not an error) if already nullable, so this is safe
-- to re-run.
ALTER TABLE history ALTER COLUMN user_id DROP NOT NULL;
