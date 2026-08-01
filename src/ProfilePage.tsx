"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { useProgress } from "./progressContext";
import SignInNudge from "./SignInNudge";
import Skeleton from "./Skeleton";
import NavCard from "./NavCard";

export default function ProfilePage() {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();

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
                <h2 className="text-lg font-semibold">Profile</h2>

                <div className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-full shrink-0" />
                    <div className="min-w-0 flex flex-col gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                    </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-line">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                </div>
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
    const statsSubtitle =
        attempts > 0
            ? `${attempts} question${attempts === 1 ? "" : "s"} answered · ${overallAccuracy}% accuracy`
            : "Accuracy, trends, and topic breakdown";

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

            <div className="flex flex-col gap-2 pt-2 border-t border-line">
                <NavCard
                    href="/stats"
                    title="Full statistics"
                    subtitle={statsSubtitle}
                />
                <NavCard
                    href="/friends"
                    title="Friends"
                    subtitle="Invite friends and see who's most test-ready"
                />
                <NavCard
                    href="/propose-question"
                    title="Propose a new question"
                    subtitle="Suggest a question for the question bank"
                />
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
