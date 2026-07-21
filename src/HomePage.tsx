"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { questions } from "./questions";
import { getAggregateStats } from "./sm2";
import { getHistory } from "./history";

interface HomeStats {
    hasSession: boolean;
    accuracy: number;
    testsCompleted: number;
}

const DEFAULT_STATS: HomeStats = {
    hasSession: false,
    accuracy: 0,
    testsCompleted: 0,
};

export default function HomePage() {
    const [stats, setStats] = useState<HomeStats>(DEFAULT_STATS);

    useEffect(() => {
        const { attempts, correct } = getAggregateStats();
        setStats({
            hasSession: !!sessionStorage.getItem("ukTestSession"),
            accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
            testsCompleted: getHistory().length,
        });
    }, []);

    const { hasSession, accuracy, testsCompleted } = stats;

    return (
        <div className="order-2 sm:order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 py-2 sm:p-7">
            <div>
                <h2 className="text-xl font-semibold mb-1">
                    Ready to practice?
                </h2>
                <p className="text-sm text-muted">
                    Spaced-repetition questions drawn from the official Life in
                    the UK test material.
                </p>
            </div>

            <Link
                href="/test"
                className="w-full bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center"
            >
                {hasSession ? "Continue Test" : "Start Test"}
            </Link>

            {hasSession && (
                <Link
                    href="/test"
                    onClick={() => sessionStorage.removeItem("ukTestSession")}
                    className="w-full bg-ink hover:bg-slate-700 active:scale-[0.98] text-white font-medium text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center"
                >
                    Start New Test
                </Link>
            )}

            <div className="grid grid-cols-3 gap-2 tabular">
                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                    <div className="text-xl font-semibold">
                        {questions.length}
                    </div>
                    <div className="text-[11px] text-muted">Bank</div>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                    <div className="text-xl font-semibold text-accent">
                        {accuracy}%
                    </div>
                    <div className="text-[11px] text-muted">Accuracy</div>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3 text-center">
                    <div className="text-xl font-semibold">
                        {testsCompleted}
                    </div>
                    <div className="text-[11px] text-muted">Tests</div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <Link
                    href="/review"
                    className="flex items-center justify-between p-3 rounded-xl border border-line hover:border-accent transition-colors text-sm font-medium"
                >
                    Review answers
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
                <Link
                    href="/stats"
                    className="flex items-center justify-between p-3 rounded-xl border border-line hover:border-accent transition-colors text-sm font-medium"
                >
                    Your progress
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
        </div>
    );
}
