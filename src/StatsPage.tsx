"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { useHistoryState } from "./historyContext";
import { useProgress } from "./progressContext";
import { useTheme } from "./themeContext";
import { CHART_TOKENS } from "./muiTheme";
import ScoreChart from "./ScoreChart";
import StatGauge from "./StatGauge";
import TopicAccuracyChart from "./TopicAccuracyChart";
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
    const { aggregate, getAllProgress } = useProgress();
    const { data: session } = authClient.useSession();
    const { isDark } = useTheme();
    const chartTokens = isDark ? CHART_TOKENS.dark : CHART_TOKENS.light;
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

    const scores = history.map((h) => Math.round((h.score / h.total) * 100));
    const best = scores.length > 0 ? Math.max(...scores) : 0;
    const latest = scores.length > 0 ? scores[scores.length - 1] : 0;

    const RECENT_WINDOW = 50;
    const recentSessions = history.slice(-RECENT_WINDOW);
    const recentAccuracy =
        recentSessions.length > 0
            ? Math.round(
                  (recentSessions.reduce((sum, h) => sum + h.score, 0) /
                      recentSessions.reduce((sum, h) => sum + h.total, 0)) *
                      100,
              )
            : 0;

    const tier = tierFor(personalAccuracy);
    const delta = global ? personalAccuracy - global.averageAccuracy : 0;
    const hasCommunityData = !!global && global.totalUsers > 0;

    return (
        <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
            <h2 className="text-lg font-semibold">Your Stats</h2>

            <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-ink">Your progress</h3>

                <div className="rounded-xl border border-line bg-surface p-3 text-center tabular">
                    <div className="text-xl font-semibold">{history.length}</div>
                    <div className="text-[11px] text-muted">Tests taken</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatGauge value={personalAccuracy} label="Overall accuracy" />
                    <StatGauge
                        value={recentAccuracy}
                        label={`Last ${recentSessions.length} test${recentSessions.length === 1 ? "" : "s"}`}
                    />
                    <StatGauge value={best} label="Best score" />
                    <StatGauge value={latest} label="Latest score" />
                </div>

                <ScoreChart history={history} />

                <TopicAccuracyChart progress={getAllProgress()} />
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
                            <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">You vs average</span>
                                    <span
                                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${tier.className}`}
                                    >
                                        {tier.label}
                                    </span>
                                </div>

                                <div className="flex items-center justify-center gap-6">
                                    <StatGauge
                                        value={personalAccuracy}
                                        label="You"
                                        size={112}
                                        variant="bare"
                                    />
                                    <div
                                        className={`flex flex-col items-center gap-0.5 shrink-0 tabular ${
                                            delta === 0
                                                ? "text-muted"
                                                : delta > 0
                                                  ? "text-good"
                                                  : "text-bad"
                                        }`}
                                    >
                                        <svg
                                            className={`w-5 h-5 ${delta < 0 ? "rotate-180" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2.5"
                                                d="M12 19V5m0 0l-6 6m6-6l6 6"
                                            />
                                        </svg>
                                        <span className="text-lg font-bold">
                                            {delta === 0 ? "±0" : `${Math.abs(delta)}`}
                                        </span>
                                        <span className="text-[10px] text-muted">points</span>
                                    </div>
                                    <StatGauge
                                        value={global.averageAccuracy}
                                        label="Average"
                                        size={112}
                                        color={chartTokens.muted}
                                        variant="bare"
                                    />
                                </div>

                                <p className="text-sm text-muted text-center">
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

                        {hasAttempts && friendsByAccuracy.length > 0 && (() => {
                            const rankedFriends = friendsByAccuracy.filter(
                                (f) => f.attempts > 0,
                            );
                            const unrankedFriends = friendsByAccuracy.filter(
                                (f) => f.attempts === 0,
                            );
                            const nameFor = (f: FriendEntry) =>
                                f.accountDeleted ? "Deleted user" : (f.name ?? "Unknown");

                            const leaderboard = [
                                {
                                    key: "me",
                                    label: "You",
                                    value: personalAccuracy,
                                    image: session?.user.image ?? null,
                                    isMe: true,
                                },
                                ...rankedFriends.map((f) => ({
                                    key: f.userId,
                                    label: nameFor(f),
                                    value: f.accuracy,
                                    image: f.image,
                                    isMe: false,
                                })),
                            ].sort((a, b) => b.value - a.value);

                            const MEDALS = ["🥇", "🥈", "🥉"];

                            return (
                                <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
                                    <span className="text-sm font-medium">
                                        You vs your friends
                                    </span>

                                    <div className="flex flex-col gap-1">
                                        {leaderboard.map((entry, i) => (
                                            <div
                                                key={entry.key}
                                                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${
                                                    entry.isMe
                                                        ? "bg-accent/10 ring-1 ring-accent/30"
                                                        : ""
                                                }`}
                                            >
                                                <span className="w-5 text-center text-xs font-semibold text-muted shrink-0">
                                                    {MEDALS[i] ?? `#${i + 1}`}
                                                </span>
                                                <FriendAvatar image={entry.image} />
                                                <span
                                                    className={`text-xs truncate w-16 shrink-0 ${
                                                        entry.isMe
                                                            ? "font-semibold text-accent"
                                                            : "font-medium text-ink"
                                                    }`}
                                                >
                                                    {entry.label}
                                                </span>
                                                <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${
                                                            entry.isMe ? "bg-accent" : "bg-muted"
                                                        }`}
                                                        style={{ width: `${entry.value}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold tabular text-ink w-9 text-right shrink-0">
                                                    {entry.value}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {unrankedFriends.length > 0 && (
                                        <div className="flex flex-col gap-1.5 pt-2 border-t border-line">
                                            {unrankedFriends.map((f) => (
                                                <div
                                                    key={f.userId}
                                                    className="flex items-center gap-2.5 px-2"
                                                >
                                                    <span className="w-5 shrink-0" />
                                                    <FriendAvatar image={f.image} />
                                                    <span className="text-xs font-medium text-ink truncate w-16 shrink-0">
                                                        {nameFor(f)}
                                                    </span>
                                                    <span className="text-xs text-muted">
                                                        No attempts yet
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
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
