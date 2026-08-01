"use client";

import { ThemeProvider } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import type { TestResult } from "./history";
import { useTheme } from "./themeContext";
import { getMuiTheme, CHART_TOKENS } from "./muiTheme";

const PASS_THRESHOLD = 75;

export default function ScoreChart({ history }: { history: TestResult[] }) {
    const { isDark } = useTheme();
    const scores = history.map((h) => Math.round((h.score / h.total) * 100));

    if (scores.length === 0) {
        return (
            <p className="text-sm text-muted">
                Complete a test to see your progress here.
            </p>
        );
    }

    const labels = history.map((_, i) => `Test ${i + 1}`);
    const tokens = isDark ? CHART_TOKENS.dark : CHART_TOKENS.light;

    return (
        <div>
            <ThemeProvider theme={getMuiTheme(isDark)}>
                <LineChart
                    height={220}
                    xAxis={[{ data: labels, scaleType: "point" }]}
                    yAxis={[
                        { min: 0, max: 100, valueFormatter: (v: number) => `${v}%` },
                    ]}
                    series={[
                        {
                            data: scores,
                            color: tokens.accent,
                            valueFormatter: (v: number | null) => `${v}%`,
                            curve: "monotoneX",
                        },
                    ]}
                    grid={{ horizontal: true }}
                    margin={{ left: 40, right: 20, top: 20, bottom: 30 }}
                >
                    <ChartsReferenceLine
                        y={PASS_THRESHOLD}
                        label="Pass (75%)"
                        labelAlign="end"
                        lineStyle={{ stroke: tokens.muted, strokeDasharray: "4 4" }}
                    />
                </LineChart>
            </ThemeProvider>
            <p className="text-xs text-muted mt-2">
                Each point is one completed test, plotted against the{" "}
                <span className="font-medium text-ink">75% pass mark</span>.
            </p>
        </div>
    );
}
