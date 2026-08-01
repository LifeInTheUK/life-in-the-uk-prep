"use client";

import { useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import type { TestResult } from "./history";
import { useTheme } from "./themeContext";
import { getMuiTheme, CHART_TOKENS } from "./muiTheme";

const PASS_RATIO = 0.75;
const DEFAULT_VISIBLE_TESTS = 15;
// A softer, more sophisticated red than the app's shared --color-bad token
// (used for status chips/gauges) — chosen specifically for this chart's fill.
const INCORRECT_COLOR = { light: "#f43f5e", dark: "#fb7185" };
// High-contrast neutral so the trend line reads clearly against every fill
// color (indigo/green/rose) regardless of theme.
const TREND_COLOR = { light: "#0f172a", dark: "#f8fafc" };

function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    return slice.reduce((sum, v) => sum + v, 0) / slice.length;
  });
}

export default function ScoreChart({ history }: { history: TestResult[] }) {
  const { isDark } = useTheme();
  const [showAll, setShowAll] = useState(false);

  if (history.length === 0) {
    return (
      <p className="text-sm text-muted">
        Complete a test to see your progress here.
      </p>
    );
  }

  const isCapped = !showAll && history.length > DEFAULT_VISIBLE_TESTS;
  const visibleHistory = isCapped
    ? history.slice(-DEFAULT_VISIBLE_TESTS)
    : history;
  const offset = history.length - visibleHistory.length;

  const labels = visibleHistory.map((_, i) => `Test ${offset + i + 1}`);
  const tokens = isDark ? CHART_TOKENS.dark : CHART_TOKENS.light;
  const sessionSize = Math.max(...history.map((h) => h.total));
  const passLine = sessionSize * PASS_RATIO;
  const correctBelowPass = visibleHistory.map((h) =>
    Math.min(h.score, passLine),
  );
  const correctAbovePass = visibleHistory.map((h) =>
    Math.max(h.score - passLine, 0),
  );
  const incorrect = visibleHistory.map((h) => h.total - h.score);
  // Expanding average across exactly the tests currently visible (toggled by
  // "Show full history" / "Show last N") — not a fixed rolling window, so the
  // line always reflects the full range the user has selected.
  const trend = movingAverage(
    visibleHistory.map((h) => h.score),
    visibleHistory.length,
  );

  return (
    <div>
      <ThemeProvider theme={getMuiTheme(isDark)}>
        <LineChart
          height={270}
          xAxis={[{ data: labels, scaleType: "point" }]}
          yAxis={[
            {
              min: 0,
              max: sessionSize,
            },
          ]}
          series={[
            {
              id: "correctBelowPass",
              label: "Correct",
              data: correctBelowPass,
              color: tokens.accent,
              area: true,
              stack: "total",
              showMark: false,
              curve: "stepAfter",
            },
            {
              id: "correctAbovePass",
              label: "Above pass mark",
              data: correctAbovePass,
              color: tokens.good,
              area: true,
              stack: "total",
              showMark: false,
              curve: "stepAfter",
            },
            {
              id: "incorrect",
              label: "Incorrect",
              data: incorrect,
              color: isDark ? INCORRECT_COLOR.dark : INCORRECT_COLOR.light,
              area: true,
              stack: "total",
              showMark: false,
              curve: "stepAfter",
            },
            {
              id: "trend",
              label: "Trend",
              data: trend,
              color: isDark ? TREND_COLOR.dark : TREND_COLOR.light,
              showMark: false,
              curve: "monotoneX",
            },
          ]}
          grid={{ horizontal: true }}
          margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
          sx={{
            "& .MuiLineChart-area[data-series-id='correctBelowPass']": {
              fillOpacity: 0.85,
            },
            "& .MuiLineChart-area[data-series-id='correctAbovePass']": {
              fillOpacity: 0.85,
            },
            "& .MuiLineChart-area[data-series-id='incorrect']": {
              fillOpacity: 0.6,
            },
            "& .MuiLineChart-line[data-series-id='correctBelowPass'], & .MuiLineChart-line[data-series-id='correctAbovePass'], & .MuiLineChart-line[data-series-id='incorrect']":
              {
                stroke: "none",
              },
            "& .MuiLineChart-line[data-series-id='trend']": {
              strokeWidth: 2.5,
            },
            "& .MuiLineChart-area": {
              filter: "none",
            },
          }}
        >
          <ChartsReferenceLine
            y={passLine}
            lineStyle={{
              stroke: tokens.ink,
              strokeDasharray: "6 4",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ThemeProvider>
      {history.length > DEFAULT_VISIBLE_TESTS && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/10 text-xs font-medium text-accent hover:bg-accent/15 hover:border-accent/30 active:scale-95 transition-all"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showAll ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
            {showAll
              ? `Show last ${DEFAULT_VISIBLE_TESTS} tests`
              : `Show full history (${history.length} tests)`}
          </button>
        </div>
      )}
    </div>
  );
}
