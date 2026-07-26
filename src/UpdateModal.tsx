"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GIT_COMMIT_SHA } from "./config";
import { useQuiz } from "./quiz/QuizContext";

interface VersionInfo {
  sha: string;
  message: string | null;
  releasedAt: number | null;
}

export default function UpdateModal() {
  const [staleVersion, setStaleVersion] = useState<VersionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { state } = useQuiz();

  useEffect(() => {
    async function checkVersion() {
      if (state.phase === "active") return;
      try {
        const res = await fetch("/api/version");
        const data: VersionInfo = await res.json();
        if (data.sha && GIT_COMMIT_SHA && data.sha !== GIT_COMMIT_SHA) {
          setStaleVersion(data);
        }
      } catch {
        // Offline or network blip - skip silently, next check retries.
      }
    }

    checkVersion();
    document.addEventListener("visibilitychange", checkVersion);
    window.addEventListener("focus", checkVersion);
    return () => {
      document.removeEventListener("visibilitychange", checkVersion);
      window.removeEventListener("focus", checkVersion);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // Gate on state.phase directly (not just on the check that sets
  // staleVersion) so a modal triggered during "loading" (before a quiz
  // question is on screen) still hides once phase flips to "active" - the
  // check alone can't un-set staleVersion once it's true.
  if (!staleVersion || dismissed || state.phase === "active") {
    return null;
  }

  return (
    <div
      id="update-modal"
      className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) setDismissed(true);
      }}
    >
      <div className="bg-surface border border-line rounded-xl p-5 w-full max-w-sm">
        <h3 className="text-sm font-semibold mb-2">New version available</h3>
        <div className="mb-4">
          <p className="text-sm text-muted">
            {staleVersion.message ?? "The app has been updated."}
          </p>
          {staleVersion.releasedAt !== null && (
            <p className="text-xs text-muted mt-1">
              {new Date(staleVersion.releasedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-2.5 px-4 rounded-xl transition-all"
          >
            Refresh
          </button>
          <Link
            href="/changelog"
            className="flex-1 text-center border border-line hover:border-accent text-sm py-2.5 px-4 rounded-xl transition-colors"
          >
            View changelog
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="w-full text-center text-xs text-muted hover:text-ink mt-3"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
