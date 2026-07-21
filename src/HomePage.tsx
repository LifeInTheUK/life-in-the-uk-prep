import { Link } from "react-router-dom";
import { questions } from "./questions";
import { getAggregateStats } from "./sm2";
import { getHistory } from "./history";

export default function HomePage() {
    const hasSession = !!sessionStorage.getItem("ukTestSession");
    const { attempts, correct } = getAggregateStats();
    const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
    const testsCompleted = getHistory().length;

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
                to="/test"
                className="w-full bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center"
            >
                {hasSession ? "Continue Test" : "Start Test"}
            </Link>

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
                    to="/review"
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
                    to="/stats"
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
