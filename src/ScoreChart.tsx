import type { TestResult } from "./history";

const PASS_THRESHOLD = 0.75;

const GRIDLINES = [0, 25, 50, 75, 100];
const CHART_LEFT = 6;
const CHART_RIGHT = 96;
const CHART_TOP = 6;
const CHART_BOTTOM = 34;
const VIEWBOX_HEIGHT = 40;

function scoreToY(pct: number): number {
    return CHART_BOTTOM - (pct / 100) * (CHART_BOTTOM - CHART_TOP);
}

export default function ScoreChart({ history }: { history: TestResult[] }) {
    const scores = history.map((h) => Math.round((h.score / h.total) * 100));

    if (scores.length === 0) {
        return (
            <p className="text-sm text-muted">
                Complete a test to see your progress here.
            </p>
        );
    }

    const points = scores.map((pct, i) => ({
        // Viewbox width is 100, so this doubles directly as a left% for the
        // HTML dot/label overlay below.
        xPct:
            scores.length > 1
                ? CHART_LEFT + (i / (scores.length - 1)) * (CHART_RIGHT - CHART_LEFT)
                : (CHART_LEFT + CHART_RIGHT) / 2,
        yPct: (scoreToY(pct) / VIEWBOX_HEIGHT) * 100,
        pct,
        result: history[i],
    }));

    const linePath = points
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.xPct},${scoreToY(p.pct)}`)
        .join(" ");

    const last = points[points.length - 1];

    return (
        <div>
            <div className="relative w-full h-48">
                {/* Gridlines + trend line only — safe to stretch non-uniformly,
                    unlike circular dots or text which would distort. */}
                <svg
                    viewBox={`0 0 100 ${VIEWBOX_HEIGHT}`}
                    className="absolute inset-0 w-full h-full"
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
                </svg>

                {/* Dots + label rendered as HTML overlays (positioned by %),
                    so they stay perfectly round/undistorted at any width. */}
                {points.map((p, i) => (
                    <div
                        key={i}
                        className={`absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                            p.pct / 100 >= PASS_THRESHOLD ? "bg-good" : "bg-bad"
                        }`}
                        style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
                        title={`Test ${i + 1}: ${p.pct}% on ${new Date(
                            p.result.timestamp,
                        ).toLocaleDateString()}`}
                    />
                ))}

                <div
                    className="absolute text-xs font-medium text-ink -translate-x-full -translate-y-full -mt-1"
                    style={{ left: `${last.xPct}%`, top: `${last.yPct}%` }}
                >
                    {last.pct}%
                </div>
            </div>
            <p className="text-xs text-muted mt-2">
                Each point is one completed test.{" "}
                <span className="text-good font-medium">Green</span> = passed
                (≥75%), <span className="text-bad font-medium">red</span> = below.
            </p>
        </div>
    );
}
