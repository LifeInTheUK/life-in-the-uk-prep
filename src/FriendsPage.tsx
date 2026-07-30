"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import SignInNudge from "./SignInNudge";
import Skeleton from "./Skeleton";
import FriendRowSkeleton from "./FriendRowSkeleton";

interface FriendEntry {
  userId: string;
  name: string | null;
  image: string | null;
  accuracy: number;
  attempts: number;
  isMe: boolean;
  accountDeleted: boolean;
}

function AvatarCircle({ image }: { image: string | null }) {
  return (
    <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center overflow-hidden shrink-0">
      {image ? (
        <img src={image} alt="" className="w-full h-full object-cover" />
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      )}
    </div>
  );
}

export default function FriendsPage() {
  const { data: session, isPending } = authClient.useSession();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [entries, setEntries] = useState<FriendEntry[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/friends/invite")
      .then((res) => res.json())
      .then((data) => setInviteUrl(data.url));
    fetch("/api/friends")
      .then((res) => res.json())
      .then((data) => setEntries(data.entries));
  }, [session?.user]);

  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRemove(friendId: string) {
    const confirmed = window.confirm(
      "Remove this friend? You'll need to share your invite link again to add them back.",
    );
    if (!confirmed) return;

    setRemovingId(friendId);
    const res = await fetch(`/api/friends/${friendId}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((prev) => prev?.filter((e) => e.userId !== friendId) ?? null);
    }
    setRemovingId(null);
  }

  if (isPending) {
    return (
      <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
        <h2 className="text-lg font-semibold">Friends</h2>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-64 max-w-full" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-3 pt-4 border-t border-line">
          <Skeleton className="h-4 w-24" />
          <FriendRowSkeleton />
          <FriendRowSkeleton />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
        <h2 className="text-lg font-semibold">Friends</h2>
        <SignInNudge
          title="Sign in to compete with friends"
          body="Invite friends to compare accuracy scores and see who's most ready for the test."
          callbackURL="/friends"
        />
        <Link
          href="/"
          className="self-start text-sm font-medium text-muted hover:text-ink transition-colors"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const hasFriends = (entries?.length ?? 0) > 1;

  return (
    <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
      <h2 className="text-lg font-semibold">Friends</h2>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-ink">Invite a friend</h3>
        <p className="text-xs text-muted leading-relaxed">
          Share this link — anyone who opens it and signs in will be added as
          your friend.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteUrl ?? "Loading..."}
            className="flex-1 min-w-0 rounded-xl border border-line bg-surface px-3 py-2 text-xs text-muted truncate"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            onClick={handleCopy}
            disabled={!inviteUrl}
            className="shrink-0 bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-2 px-4 rounded-xl transition-all disabled:opacity-50"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-line">
        <h3 className="text-sm font-semibold text-ink">Leaderboard</h3>

        {!entries ? (
          <div className="flex flex-col gap-2">
            <FriendRowSkeleton />
            <FriendRowSkeleton />
          </div>
        ) : !hasFriends ? (
          <p className="text-sm text-muted">
            Invite a friend to start comparing scores.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry, i) => (
              <div
                key={entry.userId}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
              >
                <div className="w-5 text-center text-sm font-semibold text-muted tabular">
                  {i + 1}
                </div>
                <AvatarCircle image={entry.image} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">
                    {entry.isMe
                      ? "You"
                      : entry.accountDeleted
                        ? "Deleted user"
                        : (entry.name ?? "Unknown")}
                  </p>
                  {entry.attempts === 0 ? (
                    <p className="text-xs text-muted">No attempts yet</p>
                  ) : (
                    <p className="text-xs text-muted tabular">
                      {entry.accuracy}% accuracy
                    </p>
                  )}
                </div>
                {!entry.isMe && (
                  <button
                    onClick={() => handleRemove(entry.userId)}
                    disabled={removingId === entry.userId}
                    className="shrink-0 text-xs font-medium text-bad hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
