"use client";

import { useEffect, useState } from "react";
import { useHistoryState } from "./historyContext";
import { useProgress } from "./progressContext";
import ScoreChart from "./ScoreChart";

interface GlobalStats {
    totalTests: number;
    totalUsers: number;
    averageAccuracy: number;
    percentile: number | null;
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
    const [global, setGlobal] = useState<GlobalStats | null>(null);

    const { attempts, correct } = aggregate;
    const personalAccuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
    const hasAttempts = attempts > 0;

    useEffect(() => {
        fetch(`/api/stats/global?accuracy=${personalAccuracy}`)
            .then((res) => res.json())
            .then(setGlobal);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                    <p className="text-sm text-muted">Loading community stats...</p>
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
                    </>
                )}

                {!hasAttempts && (
                    <p className="text-sm text-muted">
                        Take a test to see how you compare.
                    </p>
                )}
            </div>
        </div>
    );
}
