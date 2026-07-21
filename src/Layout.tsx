import { Link, Outlet } from "react-router-dom";

export default function Layout() {
    return (
        <div className="w-full max-w-xl mx-auto px-4 py-6 sm:py-10 flex flex-col gap-5">
            <h1 className="order-1 text-2xl font-semibold tracking-tight text-accent">
                Life in the UK Prep
            </h1>

            <Outlet />

            <div className="order-3 sm:order-2 flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <div
                    className="flex flex-col items-center justify-center flex-1 min-w-[84px] rounded-xl bg-surface border border-line py-2"
                    title="Total questions in the bank"
                >
                    <div
                        className="text-base font-semibold tabular"
                        id="total-questions"
                    >
                        0
                    </div>
                    <div className="text-[11px] text-muted">Bank</div>
                </div>
                <Link
                    to="/review"
                    className="flex flex-col items-center justify-center flex-1 min-w-[84px] rounded-xl bg-surface border border-line py-2 hover:border-accent transition-colors"
                    title="Review your correct and incorrect answers"
                >
                    <div
                        className="text-base font-semibold tabular text-accent"
                        id="global-accuracy"
                    >
                        0%
                    </div>
                    <div className="text-[11px] text-muted">Accuracy</div>
                </Link>
                <div
                    className="flex flex-col items-center justify-center flex-1 min-w-[84px] rounded-xl bg-surface border border-line py-2"
                    title="Correct answers this session"
                >
                    <div className="text-base font-semibold tabular" id="score">
                        0
                    </div>
                    <div className="text-[11px] text-muted">Score</div>
                </div>
            </div>
        </div>
    );
}
