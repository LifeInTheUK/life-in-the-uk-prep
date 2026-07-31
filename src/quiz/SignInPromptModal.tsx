"use client";

import Link from "next/link";

export default function SignInPromptModal({
  score,
  total,
  onClose,
}: {
  score: number;
  total: number;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface border border-line rounded-xl p-5 w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Don't lose this result</h3>
          <button
            type="button"
            aria-label="Close"
            className="text-muted hover:text-ink"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-muted leading-relaxed mb-4">
          You scored {score}/{total}, but you're not signed in — this result and
          your spaced-repetition progress only live in this browser tab and
          disappear on refresh. Sign in to keep them and see full stats on your
          profile.
        </p>
        <div className="flex gap-2">
          <Link
            href="/sign-in?callbackURL=/test"
            className="flex-1 text-center bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-2 px-4 rounded-xl transition-all"
          >
            Sign in
          </Link>
          <button
            onClick={onClose}
            className="text-sm font-medium text-muted hover:text-ink px-3 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
