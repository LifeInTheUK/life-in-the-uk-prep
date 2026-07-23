"use client";

import { authClient } from "@/lib/auth/client";

export default function SignInNudge({
  title,
  body,
  callbackURL,
}: {
  title: string;
  body: string;
  callbackURL: string;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-line bg-surface">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="text-xs text-muted leading-relaxed">{body}</p>
      <button
        onClick={() =>
          authClient.signIn.social({ provider: "google", callbackURL })
        }
        className="self-start bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-2 px-4 rounded-xl transition-all"
      >
        Sign in with Google
      </button>
    </div>
  );
}
