"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import SignInNudge from "./SignInNudge";
import Skeleton from "./Skeleton";

interface InviteInfo {
  inviterId: string;
  inviterName: string | null;
  inviterImage: string | null;
  accountDeleted: boolean;
}

export default function FriendsAddPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [invite, setInvite] = useState<InviteInfo | "invalid" | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/friends/invite/${token}`)
      .then(async (res) => {
        if (!res.ok) return "invalid" as const;
        return (await res.json()) as InviteInfo;
      })
      .then(setInvite);
  }, [token]);

  async function handleAdd() {
    setAdding(true);
    setError(null);
    const res = await fetch("/api/friends/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      router.replace("/friends");
      return;
    }
    if (res.status === 429 || res.status === 403) {
      setError("Too many requests, try again later.");
    } else {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Something went wrong. Try again.");
    }
    setAdding(false);
  }

  const wrapperClass =
    "order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7";

  if (isPending || invite === null) {
    return (
      <div className={wrapperClass}>
        <h2 className="text-lg font-semibold">Add Friend</h2>
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    );
  }

  if (invite === "invalid") {
    return (
      <div className={wrapperClass}>
        <h2 className="text-lg font-semibold">Add Friend</h2>
        <p className="text-sm text-muted">This invite link isn't valid.</p>
        <Link
          href="/"
          className="self-start text-sm font-medium text-muted hover:text-ink transition-colors"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const inviterLabel = invite.accountDeleted
    ? "Someone"
    : (invite.inviterName ?? "Someone");

  if (!session?.user) {
    return (
      <div className={wrapperClass}>
        <h2 className="text-lg font-semibold">Add Friend</h2>
        <p className="text-sm text-muted">
          {inviterLabel} invited you to compare scores on Life in the UK Prep.
        </p>
        <SignInNudge
          title="Sign in to add this friend"
          body="Sign in to accept the invite and start comparing accuracy scores."
          callbackURL={`/friends/add/${token}`}
        />
      </div>
    );
  }

  if (invite.inviterId === session.user.id) {
    return (
      <div className={wrapperClass}>
        <h2 className="text-lg font-semibold">Add Friend</h2>
        <p className="text-sm text-muted">
          This is your own invite link — share it with a friend instead.
        </p>
        <Link
          href="/friends"
          className="self-start text-sm font-medium text-muted hover:text-ink transition-colors"
        >
          Go to Friends
        </Link>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <h2 className="text-lg font-semibold">Add Friend</h2>
      <p className="text-sm text-muted">
        {inviterLabel} invited you to compare scores on Life in the UK Prep.
      </p>
      {error && <p className="text-xs text-bad">{error}</p>}
      <button
        onClick={handleAdd}
        disabled={adding}
        className="self-start bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-2 px-4 rounded-xl transition-all disabled:opacity-50"
      >
        {adding ? "Adding..." : "Add friend"}
      </button>
    </div>
  );
}
