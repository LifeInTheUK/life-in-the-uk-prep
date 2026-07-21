"use client";

import { useEffect, useState } from "react";
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

export default function StatsPage() {
    const [history, setHistory] = useState<TestResult[]>([]);
    const [aggregate, setAggregate] = useState({ attempts: 0, correct: 0 });

    useEffect(() => {
        setHistory(getHistory());
        setAggregate(getAggregateStats());
    }, []);

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
        <div className="order-2 sm:order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
            <h2 className="text-lg font-semibold">Your progress</h2>

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
                                className={p.pct / 100 >= PASS_THRESHOLD ? "fill-good" : "fill-bad"}
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
                        (≥75%), <span className="text-bad font-medium">red</span> =
                        below.
                    </p>
                </div>
            )}
        </div>
    );
}
