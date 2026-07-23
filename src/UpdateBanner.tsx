"use client";

import { useEffect, useState } from "react";
import { GIT_COMMIT_SHA } from "./config";
import { useQuiz } from "./quiz/QuizContext";
import { useCookieConsent } from "./cookieConsentContext";

export default function UpdateBanner() {
  const [staleSha, setStaleSha] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { state } = useQuiz();
  const { hasConsented } = useCookieConsent();

  useEffect(() => {
    async function checkVersion() {
      if (state.phase === "active") return;
      try {
        const res = await fetch("/api/version");
        const data: { sha: string } = await res.json();
        if (data.sha && GIT_COMMIT_SHA && data.sha !== GIT_COMMIT_SHA) {
          setStaleSha(data.sha);
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

  // Gate on state.phase directly (not just on the check that sets staleSha)
  // so a banner triggered during "loading" (before a quiz question is on
  // screen) still hides once phase flips to "active" - the check alone
  // can't un-set staleSha once it's true. Also defer to CookieBanner while
  // consent is unresolved - both dock to the same fixed-bottom corner, and
  // showing two at once lets one intercept the other's clicks.
  if (!staleSha || dismissed || state.phase === "active" || !hasConsented) {
    return null;
  }

  return (
    <div
      id="update-banner"
      className="fixed bottom-0 inset-x-0 z-50 bg-slate-800 text-white px-4 py-4 sm:py-3"
    >
      <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-3">
        <p className="text-xs text-white/80 flex-1 text-center sm:text-left">
          A new version is available.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="flex-shrink-0 bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-2 px-4 rounded-xl transition-all"
          >
            Refresh
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="flex-shrink-0 text-white/60 hover:text-white text-sm px-2 py-2"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
