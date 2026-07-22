# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Keep this file current: after any change that touches architecture, data flow, commands, or conventions described below, update the relevant section in the same turn rather than letting it drift.**

## Project

A "Life in the UK" citizenship test practice app: 1,196-question bank (topic-tagged, browsable/searchable), randomized 24-question sessions (official test length, 75% pass mark), SM-2 spaced repetition to resurface weak questions, and progress stats. Built with Next.js 16 (App Router), React 19, Tailwind v4. Question bank, progress, and history are backed by Neon Postgres; sign-in is Neon Auth (Google, via `@neondatabase/auth`) — see "Neon migration" below for the one open item.

## Git

Never run `git commit` (or push) in this repo unless the user explicitly asks in that exact turn. Leave changes staged/unstaged for the user to commit themselves.

## Commands

- `npm run dev` — start dev server (Next.js dev, Turbopack/webpack)
- `npm run build` — production build (`next build`); use this to check for TS/build errors, there is no separate typecheck/lint script
- `npm run start` — serve the production build
- `node --experimental-strip-types scripts/migrate-questions.ts` — re-seed the Postgres `questions` table from `src/questions.ts` (idempotent upsert); needs `DATABASE_URL` in `.env.local`

There is no test suite or lint script configured in `package.json` — don't invent `npm test`/`npm run lint` invocations. Verify changes via `npm run build` plus manual `curl`/direct-SQL checks. **No Chrome or Playwright browser is available in this dev environment** — visual/click-through browser testing isn't possible here; don't attempt it, fall back to build + curl + SQL verification instead.

`NEXT_PUBLIC_SESSION_SIZE` (in `.env.local`) overrides the default 24-question session length for faster manual testing during dev. All env vars are read through `src/config.ts` — add new ones there rather than calling `process.env.X` directly in other files.

## Architecture

### Neon migration (complete, one open item)

The app was migrated off `localStorage`/static-array/Vercel-KV storage onto Neon Postgres, tracked in `docs/superpowers/plans/2026-07-22-neon-migration.md` (gitignored — local-only reference, not committed). Current state:
- `questions`/`progress`/`history` tables (`db/schema.sql`); `src/db.ts` exports the shared `sql` client (`@neondatabase/serverless`); `questions` table seeded (1,196 rows) from `src/questions.ts` via `scripts/migrate-questions.ts`. `src/questions.ts` is **no longer imported at runtime** — it only exists as the seed source for the migration script.
- `/api/questions`, `src/quiz/loadQuestions.ts`, `src/ReviewPage.tsx`, `app/questions/page.tsx` all read questions from Postgres. `/api/progress`, `/api/history` read/write the Postgres `progress`/`history` tables (see "SM-2" below) — `localStorage` remains the primary client-side store; signed-in users additionally sync to these routes.
- `next-auth` and `@vercel/kv` are fully removed (`auth.ts` deleted, both packages uninstalled). Sign-in runs on `@neondatabase/auth` (Neon Auth, Google provider): `lib/auth/server.ts` (`createNeonAuth()`, reads `NEON_AUTH_BASE_URL`/`NEON_AUTH_COOKIE_SECRET` from `src/config.ts`), `lib/auth/client.ts` (`createAuthClient()`), `app/api/auth/[...path]/route.ts` (`auth.handler()`). Google OAuth credentials are configured in the Neon Console dashboard, not env vars or code.
- Next.js was upgraded 15→16.2.11 as part of this migration (`@neondatabase/auth` hard-requires `next >=16.0.0`).
- `tsconfig.json` excludes `scripts/` from typecheck so `scripts/migrate-questions.ts` can use `.ts` extensions in its relative imports (required for standalone `node --experimental-strip-types` execution) without breaking `next build`.
- **Open, accepted risk:** `@neondatabase/auth` pins `better-auth@1.4.18`, which has a **critical** unpatched CVE bundle (OAuth state-mismatch bypass, account takeover via unverified-email auto-link, stored XSS via `redirect_uri`, refresh-token replay). No 1.4.x patch exists (next release is 1.5.1). Decision made: proceed accepting this as a beta-software limitation, revisit when Neon ships a patched release — don't re-raise this as a blocker unless asked to reassess.

### Route/component split

`app/*/page.tsx` files are thin wrappers that just render a same-named component from `src/` (e.g. `app/test/page.tsx` renders `src/QuizPage.tsx`). The actual page logic lives in `src/`, `app/` only defines routes:
- `/` → `src/HomePage.tsx`
- `/test` → `src/QuizPage.tsx`
- `/review` → `src/ReviewPage.tsx`
- `/profile` → `src/ProfilePage.tsx` (account info, progress stats + chart, self-service account deletion — signed-in only, redirects to `/` if signed out)
- `/questions` → question bank browser (topic-chip filtering + live fuzzy search via `src/SearchBox.tsx`, paginated)
- `app/layout.tsx` renders `src/AuthSync.tsx` (no-UI component that syncs Neon Auth session state into `src/authState.ts` and triggers `pullProgressFromServer()`/`pullHistoryFromServer()` on sign-in) and `src/Header.tsx` (shared header: logo, sign-in/out via `authClient` from `lib/auth/client.ts`, avatar link to `/profile`, contextual back-link/stats-row per route via `usePathname()`). No context provider wrapper needed — Neon Auth's client hooks (`authClient.useSession()`) don't require one.

### The quiz engine (`src/quiz/`)

Fully idiomatic React (rewritten from a legacy imperative DOM-manipulation engine — `reactStrictMode` is enabled, no special coupling to worry about). `src/quiz/useQuizEngine.ts` is a custom hook wrapping a `useReducer` (`src/quiz/reducer.ts`, pure — no I/O) that models session state as `{ phase: "loading"|"active"|"results", sessionQueue, currentQuestion, selectedOptions, currentDisplayOptions, answered, lastResult, ... }`. `src/quiz/QuizContext.tsx`'s `QuizProvider` owns the single `useQuizEngine()` call plus the global keyboard-shortcut listener (digits 1-9 select options, Enter/Space advances); `useQuiz()` reads it from context so presentational components (`QuestionCard`, `OptionsList`, `OptionButton`, `FeedbackPanel`, `ReportModal`, `ResultsScreen`, `NavigationBar`, all in `src/quiz/`) never prop-drill. `src/QuizPage.tsx` is just `<QuizProvider><QuizPageInner/></QuizProvider>` with a `phase` switch.

**Side effects (SM2 saves, `sessionStorage`, `/api/history` POST) are sequenced in the hook's action-creator functions (e.g. `submitAnswer()`, `next()`), never inside the reducer** — the reducer must stay pure since it's exercised by dispatch, while action creators run once per event regardless of Strict Mode. `src/quiz/loadQuestions.ts` keeps the module-level fetch-once cache for `/api/questions` (unchanged behavior); `src/quiz/session.ts` exports `SESSION_STORAGE_KEY` (`"ukTestSession"`, imported by `src/HomePage.tsx` rather than duplicated) plus save/load/clear helpers so an in-progress test survives a page refresh.

A subtle, deliberately-preserved quirk: on answering, `sessionQueue` shifts immediately (and is what gets persisted to `sessionStorage`), but the *displayed* question is `state.currentQuestion`, which stays frozen until `NEXT_REQUESTED` promotes `sessionQueue[0]` into it — so a refresh mid-feedback-screen resumes on the next queued question, not the one just answered. Don't "fix" this without deliberately deciding to change the persisted-session shape.

`src/Header.tsx` renders the quiz session's live total-questions/score, but it's a tree-**ancestor** of `QuizPage` (`app/layout.tsx` wraps `<HeaderStatsProvider><Header>{children}</Header></HeaderStatsProvider>`), so that data can't flow up through normal props. `src/headerStats.tsx`'s `HeaderStatsProvider`/`useHeaderStats()` context (provided above `Header` in `layout.tsx`) solves this cleanly: `useQuizEngine.ts` calls `setTotalQuestions()`/`setScore(current, total, animate)` on the context, and `Header.tsx` reads those values and renders them declaratively — no DOM reaching between components. The one remaining imperative bit is contained entirely inside `Header.tsx` itself: a `useEffect` on its own `scoreRef` calls `animateNumber()` to tween the score display when `animate` is true (matching the original's "only animate on first-try-correct" behavior), otherwise sets `textContent` immediately — the same pattern `src/quiz/ResultsScreen.tsx` uses for its own counter. `src/sm2.ts`'s `updateGlobalAccuracy()` still writes directly into `#global-accuracy` (unchanged, pre-existing, out of scope for this refactor). Confetti (`src/quiz/confetti.ts`) and `src/animateNumber.ts` remain small imperative helpers invoked from `useEffect`s/handlers, by design — not reimplemented in pure React.

### SM-2 spaced repetition (`src/sm2.ts`)

Each question tracks `{ n, ef, i, next, attempts, correct, lastCorrect?, lastSelected? }` in `localStorage` (key `ukTestSm2ById`, keyed by question id). `buildSessionQueue()` in `src/quiz/useQuizEngine.ts` sorts the question bank by `next` (overdue first) then by historical accuracy (weakest first) before slicing to session length — this is the prioritization logic that makes practice sessions adaptive. `getAggregateStats()`/`updateGlobalAccuracy()` derive the global accuracy shown in the header from the same store.

`src/history.ts` separately logs each completed session's score to `localStorage` (key `ukTestHistory`, capped at 50 entries) — this feeds `ProfilePage`'s time-series chart, distinct from the per-question SM-2 store.

`localStorage` is still the primary store regardless of sign-in status — the app always works fully offline/unauthenticated. Signed-in users additionally sync through `/api/progress`/`/api/history`, which read/write the Postgres `progress`/`history` tables (`src/db.ts` + `lib/auth/server.ts`'s `auth.getSession()`). `progress.next`/`history.completed_at` are `BIGINT` columns and come back from `@neondatabase/serverless` as strings — always `Number(...)`-convert them; `history.completed_at` stores the client's own `Date.now()` value verbatim (not a DB-generated timestamp), since `pullHistoryFromServer()` dedupes by exact `timestamp` equality.

### Styling

Tailwind v4, wired through `@tailwindcss/postcss` (not the Vite plugin, since Next.js doesn't build with Vite). Design tokens are defined once via `@theme` in `src/style.css` (`--color-accent`, `--color-good`/`--color-bad` + `-soft` variants, etc.) — use these token classes (`bg-accent`, `text-good`, ...) rather than raw Tailwind palette colors, to stay consistent with the rest of the UI.

### Auth

See "Neon migration" above for the full picture — in short: `lib/auth/server.ts` (`createNeonAuth()`) for server components/API routes via `auth.getSession()`, `lib/auth/client.ts` (`authClient`) for client components via `authClient.useSession()`/`authClient.signIn.social(...)`/`authClient.signOut()`, `app/api/auth/[...path]/route.ts` proxies everything to Neon's auth server. No `middleware.ts` exists and none is needed — every route works fully signed-out.
