"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";

export default function Header({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isQuizPage = pathname === "/test";
  const { data: session } = useSession();

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 sm:py-10 flex flex-col gap-5">
      <div className="order-1 flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-semibold tracking-tight text-accent"
        >
          Life in the UK Prep
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session?.user ? (
            <button
              onClick={() => signOut()}
              className="text-xs font-medium text-muted hover:text-ink transition-colors"
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="text-xs font-medium text-muted hover:text-ink transition-colors"
            >
              Sign in
            </button>
          )}
          <Link
            href="/stats"
            className="shrink-0 w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-dark transition-colors overflow-hidden"
            title="Your progress"
            aria-label="Your progress"
          >
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
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
            )}
          </Link>
        </div>
      </div>

      {children}

      {!isLanding && !isQuizPage && (
        <Link
          href="/test"
          className="order-2 self-start inline-flex items-center gap-2 px-3 py-2 rounded-full border border-line bg-surface text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors"
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
        <div className="order-2 flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Link
            href="/questions"
            className="flex flex-col items-center justify-center flex-1 min-w-21 rounded-xl bg-surface border border-line py-2 hover:border-accent transition-colors"
          >
            <div
              className="text-base font-semibold tabular text-accent"
              id="total-questions"
            >
              0
            </div>
            <div className="text-[11px] text-muted">Question Bank</div>
          </Link>

          <Link
            href="/review"
            className="flex flex-col items-center justify-center flex-1 min-w-21 rounded-xl bg-surface border border-line py-2 hover:border-accent transition-colors"
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
            className="flex flex-col items-center justify-center flex-1 min-w-21 rounded-xl bg-surface border border-line py-2"
            title="Correct answers this session"
          >
            <div className="text-base font-semibold tabular" id="score">
              0
            </div>
            <div className="text-[11px] text-muted">Score</div>
          </div>
        </div>
      )}

      <div className="order-4 flex justify-center gap-4 text-[11px] text-muted">
        <Link href="/privacy" className="hover:text-ink transition-colors">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-ink transition-colors">
          Terms and Conditions
        </Link>
      </div>
    </div>
  );
}
