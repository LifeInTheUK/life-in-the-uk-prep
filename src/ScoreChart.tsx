"use client";

import { useId, useRef, useState } from "react";
import type { ScaleLinear } from "@mui/x-charts-vendor/d3-scale";
import { ThemeProvider } from "@mui/material/styles";
import {
  LineChart,
  lineClasses,
  MarkElement,
  type MarkElementProps,
} from "@mui/x-charts/LineChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import { useYScale, useDrawingArea } from "@mui/x-charts/hooks";
import type { TestResult } from "./history";
import { useTheme } from "./themeContext";
import { getMuiTheme, CHART_TOKENS } from "./muiTheme";

const PASS_MARK = 75;
const DEFAULT_VISIBLE_TESTS = 15;

function PassFailGradient({
  id,
  color1,
  color2,
}: {
  id: string;
  color1: string;
  color2: string;
}) {
  const { top, height, bottom } = useDrawingArea();
  const svgHeight = top + bottom + height;
  const scale = useYScale() as ScaleLinear<number, number>;
  const y0 = scale(PASS_MARK);
  const off = y0 !== undefined ? y0 / svgHeight : 0;

  return (
    <defs>
      <linearGradient
        id={id}
        x1="0"
        x2="0"
        y1="0"
        y2={`${svgHeight}px`}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={off} stopColor={color1} stopOpacity={1} />
        <stop offset={off} stopColor={color2} stopOpacity={1} />
      </linearGradient>
    </defs>
  );
}

type ScoreMarkData = { scores: number[]; tokens: typeof CHART_TOKENS.light };

function useScoreMark(data: ScoreMarkData) {
  const dataRef = useRef<ScoreMarkData>(data);
  dataRef.current = data;

  const markRef =
    useRef<(props: MarkElementProps) => React.JSX.Element>(undefined);
  if (!markRef.current) {
    markRef.current = (props: MarkElementProps) => {
      const { scores, tokens } = dataRef.current;
      const passed = scores[props.dataIndex] >= PASS_MARK;
      return (
        <MarkElement {...props} color={passed ? tokens.good : tokens.bad} />
      );
    };
  }
  return markRef.current;
}

export default function ScoreChart({ history }: { history: TestResult[] }) {
  const { isDark } = useTheme();
  const [showAll, setShowAll] = useState(false);

  const hasMore = history.length > DEFAULT_VISIBLE_TESTS;
  const isCapped = !showAll && hasMore;
  const visibleHistory = isCapped
    ? history.slice(-DEFAULT_VISIBLE_TESTS)
    : history;
  const offset = history.length - visibleHistory.length;

  const labels = visibleHistory.map((_, i) => `Test ${offset + i + 1}`);
  const scores = visibleHistory.map((h) =>
    h.total > 0 ? Math.round((h.score / h.total) * 100) : 0,
  );
  const correctAnswers = visibleHistory.map((h) => h.score);
  const totals = visibleHistory.map((h) => h.total);
  const tokens = isDark ? CHART_TOKENS.dark : CHART_TOKENS.light;
  const ScoreMark = useScoreMark({ scores, tokens });
  const reactId = useId();
  const gradientId = `score-chart-pass-fail-${reactId}`;

  if (history.length === 0) {
    return (
      <p className="text-sm text-muted">
        Complete a test to see your progress here.
      </p>
    );
  }

  return (
    <div>
      <ThemeProvider theme={getMuiTheme(isDark)}>
        <LineChart
          height={250}
          xAxis={[{ data: labels, scaleType: "point" }]}
          yAxis={[
            {
              min: 0,
              max: 100,
              width: 0,
              disableLine: true,
              disableTicks: true,
            },
          ]}
          series={[
            {
              id: "score",
              label: "Score",
              data: scores,
              color: tokens.ink,
              area: true,
              showMark: true,
              curve: "monotoneX",
              valueFormatter: (v: number | null, { dataIndex }) =>
                v === null
                  ? ""
                  : `${v}% (${correctAnswers[dataIndex]}/${totals[dataIndex]} correct)`,
            },
          ]}
          grid={{ horizontal: true }}
          margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
          slots={{ mark: ScoreMark }}
          sx={{
            [`& .${lineClasses.area}`]: {
              fill: `url(#${gradientId})`,
              fillOpacity: 0.55,
              filter: "none",
            },
            [`& .${lineClasses.line}`]: {
              strokeWidth: 2,
            },
          }}
          hideLegend
        >
          <PassFailGradient
            id={gradientId}
            color1={tokens.good}
            color2={tokens.bad}
          />
          <ChartsReferenceLine
            y={PASS_MARK}
            label="Pass mark (75%)"
            labelAlign="start"
            labelStyle={{
              fontSize: 11,
              fontWeight: 600,
              fill: tokens.ink,
              stroke: tokens.surface,
              strokeWidth: 4,
              paintOrder: "stroke",
            }}
            lineStyle={{
              stroke: tokens.muted,
              strokeDasharray: "6 4",
              strokeWidth: 1.5,
            }}
          />
        </LineChart>
      </ThemeProvider>
      {hasMore && (
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
