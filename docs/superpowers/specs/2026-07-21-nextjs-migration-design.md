# Phase 1: Migrate to Next.js (App Router)

## Context
This is phase 1 of a 4-phase plan to move the app from a static Vite + React + react-router-dom SPA to Next.js on Vercel with backend-persisted user data:

1. **Next.js migration** (this doc) — swap the build/routing only, behavior identical, no backend yet.
2. `/api/questions` route — serve the question bank from an API.
3. Auth.js + Google sign-in — login/logout UI and session state, still no persistence change.
4. Vercel KV + progress/history APIs + storage-adapter swap in `quiz.ts`/`sm2.ts`/`history.ts` for signed-in users.

This doc specs phase 1 only. Goal: the app runs on Next.js App Router, deployed to Vercel via the Next.js framework preset, with **zero behavior change** — same UI, same `localStorage`-backed quiz/review/stats/progress logic, no auth, no API routes, no KV.

## Non-goals (deferred to later phases)
- No API routes for questions or progress.
- No authentication.
- No change to `sm2.ts`, `history.ts`, `quiz.ts`'s data logic — these are pure/DOM-only modules, framework-agnostic, and move over unchanged.

## Architecture

### Routing
File-based App Router routes replace `src/App.tsx`'s `<Routes>`:
- `app/page.tsx` → renders `HomePage`
- `app/test/page.tsx` → renders `QuizPage`
- `app/review/page.tsx` → renders `ReviewPage`
- `app/stats/page.tsx` → renders `StatsPage`
- `app/layout.tsx` → root layout (`<html>`/`<body>`, Google Font via `next/font`, page `metadata`), renders the shared header (today's `src/Layout.tsx`) around `{children}`.

`src/Layout.tsx` is ported to a `"use client"` component (it needs the current pathname to gate the back button/stats row and highlight nav state) — `react-router-dom`'s `useLocation()` → `next/navigation`'s `usePathname()`, and its `Link`s → `next/link`'s `Link`. Same JSX, same gating logic (`isLanding`/`isQuizPage`), just swapped imports.

### The `quiz.ts` DOM bridge
`QuizPage`'s `useEffect(() => initQuiz(), [])` bridge into `quiz.ts`'s imperative `document.getElementById`-based engine works identically under Next.js — client components render real DOM nodes the same way Vite's React did. `QuizPage` (and any component using state/effects/browser APIs — `HomePage`, `ReviewPage`, `StatsPage`, `Layout`) needs the `"use client"` directive, since App Router defaults to Server Components.

### Styling
Tailwind v4 switches from the `@tailwindcss/vite` plugin to the `@tailwindcss/postcss` plugin (Next.js builds with webpack/Turbopack, not Vite). `src/style.css`'s `@theme` token block and custom rules are unchanged — only the plugin wiring changes (`postcss.config.mjs` instead of `vite.config.ts`).

### Files removed
`index.html`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx` — no longer needed; Next.js's `app/layout.tsx` + file-based routes replace all four.

### Files added
`app/layout.tsx`, `app/page.tsx`, `app/test/page.tsx`, `app/review/page.tsx`, `app/stats/page.tsx`, `next.config.ts` (minimal), `postcss.config.mjs`.

### Files unchanged (pure logic/data, framework-agnostic)
`src/quiz.ts`, `src/sm2.ts`, `src/history.ts`, `src/questions.ts`, `src/types.ts`, `src/style.css`, `src/HomePage.tsx`, `src/QuizPage.tsx`, `src/ReviewPage.tsx`, `src/StatsPage.tsx` (content), `src/Layout.tsx` (content, only its router imports change).

### Deployment
`vercel.json`'s manual `framework: "vite"` / `outputDirectory` / SPA `rewrites` are no longer needed — Vercel auto-detects Next.js and handles routing natively. The file is deleted (or trimmed to empty if Vercel requires it present — to be confirmed during implementation).

### `template.html`
Untouched leftover reference file from the original prototype extraction; unrelated to this migration, left in place.

## Testing/verification
1. `npm run build` (`next build`) — clean, no TS/build errors.
2. `npm run dev` (`next dev`) — all four routes (`/`, `/test`, `/review`, `/stats`) render.
3. Manually re-verify behavior parity: keyboard shortcuts (`1`-`9`, Enter), session restore (`sessionStorage`) across a page refresh mid-test, the back-button/avatar/stats-row header gating per route, SM-2 scheduling and localStorage keys (`ukTestSm2ById`, `ukTestHistory`, `ukTestSession`) all unchanged.
4. No visual regression — same Tailwind classes, same components, just re-hosted.
