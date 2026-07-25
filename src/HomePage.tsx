"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { useProgress } from "./progressContext";
import { useHistoryState } from "./historyContext";
import { useQuiz } from "./quiz/QuizContext";
import SignInNudge from "./SignInNudge";
import Skeleton from "./Skeleton";

const AppFeedbackModal = dynamic(() => import("./AppFeedbackModal"), { ssr: false });

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { aggregate } = useProgress();
  const { history } = useHistoryState();
  const { state: quizState, restart } = useQuiz();
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [averageAccuracy, setAverageAccuracy] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const hasSession = quizState.phase === "active";

  async function startNewTest() {
    await restart();
    router.push("/test");
  }

  const { attempts, correct } = aggregate;
  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
  const testsCompleted = history.length;
  const hasAttempts = attempts > 0;

  useEffect(() => {
    fetch("/api/questions/count")
      .then((res) => res.json())
      .then((data: { count: number }) => setQuestionCount(data.count));

    fetch(
      attempts > 0
        ? `/api/stats/global?accuracy=${accuracy}`
        : "/api/stats/global",
    )
      .then((res) => res.json())
      .then((data: { totalUsers: number; averageAccuracy: number }) => {
        setTotalUsers(data.totalUsers);
        if (attempts > 0 && data.totalUsers > 0) {
          setAverageAccuracy(data.averageAccuracy);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasTests = testsCompleted > 0;
  const delta = averageAccuracy !== null ? accuracy - averageAccuracy : null;

  return (
    <div className="order-2 sm:order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
      <div>
        {totalUsers !== null && totalUsers > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent/10 rounded-full px-3 py-1 mb-3">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-1.13a4 4 0 100-8 4 4 0 000 8zm7 0a4 4 0 10-3-6.65"
              />
            </svg>
            Joined by {totalUsers.toLocaleString()}{" "}
            {totalUsers === 1 ? "person" : "people"} preparing for their test
          </span>
        )}
        <h2 className="text-xl font-semibold mb-1">
          Prepare for the Life in the UK Test
        </h2>
        <p className="text-sm text-muted">
          Free practice questions covering UK history, culture, government and
          traditions — with spaced repetition to help you focus on what you
          don't know yet.
        </p>
      </div>

      <a
        href="https://buymeacoffee.com/andrewsonn5"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-3 p-4 rounded-xl border border-line bg-surface hover:border-accent transition-colors"
      >
        <div>
          <p className="text-sm font-medium">Enjoying the app?</p>
          <p className="text-xs text-muted">
            Buy me a coffee to help keep it free and ad-free.
          </p>
        </div>
        <img
          src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
          alt="Buy Me A Coffee"
          className="h-9 shrink-0"
        />
      </a>

      {hasSession ? (
        <Link
          href="/test"
          className="w-full bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center"
        >
          Continue Test
        </Link>
      ) : (
        <button
          type="button"
          onClick={startNewTest}
          className="w-full bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center"
        >
          Start Test
        </button>
      )}

      {hasSession && (
        <button
          onClick={startNewTest}
          className="w-full bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-medium text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center"
        >
          Start New Test
        </button>
      )}

      <div className="grid grid-cols-3 gap-2 tabular">
        <Link
          href="/questions"
          className="rounded-xl border border-line bg-surface p-3 text-center hover:border-accent transition-colors"
        >
          <div className="text-xl font-semibold tabular text-accent">
            {questionCount === null ? (
              <Skeleton className="h-6 w-8 mx-auto" />
            ) : (
              questionCount
            )}
          </div>
          <div className="text-[11px] text-muted">Question Bank</div>
        </Link>
        <div className="rounded-xl border border-line bg-surface p-3 text-center">
          <div className="text-xl font-semibold">{accuracy}%</div>
          <div className="text-[11px] text-muted">Accuracy</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3 text-center">
          <div className="text-xl font-semibold">{testsCompleted}</div>
          <div className="text-[11px] text-muted">Tests</div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {hasAttempts && (
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
        )}
        {hasAttempts && (
          <Link
            href="/stats"
            className="flex items-center justify-between p-3 rounded-xl border border-line hover:border-accent transition-colors text-sm font-medium"
          >
            <span>
              Your stats
              {delta !== null && (
                <span className="block text-xs font-normal text-muted mt-0.5">
                  {delta === 0
                    ? "You're right at the average."
                    : delta > 0
                      ? `You're ${delta} points above the average user.`
                      : `You're ${-delta} points below the average user.`}
                </span>
              )}
            </span>
            <svg
              className="w-4 h-4 text-muted shrink-0"
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
        )}
        {hasTests && (
          <Link
            href="/profile"
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
        )}
        {!isPending && !session?.user ? (
          <SignInNudge
            title={
              hasAttempts
                ? `You've answered ${attempts} question${
                    attempts === 1 ? "" : "s"
                  } — don't lose this progress`
                : "Sign in to save your progress"
            }
            body="You're not signed in, so your spaced-repetition progress and test history only live in this browser tab and disappear on refresh. Sign in to keep them, and unlock full stats on your profile."
            callbackURL="/"
          />
        ) : (
          (hasAttempts || hasTests) && (
            <p className="text-xs text-muted">
              Free to use, works without an account, and syncs your progress
              across devices if you sign in. Not affiliated with the Home Office
              — always check official study material before your real test.
            </p>
          )
        )}
      </div>

      <div className="flex flex-col gap-4 pt-4 border-t border-line">
        <h3 className="text-sm font-semibold">How it works</h3>

        <div className="flex gap-3">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">Real practice questions</p>
            <p className="text-xs text-muted leading-relaxed">
              {questionCount ?? "–"} multiple-choice questions modeled on the
              official Life in the UK handbook, including the trickier "select
              two" style questions.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">Weak spots come back sooner</p>
            <p className="text-xs text-muted leading-relaxed">
              A spaced-repetition schedule reorders questions so ones you get
              wrong resurface again soon, while ones you know well fade further
              out.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">
              Review answers and track progress
            </p>
            <p className="text-xs text-muted leading-relaxed">
              See every question you've gotten right or wrong, with the correct
              answer and explanation, and watch your scores improve over time.
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowFeedbackModal(true)}
        className="text-xs text-muted hover:text-ink transition-colors self-center"
      >
        Send feedback
      </button>

      {showFeedbackModal && <AppFeedbackModal onClose={() => setShowFeedbackModal(false)} />}
    </div>
  );
}
