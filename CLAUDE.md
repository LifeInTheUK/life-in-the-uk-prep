# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A "Life in the UK" citizenship test practice app: 360-question bank, randomized 24-question sessions (official test length, 75% pass mark), SM-2 spaced repetition to resurface weak questions, and progress stats. Built with Next.js (App Router), React 19, Tailwind v4, next-auth v5 (Google sign-in).

## Git

Never run `git commit` (or push) in this repo unless the user explicitly asks in that exact turn. Leave changes staged/unstaged for the user to commit themselves.

## Commands

- `npm run dev` — start dev server (Next.js dev, Turbopack/webpack)
- `npm run build` — production build (`next build`); use this to check for TS/build errors, there is no separate typecheck/lint script
- `npm run start` — serve the production build

There is no test suite or lint script configured in `package.json` — don't invent `npm test`/`npm run lint` invocations.

`NEXT_PUBLIC_SESSION_SIZE` (set in `.env.development`) overrides the default 24-question session length for faster manual testing during dev.

## Architecture

### Migration in progress

This app was migrated from a static Vite + react-router SPA to Next.js. The migration is tracked as a 4-phase plan in `docs/superpowers/` (gitignored — local-only reference, not committed):
1. Next.js/App Router routing swap (done) — behavior-identical, still `localStorage`-only.
2. `/api/questions` route serving the question bank as JSON (done).
3. Auth.js + Google sign-in, UI/session state only (done).
4. Vercel KV-backed progress/history for signed-in users, replacing `localStorage` in `quiz.ts`/`sm2.ts`/`history.ts` (not yet done).

**Practical implication:** today, all quiz/SM-2/history state is `localStorage`-only regardless of sign-in status. Signing in with Google currently only swaps the header avatar for the user's profile photo — it does not yet persist anything server-side. Don't assume auth gates data persistence until phase 4 lands.

### Route/component split

`app/*/page.tsx` files are thin wrappers that just render a same-named component from `src/` (e.g. `app/test/page.tsx` renders `src/QuizPage.tsx`). This split is a leftover of the Vite→Next.js migration, not a convention to extend arbitrarily — the actual page logic lives in `src/`, `app/` only defines routes:
- `/` → `src/HomePage.tsx`
- `/test` → `src/QuizPage.tsx`
- `/review` → `src/ReviewPage.tsx`
- `/stats` → `src/StatsPage.tsx`
- `app/layout.tsx` wraps everything in `SessionProvider` (next-auth) and `src/Header.tsx` (shared header: logo, sign-in/out, avatar link to `/stats`, contextual back-link/stats-row per route via `usePathname()`).

### The `quiz.ts` imperative DOM bridge

`src/quiz.ts` is **not** a React component — it's a framework-agnostic, imperative engine that manipulates the DOM directly via `document.getElementById`/`querySelectorAll`, with no React state and no cleanup on unmount. `src/QuizPage.tsx` bridges into it with a single `useEffect(() => initQuiz(), [])`, i.e. React just gives it a container to render into once.

This is why `next.config.ts` sets `reactStrictMode: false`: Strict Mode's dev-only double-invoked effects would call `initQuiz()` twice, double-attaching listeners to the same DOM nodes and silently breaking multi-select toggling. Keep this in mind before touching `quiz.ts` or re-enabling strict mode — the two are coupled.

Session state (`sessionQueue`, `firstTryScore`, etc.) lives in module-level variables in `quiz.ts`, not component state, and is persisted to `sessionStorage` (key `ukTestSession`) so an in-progress test survives a page refresh.

### SM-2 spaced repetition (`src/sm2.ts`)

Each question tracks `{ n, ef, i, next, attempts, correct, lastCorrect?, lastSelected? }` in `localStorage` (key `ukTestSm2ById`, keyed by question id). `startSession()` in `quiz.ts` sorts the question bank by `next` (overdue first) then by historical accuracy (weakest first) before slicing to session length — this is the prioritization logic that makes practice sessions adaptive. `getAggregateStats()`/`updateGlobalAccuracy()` derive the global accuracy shown in the header from the same store.

`src/history.ts` separately logs each completed session's score to `localStorage` (key `ukTestHistory`, capped at 50 entries) — this feeds `StatsPage`'s time-series chart, distinct from the per-question SM-2 store.

### Styling

Tailwind v4, wired through `@tailwindcss/postcss` (not the Vite plugin, since Next.js doesn't build with Vite). Design tokens are defined once via `@theme` in `src/style.css` (`--color-accent`, `--color-good`/`--color-bad` + `-soft` variants, etc.) — use these token classes (`bg-accent`, `text-good`, ...) rather than raw Tailwind palette colors, to stay consistent with the rest of the UI.

### Auth

`auth.ts` (repo root) configures next-auth v5 (beta) with the Google provider only; `app/api/auth/[...nextauth]/route.ts` just re-exports its handlers. Env vars: `GOOGLE_ID`, `GOOGLE_SECRET`, `AUTH_SECRET`.
