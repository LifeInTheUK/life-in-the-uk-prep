"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { getHistory, type TestResult } from "./history";
import { getAggregateStats } from "./sm2";

const PASS_THRESHOLD = 0.75;

const GRIDLINES = [0, 25, 50, 75, 100];
const CHART_LEFT = 6;
const CHART_RIGHT = 96;
const CHART_TOP = 6;
const CHART_BOTTOM = 34;

function scoreToY(pct: number): number {
    return CHART_BOTTOM - (pct / 100) * (CHART_BOTTOM - CHART_TOP);
}

export default function ProfilePage() {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();

    const [history, setHistory] = useState<TestResult[]>([]);
    const [aggregate, setAggregate] = useState({ attempts: 0, correct: 0 });
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        if (!isPending && !session?.user) {
            router.replace("/");
        }
    }, [isPending, session, router]);

    useEffect(() => {
        setHistory(getHistory());
        setAggregate(getAggregateStats());
    }, []);

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

    if (isPending || !session?.user) {
        return (
            <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
                <p className="text-sm text-muted">Loading...</p>
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

    const points = scores.map((pct, i) => ({
        x:
            scores.length > 1
                ? CHART_LEFT + (i / (scores.length - 1)) * (CHART_RIGHT - CHART_LEFT)
                : (CHART_LEFT + CHART_RIGHT) / 2,
        y: scoreToY(pct),
        pct,
        result: history[i],
    }));

    const linePath = points
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
        .join(" ");

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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 tabular">
                    <div className="rounded-xl border border-line bg-surface p-3 text-center">
                        <div className="text-xl font-semibold">{history.length}</div>
                        <div className="text-[11px] text-muted">Tests taken</div>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-3 text-center">
                        <div className="text-xl font-semibold">{overallAccuracy}%</div>
                        <div className="text-[11px] text-muted">Overall accuracy</div>
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

                {points.length === 0 ? (
                    <p className="text-sm text-muted">
                        Complete a test to see your progress here.
                    </p>
                ) : (
                    <div>
                        <svg
                            viewBox="0 0 100 40"
                            className="w-full h-48"
                            preserveAspectRatio="none"
                            role="img"
                            aria-label="Score percentage over completed tests"
                        >
                            {GRIDLINES.map((pct) => (
                                <line
                                    key={pct}
                                    x1={CHART_LEFT}
                                    x2={CHART_RIGHT}
                                    y1={scoreToY(pct)}
                                    y2={scoreToY(pct)}
                                    stroke="currentColor"
                                    className="text-line"
                                    strokeWidth="0.3"
                                    vectorEffect="non-scaling-stroke"
                                />
                            ))}

                            <path
                                d={linePath}
                                fill="none"
                                stroke="currentColor"
                                className="text-accent"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            />

                            {points.map((p, i) => (
                                <circle
                                    key={i}
                                    cx={p.x}
                                    cy={p.y}
                                    r="1.6"
                                    className={
                                        p.pct / 100 >= PASS_THRESHOLD ? "fill-good" : "fill-bad"
                                    }
                                >
                                    <title>
                                        Test {i + 1}: {p.pct}% on{" "}
                                        {new Date(p.result.timestamp).toLocaleDateString()}
                                    </title>
                                </circle>
                            ))}

                            {points.length > 0 && (
                                <text
                                    x={points[points.length - 1].x}
                                    y={points[points.length - 1].y - 3}
                                    textAnchor="end"
                                    fontSize="4"
                                    className="fill-ink font-medium"
                                >
                                    {points[points.length - 1].pct}%
                                </text>
                            )}
                        </svg>
                        <p className="text-xs text-muted mt-2">
                            Each point is one completed test.{" "}
                            <span className="text-good font-medium">Green</span> = passed
                            (≥75%), <span className="text-bad font-medium">red</span> = below.
                        </p>
                    </div>
                )}
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
