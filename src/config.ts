// Single place to read process.env — everything else imports from here
// instead of reaching into process.env directly. NEXT_PUBLIC_-prefixed vars
// are safe to read in client-bundled code (Next.js inlines them at build
// time); the rest (DATABASE_URL, NEON_AUTH_*) resolve to `undefined` in the
// browser and must only be imported by server-only files (API routes,
// lib/auth/server.ts, src/db.ts).

export const DATABASE_URL = process.env.DATABASE_URL!;
export const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL!;
export const NEON_AUTH_COOKIE_SECRET = process.env.NEON_AUTH_COOKIE_SECRET!;

// Optional — feedback-report notifications are skipped (silently) if unset.
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Official test length is 24 questions; override with NEXT_PUBLIC_SESSION_SIZE
// (e.g. in .env.development) to use a shorter session while developing.
export const SESSION_SIZE = Number(process.env.NEXT_PUBLIC_SESSION_SIZE) || 24;

// Official test allows 45 minutes; override with
// NEXT_PUBLIC_SESSION_TIME_LIMIT_MINUTES for faster dev/e2e runs, same reason
// SESSION_SIZE is overridable.
export const SESSION_TIME_LIMIT_MINUTES =
  Number(process.env.NEXT_PUBLIC_SESSION_TIME_LIMIT_MINUTES) || 45;
export const SESSION_TIME_LIMIT_MS = SESSION_TIME_LIMIT_MINUTES * 60 * 1000;

// Session mix: new questions / questions answered wrong at least once /
// questions always answered correctly so far. Keeps review resurfacing from
// session one instead of only after the whole bank has been seen.
export const SESSION_NEW_RATIO = 0.8;
export const SESSION_IMPROVE_RATIO = 0.15;
export const SESSION_CORRECT_RATIO = 0.05;

// Chapter-weighted quotas mirroring the official test's per-chapter ranges
// out of 24: Ch1 Values & Principles 2-3 (using 3), Ch2 UK Overview 3-4 (3),
// Ch3 History 8-10 (9), Ch4 Culture 4-5 (4), Ch5 Government & Law 5-6 (5).
// Ratios (not fixed counts) so NEXT_PUBLIC_SESSION_SIZE overrides (e2e) still
// scale sanely. "history" deliberately omitted — it absorbs the rounding
// remainder, same pattern SESSION_CORRECT_RATIO's sibling counts already use.
export const CHAPTER_QUOTA_RATIOS: Record<string, number> = {
  "uk-overview": 3 / 24,
  "values-principles": 3 / 24,
  culture: 4 / 24,
  "government-law": 5 / 24,
};

// Short commit hash of the deployed build, empty outside Vercel (see next.config.ts).
export const GIT_COMMIT_SHA = (
  process.env.NEXT_PUBLIC_GIT_COMMIT_SHA || ""
).slice(0, 7);

// Same value as GIT_COMMIT_SHA above, but read server-side (not baked into
// the client bundle) — reflects whichever deployment is currently live,
// unlike the client's frozen build-time value. Used by /api/version to
// detect when a client's bundle is older than what's currently deployed.
export const VERCEL_GIT_COMMIT_SHA = (
  process.env.VERCEL_GIT_COMMIT_SHA || ""
).slice(0, 7);

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Rate-limit / ban thresholds, overridable in production without a
// redeploy - each falls back to the value that was previously hardcoded
// if unset or invalid, so default behavior is unchanged.

// /api/feedback (question reports)
export const FEEDBACK_RATE_LIMIT_WINDOW_MS =
  (Number(process.env.FEEDBACK_RATE_LIMIT_WINDOW_MINUTES) || 10) * 60 * 1000;
// Signed-in users are identifiable/accountable (real account, bannable), so
// they get a slightly higher ceiling than anonymous IP-keyed requests, whose
// identity is weaker (shared NAT/proxy IPs) and easier to spoof/rotate.
export const FEEDBACK_RATE_LIMIT_MAX_SIGNED_IN =
  Number(process.env.FEEDBACK_RATE_LIMIT_MAX_SIGNED_IN) || 5;
export const FEEDBACK_RATE_LIMIT_MAX_ANONYMOUS =
  Number(process.env.FEEDBACK_RATE_LIMIT_MAX_ANONYMOUS) || 2;
export const FEEDBACK_GLOBAL_MINUTE_MAX =
  Number(process.env.FEEDBACK_GLOBAL_MINUTE_MAX) || 5;
export const FEEDBACK_GLOBAL_HOUR_MAX =
  Number(process.env.FEEDBACK_GLOBAL_HOUR_MAX) || 10;

// /api/app-feedback (general app feedback)
export const APP_FEEDBACK_RATE_LIMIT_WINDOW_MS =
  (Number(process.env.APP_FEEDBACK_RATE_LIMIT_WINDOW_MINUTES) || 60) * 60 * 1000;
export const APP_FEEDBACK_RATE_LIMIT_MAX_PER_IDENTITY =
  Number(process.env.APP_FEEDBACK_RATE_LIMIT_MAX_PER_IDENTITY) || 1;
export const APP_FEEDBACK_GLOBAL_MAX =
  Number(process.env.APP_FEEDBACK_GLOBAL_MAX) || 5;

// /api/friends/add (accepting a friend invite token)
export const FRIENDS_ADD_RATE_LIMIT_WINDOW_MS =
  (Number(process.env.FRIENDS_ADD_RATE_LIMIT_WINDOW_MINUTES) || 60) * 60 * 1000;
export const FRIENDS_ADD_RATE_LIMIT_MAX_PER_IDENTITY =
  Number(process.env.FRIENDS_ADD_RATE_LIMIT_MAX_PER_IDENTITY) || 20;

// /api/propose-question (signed-in users suggesting new questions)
export const PROPOSE_QUESTION_RATE_LIMIT_WINDOW_MS =
  (Number(process.env.PROPOSE_QUESTION_RATE_LIMIT_WINDOW_MINUTES) || 60) * 60 * 1000;
export const PROPOSE_QUESTION_RATE_LIMIT_MAX_PER_IDENTITY =
  Number(process.env.PROPOSE_QUESTION_RATE_LIMIT_MAX_PER_IDENTITY) || 5;

// Repeat-offender ban rules (lib/rateLimit.ts)
export const BAN_VIOLATION_THRESHOLD =
  Number(process.env.BAN_VIOLATION_THRESHOLD) || 3;
export const BAN_VIOLATION_WINDOW_MS =
  (Number(process.env.BAN_VIOLATION_WINDOW_MINUTES) || 60) * 60 * 1000;
export const BAN_DURATION_MS =
  (Number(process.env.BAN_DURATION_HOURS) || 24) * 60 * 60 * 1000;
