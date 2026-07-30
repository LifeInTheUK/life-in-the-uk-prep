"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { useHistoryState } from "./historyContext";
import { useProgress } from "./progressContext";
import ScoreChart from "./ScoreChart";
import SignInNudge from "./SignInNudge";

export default function ProfilePage() {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();

    const { history } = useHistoryState();
    const { aggregate } = useProgress();
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    async function handleDeleteAccount() {
        const confirmed = window.confirm(
            "Delete your account? This removes your sign-in and stops syncing across devices. Your practice data stays on this device and continues to work.",
        );
        if (!confirmed) return;

        setIsDeleting(true);
        setDeleteError(null);
        const res = await fetch("/api/account", { method: "DELETE" });
        if (!res.ok) {
            setDeleteError("Something went wrong. Try again.");
            setIsDeleting(false);
            return;
        }
        await authClient.signOut();
        router.replace("/");
    }

    if (isPending) {
        return (
            <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
                <p className="text-sm text-muted">Loading...</p>
            </div>
        );
    }

    if (!session?.user) {
        return (
            <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
                <h2 className="text-lg font-semibold">Profile</h2>
                <SignInNudge
                    title="Sign in to see your full profile"
                    body="Track your accuracy trend over time, see your full test history, and compare your score against other learners — all synced across devices."
                    callbackURL="/profile"
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

    const { user } = session;

    const { attempts, correct } = aggregate;
    const overallAccuracy =
        attempts > 0 ? Math.round((correct / attempts) * 100) : 0;

    const scores = history.map((h) => Math.round((h.score / h.total) * 100));
    const best = scores.length > 0 ? Math.max(...scores) : 0;
    const latest = scores.length > 0 ? scores[scores.length - 1] : 0;

    const RECENT_WINDOW = 10;
    const recentSessions = history.slice(-RECENT_WINDOW);
    const recentAccuracy =
        recentSessions.length > 0
            ? Math.round(
                  (recentSessions.reduce((sum, h) => sum + h.score, 0) /
                      recentSessions.reduce((sum, h) => sum + h.total, 0)) *
                      100,
              )
            : 0;

    return (
        <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
            <h2 className="text-lg font-semibold">Profile</h2>

            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center overflow-hidden shrink-0">
                    {user.image ? (
                        <img
                            src={user.image}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <svg
                            className="w-8 h-8"
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
                </div>
                <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{user.name}</p>
                    <p className="text-sm text-muted truncate">{user.email}</p>
                </div>
            </div>

            <button
                onClick={() => authClient.signOut()}
                className="self-start text-sm font-medium text-muted hover:text-ink transition-colors"
            >
                Sign out
            </button>

            <div className="flex flex-col gap-3 pt-2 border-t border-line">
                <h3 className="text-sm font-semibold text-ink">Your progress</h3>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 tabular">
                    <div className="rounded-xl border border-line bg-surface p-3 text-center">
                        <div className="text-xl font-semibold">{history.length}</div>
                        <div className="text-[11px] text-muted">Tests taken</div>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-3 text-center">
                        <div className="text-xl font-semibold">{overallAccuracy}%</div>
                        <div className="text-[11px] text-muted">Overall accuracy</div>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-3 text-center">
                        <div className="text-xl font-semibold">{recentAccuracy}%</div>
                        <div className="text-[11px] text-muted">
                            Last {recentSessions.length} test{recentSessions.length === 1 ? "" : "s"}
                        </div>
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

                <ScoreChart history={history} />

                <Link
                    href="/stats"
                    className="flex items-center justify-between p-3 rounded-xl border border-line hover:border-accent transition-colors text-sm font-medium"
                >
                    See how you compare to other users
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

            <div className="flex flex-col gap-2 pt-2 border-t border-line">
                <h3 className="text-sm font-semibold text-bad">Danger zone</h3>
                <p className="text-xs text-muted">
                    Permanently delete your account. Your quiz progress stays in
                    our database in anonymized form for aggregate statistics —
                    it's no longer linked to your name or email.
                </p>
                {deleteError && (
                    <p className="text-xs text-bad">{deleteError}</p>
                )}
                <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="self-start text-sm font-medium text-bad hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                    {isDeleting ? "Deleting..." : "Delete account"}
                </button>
            </div>
        </div>
    );
}
