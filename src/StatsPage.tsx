"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { useHistoryState } from "./historyContext";
import { useProgress } from "./progressContext";
import ScoreChart from "./ScoreChart";
import Skeleton from "./Skeleton";

interface GlobalStats {
    totalTests: number;
    totalUsers: number;
    averageAccuracy: number;
    percentile: number | null;
}

interface FriendEntry {
    userId: string;
    name: string | null;
    image: string | null;
    accuracy: number;
    attempts: number;
    isMe: boolean;
    accountDeleted: boolean;
}

function FriendAvatar({ image }: { image: string | null }) {
    return (
        <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center overflow-hidden shrink-0">
            {image ? (
                <img src={image} alt="" className="w-full h-full object-cover" />
            ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

function ComparisonCardSkeleton() {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex flex-col gap-2">
                <div>
                    <div className="flex justify-between mb-1">
                        <Skeleton className="h-3 w-8" />
                        <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <div>
                    <div className="flex justify-between mb-1">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                </div>
            </div>
            <Skeleton className="h-4 w-3/4" />
        </div>
    );
}

function tierFor(accuracy: number): { label: string; className: string } {
    if (accuracy >= 90) return { label: "Expert", className: "bg-accent text-white" };
    if (accuracy >= 75) return { label: "Test Ready", className: "bg-good text-white" };
    if (accuracy >= 50) return { label: "Improving", className: "bg-good-soft text-good" };
    return { label: "Getting Started", className: "bg-line text-muted" };
}

export default function StatsPage() {
    const { history } = useHistoryState();
    const { aggregate } = useProgress();
    const { data: session } = authClient.useSession();
    const [global, setGlobal] = useState<GlobalStats | null>(null);
    const [friends, setFriends] = useState<FriendEntry[] | null>(null);

    const { attempts, correct } = aggregate;
    const personalAccuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
    const hasAttempts = attempts > 0;

    useEffect(() => {
        fetch(`/api/stats/global?accuracy=${personalAccuracy}`)
            .then((res) => res.json())
            .then(setGlobal);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!session?.user) {
            setFriends(null);
            return;
        }
        fetch("/api/friends")
            .then((res) => res.json())
            .then((data) => setFriends(data.entries));
    }, [session?.user]);

    const hasFriends = (friends?.length ?? 0) > 1;
    const friendsList = friends?.filter((f) => !f.isMe) ?? [];
    const friendsByAccuracy = [...friendsList].sort((a, b) => b.accuracy - a.accuracy);
    const me = friends?.find((f) => f.isMe);

    const scores = history.map((h) => Math.round((h.score / h.total) * 100));
    const best = scores.length > 0 ? Math.max(...scores) : 0;
    const latest = scores.length > 0 ? scores[scores.length - 1] : 0;
    const tier = tierFor(personalAccuracy);
    const delta = global ? personalAccuracy - global.averageAccuracy : 0;
    const hasCommunityData = !!global && global.totalUsers > 0;

    return (
        <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
            <h2 className="text-lg font-semibold">Your Stats</h2>

            <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-ink">Your progress</h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 tabular">
                    <div className="rounded-xl border border-line bg-surface p-3 text-center">
                        <div className="text-xl font-semibold">{history.length}</div>
                        <div className="text-[11px] text-muted">Tests taken</div>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-3 text-center">
                        <div className="text-xl font-semibold">{personalAccuracy}%</div>
                        <div className="text-[11px] text-muted">Your accuracy</div>
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
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-line">
                <h3 className="text-sm font-semibold text-ink">Community</h3>

                {!global ? (
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-2 tabular">
                            <div className="rounded-xl border border-line bg-surface p-3 text-center flex flex-col items-center gap-1">
                                <Skeleton className="h-6 w-10" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <div className="rounded-xl border border-line bg-surface p-3 text-center flex flex-col items-center gap-1">
                                <Skeleton className="h-6 w-10" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                        {hasAttempts && <ComparisonCardSkeleton />}
                        {hasAttempts && <ComparisonCardSkeleton />}
                    </div>
                ) : !hasCommunityData ? (
                    <p className="text-sm text-muted">
                        Not enough community data yet — check back soon.
                    </p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-2 tabular">
                            <div className="rounded-xl border border-line bg-surface p-3 text-center">
                                <div className="text-xl font-semibold">
                                    {global.totalTests}
                                </div>
                                <div className="text-[11px] text-muted">
                                    Tests taken by all users
                                </div>
                            </div>
                            <div className="rounded-xl border border-line bg-surface p-3 text-center">
                                <div className="text-xl font-semibold">
                                    {global.averageAccuracy}%
                                </div>
                                <div className="text-[11px] text-muted">
                                    Average accuracy
                                </div>
                            </div>
                        </div>

                        {hasAttempts && (
                            <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">You vs average</span>
                                    <span
                                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${tier.className}`}
                                    >
                                        {tier.label}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div>
                                        <div className="flex justify-between text-xs text-muted mb-1">
                                            <span>You</span>
                                            <span className="tabular">{personalAccuracy}%</span>
                                        </div>
                                        <div className="h-2 bg-line rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent rounded-full transition-all"
                                                style={{ width: `${personalAccuracy}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-muted mb-1">
                                            <span>Average</span>
                                            <span className="tabular">
                                                {global.averageAccuracy}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-line rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-muted rounded-full transition-all"
                                                style={{ width: `${global.averageAccuracy}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-muted">
                                    {delta === 0
                                        ? "You're right at the average."
                                        : delta > 0
                                          ? `You're ${delta} points above the average user.`
                                          : `You're ${-delta} points below the average user.`}
                                    {global.percentile !== null &&
                                        ` You're ahead of ${global.percentile}% of users.`}
                                </p>
                            </div>
                        )}

                        {hasAttempts && friendsByAccuracy.length > 0 && (
                            <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
                                <span className="text-sm font-medium">You vs your friends</span>

                                <div className="flex flex-col gap-2.5">
                                    <div className="flex items-center gap-2">
                                        <FriendAvatar image={me?.image ?? null} />
                                        <span className="text-xs font-semibold text-ink truncate w-20 shrink-0">
                                            You
                                        </span>
                                        <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent rounded-full transition-all"
                                                style={{ width: `${personalAccuracy}%` }}
                                            />
                                        </div>
                                        <span className="text-xs tabular text-ink w-9 text-right shrink-0">
                                            {personalAccuracy}%
                                        </span>
                                        <span className="text-xs tabular text-muted w-8 text-right shrink-0" />
                                    </div>

                                    {friendsByAccuracy.map((friend) => {
                                        const friendDelta = personalAccuracy - friend.accuracy;
                                        const name = friend.accountDeleted
                                            ? "Deleted user"
                                            : (friend.name ?? "Unknown");
                                        return (
                                            <div
                                                key={friend.userId}
                                                className="flex items-center gap-2"
                                            >
                                                <FriendAvatar image={friend.image} />
                                                <span className="text-xs font-medium text-ink truncate w-20 shrink-0">
                                                    {name}
                                                </span>
                                                {friend.attempts === 0 ? (
                                                    <span className="flex-1 text-xs text-muted">
                                                        No attempts yet
                                                    </span>
                                                ) : (
                                                    <>
                                                        <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-muted rounded-full transition-all"
                                                                style={{
                                                                    width: `${friend.accuracy}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-xs tabular text-ink w-9 text-right shrink-0">
                                                            {friend.accuracy}%
                                                        </span>
                                                        <span className="text-xs tabular text-muted w-8 text-right shrink-0">
                                                            {friendDelta === 0
                                                                ? "±0"
                                                                : friendDelta > 0
                                                                  ? `+${friendDelta}`
                                                                  : friendDelta}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {!hasAttempts && (
                    <p className="text-sm text-muted">
                        Take a test to see how you compare.
                    </p>
                )}
            </div>

            {session?.user && (
                <div className="pt-4 border-t border-line">
                    <Link
                        href="/friends"
                        className="flex items-center justify-between p-3 rounded-xl border border-line hover:border-accent transition-colors text-sm font-medium"
                    >
                        {hasFriends ? "Manage friends" : "Invite a friend"}
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
            )}
        </div>
    );
}
