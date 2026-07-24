# Stale app version banner — subagent-driven execution ledger

Plan: docs/superpowers/plans/2026-07-23-stale-app-version-banner.md
Mode: no worktree (working directly on `main`, per user instruction — small/low-risk 3-task feature)
Commit policy: DO NOT commit. Leave all changes staged/unstaged. User commits everything themselves later (per CLAUDE.md, overrides skill's default per-task commit).

## Tasks
Task 1: complete (uncommitted/staged; src/config.ts VERCEL_GIT_COMMIT_SHA export + app/api/version/route.ts; build + curl verified; review clean, spec ✅, quality approved).
Task 2: complete (uncommitted/staged; src/UpdateBanner.tsx created, mounted inside QuizProvider in app/layout.tsx alongside AuthSync; build verified; review clean, spec ✅, quality approved, no findings).
Task 3: complete (uncommitted/staged; e2e/public/update-banner.spec.ts added; e2e correctly caught 2 real bugs in Task 2's UpdateBanner.tsx not visible in isolated review: (A) mid-quiz suppression only prevented newly-setting staleSha during "active", never cleared an already-set one from the earlier "loading" phase; (B) #update-banner and #cookie-banner both fixed bottom-0/z-50, colliding/intercepting clicks in a fresh unconsented context. Controller fixed both directly in UpdateBanner.tsx: render guard now gates on state.phase==="active" unconditionally (not just the check), and added !hasConsented guard (useCookieConsent) deferring to CookieBanner until consent resolved. First review round flagged test 2 as a false-negative-proof pass (consent gate alone hid the banner, not exercising the phase guard) — fixed by seeding consent in test 2 too. Re-review clean, approved. Full suite: 11/11 passing.
ALL 3 PLAN TASKS COMPLETE.

## Final whole-branch review
Dispatched on opus. Verdict: No, needs fixes — one Important finding (app/api/version/route.ts had no Cache-Control header; a heuristically-cached response on a backgrounded mobile tab could silently defeat the exact stale-detection scenario the feature exists for). Fixed directly: added Cache-Control: no-store + export const dynamic = "force-dynamic", verified live via curl (confirmed header present). Also addressed two Minor findings: added the spec-mandated third e2e test (clicking Refresh actually reloads the page, verified via a window marker that only survives SPA nav, not a full reload) and corrected a misleading comment in src/config.ts ("read fresh per request" -> accurate wording about reflecting the live deployment). Did not address the "never-consented users never see the banner" minor (accepted tradeoff, correctly not flagged as blocking) or the redundant-refetch-on-every-focus minor (pre-existing to Task 2, low value). Build + full e2e suite (12/12) re-verified clean after fixes.
ALL WORK COMPLETE. Nothing committed (per user instruction — user commits everything themselves). Files touched: src/config.ts, app/api/version/route.ts, src/UpdateBanner.tsx, app/layout.tsx, e2e/public/update-banner.spec.ts — all staged only.

---

# Feedback "Other" category — subagent-driven execution ledger

Plan: docs/superpowers/plans/2026-07-23-feedback-other-category.md
Mode: no worktree (working directly on `main`, per user instruction — small/low-risk 4-task feature)
Commit policy: DO NOT commit. Leave all changes staged/unstaged. User commits everything themselves later (per CLAUDE.md, overrides skill's default per-task commit).

## Tasks
Task 1: complete (uncommitted/staged; db/schema.sql + scripts/migrate-feedback-columns.ts; migrated live dev DB, columns+indexes verified; build verified; review clean, spec ✅, quality approved).
Task 2: complete (uncommitted/staged; app/api/feedback/route.ts rewritten: category/details validation, control-char sanitization, rate limiting; live curl verification of validation + storage passed. First review round (security-focused) found one Important issue: rate limit was SELECT-COUNT-then-INSERT, racy under concurrent bursts (plan-mandated code, not implementer error) — presented to user, chose "fix now." Controller replaced with a dedicated feedback_rate_limits table + atomic UPSERT counter (fixed 10-min window, ON CONFLICT DO UPDATE relies on Postgres row-locking to genuinely serialize concurrent same-key requests), added scripts/migrate-feedback-rate-limit-table.ts (drops old sliding-window indexes, creates new table), updated db/schema.sql. Verified live with a real 20-concurrent-request burst via curl+shell background jobs: exactly 5 succeeded, 15 got 429 — confirms the fix holds under actual concurrency, not just reasoning. Re-review clean, approved (two Minor notes accepted as-is: fixed-window boundary-burst characteristic, no TTL cleanup on the rate-limit table — both negligible for this app's risk profile). Build clean throughout.
Task 3: complete (uncommitted/staged; src/feedback.ts FeedbackCategory + SubmitFeedbackResult, src/quiz/ReportModal.tsx Other category + textarea + 429 messaging; build verified; grep-confirmed ReportModal.tsx is submitFeedback's only caller, no other breakage from the return-type change. Review clean on the diff itself (spec ✅, quality approved) — but flagged a process defect: task-3-report.md filename collided with the earlier stale-banner plan's own task-3-report.md (both plans reused the same ledger filenames without a plan-specific namespace), so the report content was stale/wrong-task, not describing this work. Not a code issue; noted for future plans to use plan-prefixed report filenames.
Task 4: complete (uncommitted/staged; e2e/public/report-modal.spec.ts added; 14/14 full suite passing, controller independently re-confirmed. Review verified every selector against real component markup (OptionsList.tsx, FeedbackPanel.tsx, ReportModal.tsx) — no vacuous assertions, correctly handles both single/multi-select randomized session shapes. Review clean, approved.
ALL 4 PLAN TASKS COMPLETE.

## Final whole-branch review
Dispatched on opus. Verdict: Yes, ready to merge — the mid-plan rate-limit redesign confirmed a strict improvement over the plan's original spec, correctly implemented, verified under real concurrency. No Critical/Important findings. Three Minor notes: (1) feedback_rate_limits has no cleanup/TTL, accepted as fine at this app's scale; (2) migrate-feedback-columns.ts creates indexes the next script immediately drops — addressed directly by adding a one-line forward-pointer comment; (3) newlines preserved in Telegram details text is cosmetic only (no parse_mode, no real injection risk) — accepted as-is. CLAUDE.md updated with a new "Question feedback / reporting" section. Build + full e2e suite (14/14) re-verified clean after the final tweaks.
ALL WORK COMPLETE. Nothing committed (per user instruction — user commits everything themselves). Files touched: db/schema.sql, scripts/migrate-feedback-columns.ts, scripts/migrate-feedback-rate-limit-table.ts (new), app/api/feedback/route.ts, src/feedback.ts, src/quiz/ReportModal.tsx, e2e/public/report-modal.spec.ts (new), CLAUDE.md — all staged only.

---

# General app feedback — subagent-driven execution ledger

Plan: docs/superpowers/plans/2026-07-23-general-app-feedback.md
Mode: no worktree (working directly on `main`, per user instruction — small/low-risk 6-task feature)
Commit policy: DO NOT commit. Leave all changes staged/unstaged. User commits everything themselves later (per CLAUDE.md, overrides skill's default per-task commit).
Note: using gaf-task-N-brief/report.md filenames this time (plan-prefixed) to avoid the task-3-report.md filename collision incident from the prior two plans in this session.

## Tasks
Task 1: complete (uncommitted/staged; lib/rateLimit.ts created (getClientIp/incrementRateLimit), app/api/feedback/route.ts updated to import from it; build + curl + full 14-spec e2e suite verified; review clean, spec ✅ byte-identical extraction, quality approved).
Task 2: complete (uncommitted/staged; db/schema.sql + scripts/migrate-app-feedback-schema.ts; migrated live dev DB, controller independently confirmed both tables exist via information_schema; review clean, spec ✅, quality approved).
Task 3: complete (uncommitted/staged; app/api/captcha/route.ts + app/api/app-feedback/route.ts; 7 live curl verification steps passed incl. CAPTCHA single-use proof, replay rejection, wrong-answer rejection, per-identity 1/hr rate limit; security-focused review confirmed injection-safe (all sql tagged-template), unconditional single-use CAPTCHA deletion on every path, appfb: namespace genuinely non-colliding with question-report flow's rate-limit keys, unconditional counter increments. One Important note (unhandled request.json() parse failure -> 500) confirmed pre-existing pattern shared with app/api/feedback/route.ts, not a regression, accepted as-is. Review clean, approved.
Task 4: complete (uncommitted/staged; src/appFeedback.ts created; build verified; review independently cross-checked against actual route contracts (not just brief assumptions), confirmed correct response mapping and sound error handling; review clean, spec ✅, quality approved).
Task 5: complete (uncommitted/staged; src/AppFeedbackModal.tsx created, src/HomePage.tsx +12/-0 lines only (import+useState+button+conditional modal, no scope creep in this shared file — checked explicitly given a prior-plan incident); build + curl-based smoke check verified (browser tools unavailable per CLAUDE.md) incl. captcha load, successful submission, 1hr rate-limit trigger; review clean, spec ✅, quality approved. One Minor accepted as-is (no retry UI if initial captcha fetch fails — inherited from spec's own code, not a task defect).
Task 6: complete (uncommitted/staged; e2e/public/app-feedback.spec.ts added; 16/16 full suite passing, controller independently re-confirmed. Review verified selectors against real component markup, confirmed neither test hits real API/DB. Review clean, approved.
ALL 6 PLAN TASKS COMPLETE.

## Final whole-branch review
Dispatched on opus. Verdict: Yes, ready to merge — all four load-bearing requirements verified against actual sibling-route code: single-use CAPTCHA (delete-on-every-outcome), appfb: namespace genuinely non-colliding with question-report rate-limit keys, reject-not-truncate validation parity, zero-behavior-change Task 1 refactor. One Important finding: captcha_challenges grows unboundedly via the deliberately-ungated GET /api/captcha endpoint — worse than the already-accepted feedback_rate_limits growth tradeoff since this write path has no rate limit at all. Fixed directly: GET /api/captcha now piggybacks an opportunistic DELETE FROM captcha_challenges WHERE expires_at < now sweep on every issue. Verified live: inserted a fake expired row, confirmed it was swept by the next GET /api/captcha call. Minor findings accepted as-is (malformed-JSON 500 pre-existing pattern shared with sibling route; CAPTCHA not auto-reloaded on rate_limited/other outcomes, only captcha_invalid; e2e doesn't cover captcha_invalid/rate_limited UI branches, covered by extensive manual curl proof instead). CLAUDE.md updated with new "General app feedback" section + noted lib/rateLimit.ts extraction in the existing question-feedback section. Build + full e2e suite (16/16) re-verified clean after the final fix.
ALL WORK COMPLETE. Nothing committed (per user instruction — user commits everything themselves). Files touched: lib/rateLimit.ts (new), app/api/feedback/route.ts, db/schema.sql, scripts/migrate-app-feedback-schema.ts (new), app/api/captcha/route.ts (new), app/api/app-feedback/route.ts (new), src/appFeedback.ts (new), src/AppFeedbackModal.tsx (new), src/HomePage.tsx, e2e/public/app-feedback.spec.ts (new), CLAUDE.md — all staged only.

---

# Repeat-offender 24h ban — subagent-driven execution ledger

Plan: docs/superpowers/plans/2026-07-24-repeat-offender-ban.md
Mode: no worktree (working directly on `main`, per user instruction — small/low-risk 4-task feature)
Commit policy: DO NOT commit. Leave all changes staged/unstaged. User commits everything themselves later (per CLAUDE.md, overrides skill's default per-task commit).
Note: using rob-task-N-brief/report.md filenames (plan-prefixed) to avoid filename collisions with the two prior plans in this session.

## Tasks
Task 1: complete (uncommitted/staged; db/schema.sql + scripts/migrate-identity-bans-schema.ts; migrated live dev DB, controller independently confirmed both tables exist; review clean, spec ✅, quality approved).
Task 2: complete (uncommitted/staged; lib/rateLimit.ts +checkBanned/recordViolationAndMaybeBan appended, getClientIp/incrementRateLimit untouched; build verified; review clean, spec ✅, quality approved, correct window/threshold/upsert logic confirmed).
Task 3: complete (uncommitted/staged; app/api/feedback/route.ts ban check + violation hook, src/feedback.ts 403->rateLimited mapping; correctly adapted to file's actual state after an unrelated manual edit (IS_PRODUCTION Telegram gate, Prettier reformatting) without reverting it. Extensive live curl verification (normal request, 3-violations-then-ban sequence, ban confirmation) + full 17-spec e2e suite passed, test data cleaned up. Security-focused review confirmed ban check genuinely runs first (before validation/counters/writes), violation logging fires only on per-identity rejection never global-only, 403->rateLimited mapping correct and catch-block fallback preserved. Review clean, approved.
Task 4: complete (uncommitted/staged; app/api/app-feedback/route.ts ban check + violation hook using raw unprefixed identity (correctly kept separate from the appfb:-prefixed rate-limit key), src/appFeedback.ts 403->rate_limited mapping; adapted to file's post-manual-edit state (IS_PRODUCTION gate, reformatting) without touching it. Extensive live curl verification incl. cross-endpoint independence check + full 17-spec e2e suite passed, controller independently re-confirmed build+e2e. Security-focused review confirmed the raw-vs-prefixed key distinction (the most likely bug) was handled correctly, ban-check-first ordering correct, violation-only-on-identity-limit correct. Review clean, approved.
ALL 4 PLAN TASKS COMPLETE.

---

# Env-configurable rate limits / ban rules — subagent-driven execution ledger

Plan: docs/superpowers/plans/2026-07-24-configurable-rate-limits.md
Mode: no worktree (working directly on `main`, per user instruction — small/low-risk 4-task feature)
Commit policy: DO NOT commit. Leave all changes staged/unstaged. User commits everything themselves later (per CLAUDE.md, overrides skill's default per-task commit).
Note: using crl-task-N-brief/report.md filenames (plan-prefixed) to avoid filename collisions with prior plans in this session.

## Tasks
Task 1: complete (uncommitted/staged; src/config.ts +11 rate-limit/ban env exports, .env.example documented; build verified. Review flagged IS_PRODUCTION as an undisclosed 12th export — controller verified false positive via earlier saved rob-task-3/4-review.diff files showing IS_PRODUCTION already existed pre-task (from an earlier unrelated manual edit); reviewer compared against stale HEAD (nothing committed all session) instead of actual pre-task state, same diff-methodology pitfall as an earlier session incident. Overruled, task approved as-is.
Task 2: complete (uncommitted/staged; app/api/feedback/route.ts wired to FEEDBACK_* config exports, all POST usage sites renamed, global window durations correctly left hardcoded; src/config.ts comment moved to correct location. Implemented while safety classifier was temporarily unavailable -- controller did extra independent verification (build, 17/17 e2e, .env.local clean, DB clean) before review. Review clean, spec ✅, quality approved.
Task 3: complete (uncommitted/staged; app/api/app-feedback/route.ts wired to APP_FEEDBACK_* config exports, GLOBAL_KEY correctly left hardcoded, all 5 usage sites renamed. Controller independently re-verified build, 17/17 e2e, .env.local clean. Review clean, spec ✅, quality approved.
Task 4: complete (uncommitted/staged; lib/rateLimit.ts wired to BAN_* config exports, getClientIp/incrementRateLimit/checkBanned untouched. Controller independently re-verified build, 17/17 e2e, .env.local clean, DB clean (all 4 tables 0 rows). Review clean, spec ✅, quality approved. Controller fixed one Minor cosmetic finding directly (stale hardcoded-sounding comment on recordViolationAndMaybeBan, updated to reference the config constant names). Build re-verified after fix.
ALL 4 PLAN TASKS COMPLETE.

## Final whole-branch review
Dispatched on opus. Verdict: Yes, ready to merge — all 11 config exports verified to reproduce their prior hardcoded values exactly (correct unit conversions), no defined-but-unused exports, no leftover un-migrated hardcoded constants beyond the intentionally-excluded ones (global window durations, MAX_DETAILS_LENGTH). No Critical/Important findings. Three Minor notes accepted as-is: (1) app-feedback's single shared window constant vs its "__global_hour__" key name is a pre-existing structural coupling, not introduced by this feature; (2) the `|| default` falsy-zero quirk (env var set to "0" falls back to default, can't actually configure a zero limit) matches existing SESSION_SIZE behavior, not new risk; (3) only 3 of 11 values got a live override proof across the four tasks (one per consuming file) — reasonable given all are identical-structure identifier swaps. CLAUDE.md updated with a new "Repeat-offender ban + configurable rate limits" section covering both this plan and the earlier (undocumented until now) ban feature. Build + full e2e suite (17/17) re-verified clean.
ALL WORK COMPLETE. Nothing committed (per user instruction — user commits everything themselves). Files touched: src/config.ts, .env.example, app/api/feedback/route.ts, app/api/app-feedback/route.ts, lib/rateLimit.ts, CLAUDE.md — all staged only.
