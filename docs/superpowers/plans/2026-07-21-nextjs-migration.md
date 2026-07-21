# Next.js Migration (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the app from Vite + React + react-router-dom (static SPA) to Next.js (App Router) on Vercel, with zero behavior change — same UI, same `localStorage`-backed quiz/review/stats logic, no auth, no API routes, no KV yet (those are later phases).

**Architecture:** File-based App Router routes (`app/page.tsx`, `app/test/page.tsx`, `app/review/page.tsx`, `app/stats/page.tsx`) replace `src/App.tsx`'s `<Routes>`. The shared header (`src/Layout.tsx`) is ported to `src/Header.tsx`, a Client Component using `next/navigation`/`next/link` instead of `react-router-dom`, rendered from `app/layout.tsx` around `{children}`. `src/quiz.ts`'s imperative DOM-bridge engine is untouched — it still works identically under a `"use client"` `QuizPage`. `HomePage`/`ReviewPage`/`StatsPage` each read `localStorage`/`sessionStorage` directly in their render body today, which is incompatible with Next's default server-render pass for Client Components (would throw, or cause a hydration mismatch) — each is adapted to read that data inside `useEffect` + `useState` instead, initializing to a safe default so the server-rendered HTML and the client's first render always match.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS v4 (`@tailwindcss/postcss`), TypeScript.

## Global Constraints
- Zero behavior/visual change from the user's perspective — this is a framework swap, not a feature change.
- No test suite exists in this project (verification has always been `npm run build` + manual dev-server checks) — there is no unit-test step to write per task. Most intermediate tasks in this plan are **not independently buildable** (the app only compiles once `app/*.tsx` and the config swap both exist), so each task's "verify" step is a targeted, lightweight check (grep/read the file back), with the real `next build`/`next dev` gate at Task 10.
- Keep `template.html` untouched — unrelated leftover reference file.

---

### Task 1: Swap build tooling (package.json, tsconfig.json, next.config.ts, postcss.config.mjs)

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Delete: `vite.config.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `@/*` path alias (resolves to project root) used by every later task's imports.

- [ ] **Step 1: Replace `package.json`**

```json
{
  "name": "life-in-the-uk-prep",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.7.0"
  }
}
```

Note: `react-router-dom` is dropped entirely (Next.js file-based routing replaces it).

- [ ] **Step 2: Replace `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Create `postcss.config.mjs`**

```js
const config = {
    plugins: {
        "@tailwindcss/postcss": {},
    },
};

export default config;
```

- [ ] **Step 5: Delete `vite.config.ts`**

```bash
rm vite.config.ts
```

- [ ] **Step 6: Update `.gitignore`**

```
node_modules
.next
next-env.d.ts
*.local
```

(Drop `dist` — Next.js doesn't produce it; add `.next` and `next-env.d.ts`, the standard Next.js build artifacts.)

- [ ] **Step 7: Verify files are in place**

```bash
cat package.json | grep '"next"'
cat tsconfig.json | grep '"jsx"'
test -f next.config.ts && test -f postcss.config.mjs && echo "config files present"
test ! -f vite.config.ts && echo "vite.config.ts removed"
```

Expected: all four echo lines print.

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json next.config.ts postcss.config.mjs .gitignore
git rm vite.config.ts
git commit -m "chore: swap Vite tooling for Next.js config"
```

---

### Task 2: Migrate the `VITE_SESSION_SIZE` env var to Next.js convention

**Files:**
- Modify: `src/quiz.ts:6-8`
- Modify: `.env.development`
- Delete: `src/vite-env.d.ts`

**Interfaces:**
- Consumes: none (self-contained).
- Produces: `SESSION_SIZE` constant in `quiz.ts`, unchanged for all other tasks.

Vite exposes client env vars via `import.meta.env.VITE_*`, which doesn't exist in Next.js. Next.js exposes client-visible env vars via `process.env.NEXT_PUBLIC_*`, inlined at build time.

- [ ] **Step 1: Update `src/quiz.ts`**

Find:
```ts
// Official test length is 24 questions; override with VITE_SESSION_SIZE
// (e.g. in .env.development) to use a shorter session while developing.
const SESSION_SIZE = Number(import.meta.env.VITE_SESSION_SIZE) || 24;
```

Replace with:
```ts
// Official test length is 24 questions; override with NEXT_PUBLIC_SESSION_SIZE
// (e.g. in .env.development) to use a shorter session while developing.
const SESSION_SIZE = Number(process.env.NEXT_PUBLIC_SESSION_SIZE) || 24;
```

- [ ] **Step 2: Update `.env.development`**

```
NEXT_PUBLIC_SESSION_SIZE=3
```

- [ ] **Step 3: Delete `src/vite-env.d.ts`**

```bash
rm src/vite-env.d.ts
```

(`process.env.NEXT_PUBLIC_SESSION_SIZE` types as `string | undefined` from `@types/node` automatically — no custom ambient declaration needed.)

- [ ] **Step 4: Verify**

```bash
grep -n "NEXT_PUBLIC_SESSION_SIZE" src/quiz.ts .env.development
test ! -f src/vite-env.d.ts && echo "vite-env.d.ts removed"
```

Expected: both `grep` lines print, `vite-env.d.ts removed` prints.

- [ ] **Step 5: Commit**

```bash
git add src/quiz.ts .env.development
git rm src/vite-env.d.ts
git commit -m "chore: migrate VITE_SESSION_SIZE to NEXT_PUBLIC_SESSION_SIZE"
```

---

### Task 3: Port the shared header to `src/Header.tsx`

**Files:**
- Create: `src/Header.tsx`
- Delete: `src/Layout.tsx`

**Interfaces:**
- Produces: `export default function Header({ children }: { children: ReactNode })` — used by `app/layout.tsx` (Task 4).

`src/Layout.tsx` used `react-router-dom`'s `useLocation()`/`Link`/`<Outlet/>`. The App Router equivalent: `next/navigation`'s `usePathname()`, `next/link`'s `Link` (prop `href` instead of `to`), and a `children` prop instead of `<Outlet/>`.

- [ ] **Step 1: Create `src/Header.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isLanding = pathname === "/";
    const isQuizPage = pathname === "/test";

    return (
        <div className="w-full max-w-xl mx-auto px-4 py-6 sm:py-10 flex flex-col gap-5">
            <div className="order-1 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-2xl font-semibold tracking-tight text-accent"
                >
                    Life in the UK Prep
                </Link>
                <Link
                    href="/stats"
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-dark transition-colors"
                    title="Your progress"
                    aria-label="Your progress"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                </Link>
            </div>

            {children}

            {!isLanding && !isQuizPage && (
                <Link
                    href="/test"
                    className="order-3 sm:order-2 self-start inline-flex items-center gap-2 px-3 py-2 rounded-full border border-line bg-surface text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Back to test
                </Link>
            )}

            {isQuizPage && (
                <div className="order-3 sm:order-2 flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div
                        className="flex flex-col items-center justify-center flex-1 min-w-[84px] rounded-xl bg-surface border border-line py-2"
                        title="Total questions in the bank"
                    >
                        <div
                            className="text-base font-semibold tabular"
                            id="total-questions"
                        >
                            0
                        </div>
                        <div className="text-[11px] text-muted">Bank</div>
                    </div>
                    <Link
                        href="/review"
                        className="flex flex-col items-center justify-center flex-1 min-w-[84px] rounded-xl bg-surface border border-line py-2 hover:border-accent transition-colors"
                        title="Review your correct and incorrect answers"
                    >
                        <div
                            className="text-base font-semibold tabular text-accent"
                            id="global-accuracy"
                        >
                            0%
                        </div>
                        <div className="text-[11px] text-muted">Accuracy</div>
                    </Link>
                    <div
                        className="flex flex-col items-center justify-center flex-1 min-w-[84px] rounded-xl bg-surface border border-line py-2"
                        title="Correct answers this session"
                    >
                        <div className="text-base font-semibold tabular" id="score">
                            0
                        </div>
                        <div className="text-[11px] text-muted">Score</div>
                    </div>
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Delete `src/Layout.tsx`**

```bash
rm src/Layout.tsx
```

- [ ] **Step 3: Verify**

```bash
grep -n "usePathname" src/Header.tsx
grep -n "react-router-dom" src/Header.tsx || echo "no react-router-dom import — correct"
test ! -f src/Layout.tsx && echo "Layout.tsx removed"
```

Expected: `usePathname` line prints, `no react-router-dom import — correct` prints, `Layout.tsx removed` prints.

- [ ] **Step 4: Commit**

```bash
git add src/Header.tsx
git rm src/Layout.tsx
git commit -m "refactor: port Layout to Header.tsx using next/navigation"
```

---

### Task 4: Create the root layout (`app/layout.tsx`)

**Files:**
- Create: `app/layout.tsx`

**Interfaces:**
- Consumes: `Header` from `@/src/Header` (Task 3), `@/src/style.css` (unchanged).
- Produces: the root HTML document + font + metadata for every route.

- [ ] **Step 1: Create `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import Header from "@/src/Header";
import "@/src/style.css";

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "Life in the UK Test Prep",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen text-ink`}>
                <Header>{children}</Header>
            </body>
        </html>
    );
}
```

- [ ] **Step 2: Verify**

```bash
grep -n "next/font/google" app/layout.tsx
grep -n "Header" app/layout.tsx
```

Expected: both lines print.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add Next.js root layout"
```

---

### Task 5: Quiz page (`/test`)

**Files:**
- Modify: `src/QuizPage.tsx` (add `"use client"`)
- Create: `app/test/page.tsx`

**Interfaces:**
- Consumes: `initQuiz` from `./quiz` (unchanged).
- Produces: `/test` route.

`QuizPage` has no direct `localStorage`/`sessionStorage` reads in its render body (all data access happens inside `quiz.ts`'s `initQuiz()`, called from a `useEffect`) — it only needs the `"use client"` directive, no other change.

- [ ] **Step 1: Add `"use client"` to the top of `src/QuizPage.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { initQuiz } from "./quiz";
```

(Only the first line is new — everything else in the file is unchanged.)

- [ ] **Step 2: Create `app/test/page.tsx`**

```tsx
import QuizPage from "@/src/QuizPage";

export default function Page() {
    return <QuizPage />;
}
```

- [ ] **Step 3: Verify**

```bash
head -1 src/QuizPage.tsx
cat app/test/page.tsx
```

Expected: `head` prints `"use client";`, `app/test/page.tsx` shows the wrapper above.

- [ ] **Step 4: Commit**

```bash
git add src/QuizPage.tsx app/test/page.tsx
git commit -m "feat: add /test route for the quiz page"
```

---

### Task 6: Home page (`/`)

**Files:**
- Modify: `src/HomePage.tsx`
- Create: `app/page.tsx`

**Interfaces:**
- Consumes: `questions` from `./questions`, `getAggregateStats` from `./sm2`, `getHistory` from `./history` (all unchanged).
- Produces: `/` route.

`HomePage` reads `sessionStorage`/`localStorage`-backed data directly in its render body today. Under Next.js, Client Components are still rendered once on the server for the initial HTML — `sessionStorage` doesn't exist there, and even guarding it would cause a hydration mismatch if the value differs between server and client. Fix: read it inside `useEffect`, seeded with a safe default so server and client's first render always agree; the real values populate a moment after mount (same "blank flash then populate" timing the old pure-CSR Vite app already had before hydration, so this is not a new user-visible regression).

- [ ] **Step 1: Replace `src/HomePage.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { questions } from "./questions";
import { getAggregateStats } from "./sm2";
import { getHistory } from "./history";

interface HomeStats {
    hasSession: boolean;
    accuracy: number;
    testsCompleted: number;
}

const DEFAULT_STATS: HomeStats = {
    hasSession: false,
    accuracy: 0,
    testsCompleted: 0,
};

export default function HomePage() {
    const [stats, setStats] = useState<HomeStats>(DEFAULT_STATS);

    useEffect(() => {
        const { attempts, correct } = getAggregateStats();
        setStats({
            hasSession: !!sessionStorage.getItem("ukTestSession"),
            accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
            testsCompleted: getHistory().length,
        });
    }, []);

    const { hasSession, accuracy, testsCompleted } = stats;

    return (
        <div className="order-2 sm:order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 py-2 sm:p-7">
            <div>
                <h2 className="text-xl font-semibold mb-1">
                    Ready to practice?
                </h2>
                <p className="text-sm text-muted">
                    Spaced-repetition questions drawn from the official Life in
                    the UK test material.
                </p>
            </div>

            <Link
                href="/test"
                className="w-full bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center"
            >
                {hasSession ? "Continue Test" : "Start Test"}
            </Link>

            <div className="grid grid-cols-3 gap-2 tabular">
                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                    <div className="text-xl font-semibold">
                        {questions.length}
                    </div>
                    <div className="text-[11px] text-muted">Bank</div>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                    <div className="text-xl font-semibold text-accent">
                        {accuracy}%
                    </div>
                    <div className="text-[11px] text-muted">Accuracy</div>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                    <div className="text-xl font-semibold">
                        {testsCompleted}
                    </div>
                    <div className="text-[11px] text-muted">Tests</div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <Link
                    href="/review"
                    className="flex items-center justify-between p-3 rounded-xl border border-line hover:border-accent transition-colors text-sm font-medium"
                >
                    Review answers
                    <svg
                        className="w-4 h-4 text-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </Link>
                <Link
                    href="/stats"
                    className="flex items-center justify-between p-3 rounded-xl border border-line hover:border-accent transition-colors text-sm font-medium"
                >
                    Your progress
                    <svg
                        className="w-4 h-4 text-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </Link>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Create `app/page.tsx`**

```tsx
import HomePage from "@/src/HomePage";

export default function Page() {
    return <HomePage />;
}
```

- [ ] **Step 3: Verify**

```bash
grep -n "useEffect" src/HomePage.tsx
grep -n "next/link" src/HomePage.tsx
grep -n "react-router-dom" src/HomePage.tsx || echo "no react-router-dom import — correct"
```

Expected: first two lines print, third prints the "correct" message.

- [ ] **Step 4: Commit**

```bash
git add src/HomePage.tsx app/page.tsx
git commit -m "feat: add / route for the home page"
```

---

### Task 7: Review page (`/review`)

**Files:**
- Modify: `src/ReviewPage.tsx`
- Create: `app/review/page.tsx`

**Interfaces:**
- Consumes: `questions` from `./questions`, `getSM2` from `./sm2`, `Question`/`SM2Data` from `./types` (all unchanged).
- Produces: `/review` route.

Same SSR/hydration fix as Task 6: `attempted` (which reads `localStorage` via `getSM2` for every question) moves into `useEffect` + `useState`, seeded with an empty array. The default-tab logic ("start on Incorrect unless there are none") is recomputed once the data loads.

- [ ] **Step 1: Replace `src/ReviewPage.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { questions } from "./questions";
import { getSM2 } from "./sm2";
import type { Question, SM2Data } from "./types";

function formatAnswer(o: string[], a: number | number[] | undefined): string {
    if (a === undefined) return "—";
    if (Array.isArray(a)) return a.map((i) => o[i]).join(", ");
    return o[a];
}

interface Attempted {
    question: Question;
    sm2: SM2Data;
}

function ReviewRow({ question, sm2 }: Attempted) {
    const isCorrect = sm2.lastCorrect;
    return (
        <li className="border border-line rounded-xl bg-surface overflow-hidden transition-shadow hover:shadow-md hover:shadow-slate-200/60">
            <details className="group">
                <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-3 min-w-0 min-h-10">
                        <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold flex-shrink-0 ${isCorrect ? "text-good" : "text-bad"}`}
                        >
                            {isCorrect ? "Correct" : "Incorrect"}
                        </span>
                        <span className="text-sm font-medium line-clamp-2">
                            {question.q}
                        </span>
                    </span>
                    <svg
                        className="w-4 h-4 text-muted flex-shrink-0 transition-transform group-open:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </summary>
                <div className="px-4 pb-4 pt-1 border-t border-line">
                    <p className="text-sm font-medium mt-3 mb-2">
                        {question.q}
                    </p>
                    <p className="text-xs text-muted tabular mb-2">
                        {sm2.correct}/{sm2.attempts} correct overall
                    </p>
                    {!isCorrect && (
                        <p className="text-xs text-muted mb-1">
                            Your answer:{" "}
                            <span className="text-bad">
                                {formatAnswer(question.o, sm2.lastSelected)}
                            </span>
                        </p>
                    )}
                    <p className="text-xs text-muted mb-2">
                        Correct answer:{" "}
                        <span className="text-good">
                            {formatAnswer(question.o, question.a)}
                        </span>
                    </p>
                    <p className="text-sm text-muted leading-relaxed">
                        {question.ex}
                    </p>
                </div>
            </details>
        </li>
    );
}

export default function ReviewPage() {
    const [attempted, setAttempted] = useState<Attempted[]>([]);
    const [tab, setTab] = useState<"incorrect" | "correct">("incorrect");

    useEffect(() => {
        const loaded = questions
            .map((question) => ({ question, sm2: getSM2(question.id) }))
            .filter((a) => a.sm2.attempts > 0);
        setAttempted(loaded);
        if (loaded.filter((a) => a.sm2.lastCorrect === false).length === 0) {
            setTab("correct");
        }
    }, []);

    const incorrect = attempted.filter((a) => a.sm2.lastCorrect === false);
    const correct = attempted.filter((a) => a.sm2.lastCorrect === true);
    const shown = tab === "incorrect" ? incorrect : correct;

    return (
        <div className="order-2 sm:order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 py-2 sm:p-7">
            <h2 className="text-lg font-semibold">Review answers</h2>

            {attempted.length === 0 ? (
                <p className="text-sm text-muted">
                    You haven't answered any questions yet — start a test to build
                    up your review list.
                </p>
            ) : (
                <>
                    <div
                        className="flex gap-2 border-b border-line"
                        role="tablist"
                    >
                        <button
                            role="tab"
                            aria-selected={tab === "incorrect"}
                            onClick={() => setTab("incorrect")}
                            className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                                tab === "incorrect"
                                    ? "text-bad border-bad"
                                    : "text-muted border-transparent hover:text-ink"
                            }`}
                        >
                            Incorrect ({incorrect.length})
                        </button>
                        <button
                            role="tab"
                            aria-selected={tab === "correct"}
                            onClick={() => setTab("correct")}
                            className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                                tab === "correct"
                                    ? "text-good border-good"
                                    : "text-muted border-transparent hover:text-ink"
                            }`}
                        >
                            Correct ({correct.length})
                        </button>
                    </div>

                    {shown.length === 0 ? (
                        <p className="text-sm text-muted">
                            Nothing here yet.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-3">
                            {shown.map((a) => (
                                <ReviewRow key={a.question.id} {...a} />
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Create `app/review/page.tsx`**

```tsx
import ReviewPage from "@/src/ReviewPage";

export default function Page() {
    return <ReviewPage />;
}
```

- [ ] **Step 3: Verify**

```bash
grep -n "useEffect" src/ReviewPage.tsx
grep -n "react-router-dom" src/ReviewPage.tsx || echo "no react-router-dom import — correct"
```

Expected: `useEffect` line prints, "correct" message prints.

- [ ] **Step 4: Commit**

```bash
git add src/ReviewPage.tsx app/review/page.tsx
git commit -m "feat: add /review route"
```

---

### Task 8: Stats page (`/stats`)

**Files:**
- Modify: `src/StatsPage.tsx`
- Create: `app/stats/page.tsx`

**Interfaces:**
- Consumes: `getHistory`, `TestResult` from `./history`; `getAggregateStats` from `./sm2` (all unchanged).
- Produces: `/stats` route.

Same SSR/hydration fix again: `history` and the aggregate `{attempts, correct}` move into `useEffect` + `useState`.

- [ ] **Step 1: Replace `src/StatsPage.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { getHistory, type TestResult } from "./history";
import { getAggregateStats } from "./sm2";

const PASS_THRESHOLD = 0.75;

const GRIDLINES = [0, 25, 50, 75, 100];
const CHART_LEFT = 6;
const CHART_RIGHT = 96;
const CHART_TOP = 6;
const CHART_BOTTOM = 34;

function scoreToY(pct: number): number {
    return CHART_BOTTOM - (pct / 100) * (CHART_BOTTOM - CHART_TOP);
}

export default function StatsPage() {
    const [history, setHistory] = useState<TestResult[]>([]);
    const [aggregate, setAggregate] = useState({ attempts: 0, correct: 0 });

    useEffect(() => {
        setHistory(getHistory());
        setAggregate(getAggregateStats());
    }, []);

    const { attempts, correct } = aggregate;
    const overallAccuracy =
        attempts > 0 ? Math.round((correct / attempts) * 100) : 0;

    const scores = history.map((h) => Math.round((h.score / h.total) * 100));
    const best = scores.length > 0 ? Math.max(...scores) : 0;
    const latest = scores.length > 0 ? scores[scores.length - 1] : 0;

    const points = scores.map((pct, i) => ({
        x:
            scores.length > 1
                ? CHART_LEFT + (i / (scores.length - 1)) * (CHART_RIGHT - CHART_LEFT)
                : (CHART_LEFT + CHART_RIGHT) / 2,
        y: scoreToY(pct),
        pct,
        result: history[i],
    }));

    const linePath = points
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
        .join(" ");

    return (
        <div className="order-2 sm:order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 py-2 sm:p-7">
            <h2 className="text-lg font-semibold">Your progress</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 tabular">
                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                    <div className="text-xl font-semibold">{history.length}</div>
                    <div className="text-[11px] text-muted">Tests taken</div>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                    <div className="text-xl font-semibold">{overallAccuracy}%</div>
                    <div className="text-[11px] text-muted">Overall accuracy</div>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                    <div className="text-xl font-semibold text-good">{best}%</div>
                    <div className="text-[11px] text-muted">Best score</div>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                    <div className="text-xl font-semibold">{latest}%</div>
                    <div className="text-[11px] text-muted">Latest score</div>
                </div>
            </div>

            {points.length === 0 ? (
                <p className="text-sm text-muted">
                    Complete a test to see your progress here.
                </p>
            ) : (
                <div>
                    <svg
                        viewBox="0 0 100 40"
                        className="w-full h-48"
                        preserveAspectRatio="none"
                        role="img"
                        aria-label="Score percentage over completed tests"
                    >
                        {GRIDLINES.map((pct) => (
                            <line
                                key={pct}
                                x1={CHART_LEFT}
                                x2={CHART_RIGHT}
                                y1={scoreToY(pct)}
                                y2={scoreToY(pct)}
                                stroke="currentColor"
                                className="text-line"
                                strokeWidth="0.3"
                                vectorEffect="non-scaling-stroke"
                            />
                        ))}

                        <path
                            d={linePath}
                            fill="none"
                            stroke="currentColor"
                            className="text-accent"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                        />

                        {points.map((p, i) => (
                            <circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r="1.6"
                                className={p.pct / 100 >= PASS_THRESHOLD ? "fill-good" : "fill-bad"}
                            >
                                <title>
                                    Test {i + 1}: {p.pct}% on{" "}
                                    {new Date(p.result.timestamp).toLocaleDateString()}
                                </title>
                            </circle>
                        ))}

                        {points.length > 0 && (
                            <text
                                x={points[points.length - 1].x}
                                y={points[points.length - 1].y - 3}
                                textAnchor="end"
                                fontSize="4"
                                className="fill-ink font-medium"
                            >
                                {points[points.length - 1].pct}%
                            </text>
                        )}
                    </svg>
                    <p className="text-xs text-muted mt-2">
                        Each point is one completed test.{" "}
                        <span className="text-good font-medium">Green</span> = passed
                        (≥75%), <span className="text-bad font-medium">red</span> =
                        below.
                    </p>
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Create `app/stats/page.tsx`**

```tsx
import StatsPage from "@/src/StatsPage";

export default function Page() {
    return <StatsPage />;
}
```

- [ ] **Step 3: Verify**

```bash
grep -n "useEffect" src/StatsPage.tsx
grep -n "type TestResult" src/StatsPage.tsx
```

Expected: both lines print.

- [ ] **Step 4: Commit**

```bash
git add src/StatsPage.tsx app/stats/page.tsx
git commit -m "feat: add /stats route"
```

---

### Task 9: Remove obsolete Vite/react-router files

**Files:**
- Delete: `index.html`
- Delete: `src/main.tsx`
- Delete: `src/App.tsx`
- Delete: `vercel.json`

**Interfaces:**
- Consumes: nothing (cleanup only — all four are fully superseded by Tasks 1–8).
- Produces: nothing new.

`vercel.json`'s `framework: "vite"` / `outputDirectory: "dist"` / SPA `rewrites` are all Vite-specific and would be actively wrong for a Next.js project — Vercel auto-detects and configures Next.js with zero config, so the file is deleted rather than rewritten.

- [ ] **Step 1: Delete the files**

```bash
rm index.html src/main.tsx src/App.tsx vercel.json
```

- [ ] **Step 2: Verify**

```bash
test ! -f index.html && test ! -f src/main.tsx && test ! -f src/App.tsx && test ! -f vercel.json && echo "all four removed"
```

Expected: `all four removed` prints.

- [ ] **Step 3: Commit**

```bash
git rm index.html src/main.tsx src/App.tsx vercel.json
git commit -m "chore: remove obsolete Vite/react-router-dom files"
```

---

### Task 10: Install dependencies and verify the full build

**Files:** none (verification only)

**Interfaces:** none — this is the final gate proving Tasks 1–9 fit together.

- [ ] **Step 1: Install dependencies**

```bash
rm -rf node_modules package-lock.json
npm install
```

Expected: install completes with no errors. (`react-router-dom` should no longer appear: `ls node_modules | grep react-router` should print nothing.)

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: `next build` completes successfully, reporting all four routes (`/`, `/test`, `/review`, `/stats`) in its route summary, no TypeScript errors. This step also auto-generates `next-env.d.ts` (gitignored, per Task 1) — no manual step needed for it.

- [ ] **Step 3: Dev server smoke test**

```bash
npm run dev &
sleep 3
curl -s http://localhost:3000/ | grep -o "Life in the UK Prep"
curl -s http://localhost:3000/test | grep -o "Life in the UK Prep"
curl -s http://localhost:3000/review | grep -o "Life in the UK Prep"
curl -s http://localhost:3000/stats | grep -o "Life in the UK Prep"
kill %1
```

Expected: `Life in the UK Prep` prints for all four `curl` calls (confirms the header renders on every route).

- [ ] **Step 4: Manual behavior-parity check**

With `npm run dev` running, in a browser:
- `/` shows the CTA ("Start Test" initially), Bank/Accuracy/Tests tiles, Review/Progress links.
- `/test`: answer a mix of single- and multi-select questions with the `1`-`9` keys and mouse, confirm `Enter` advances/checks, confirm the Bank/Accuracy/Score row only shows here.
- Refresh mid-test on `/test` — confirm the session restores (via `sessionStorage`).
- `/review` and `/stats` show data after completing a test; the back-button (only on these two routes) returns to `/test`; clicking the header title returns to `/`.

- [ ] **Step 5: Commit the lockfile**

```bash
git add package-lock.json
git commit -m "chore: regenerate package-lock.json for Next.js dependencies"
```
