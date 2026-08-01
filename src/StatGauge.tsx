"use client";

import { ThemeProvider } from "@mui/material/styles";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { useTheme } from "./themeContext";
import { getMuiTheme, CHART_TOKENS } from "./muiTheme";

function colorFor(value: number, tokens: typeof CHART_TOKENS.light): string {
    if (value >= 75) return tokens.good;
    if (value >= 50) return tokens.accent;
    return tokens.bad;
}

export default function StatGauge({
    value,
    label,
    size = 88,
    color: colorOverride,
    variant = "card",
}: {
    value: number;
    label: string;
    size?: number;
    /** Force a specific arc color instead of the default good/accent/bad-by-value scale. */
    color?: string;
    /** "card" (default) wraps in a bordered tile; "bare" omits the border/background for embedding inside an existing card. */
    variant?: "card" | "bare";
}) {
    const { isDark } = useTheme();
    const tokens = isDark ? CHART_TOKENS.dark : CHART_TOKENS.light;
    const color = colorOverride ?? colorFor(value, tokens);

    return (
        <div
            className={
                variant === "card"
                    ? "rounded-xl border border-line bg-surface p-3 flex flex-col items-center justify-center gap-1"
                    : "flex flex-col items-center gap-1"
            }
        >
            <ThemeProvider theme={getMuiTheme(isDark)}>
                <Gauge
                    width={size}
                    height={size}
                    value={value}
                    valueMin={0}
                    valueMax={100}
                    startAngle={-110}
                    endAngle={110}
                    text={({ value: v }) => `${v}%`}
                    sx={{
                        [`& .${gaugeClasses.valueArc}`]: { fill: color },
                        [`& .${gaugeClasses.valueText}`]: {
                            fill: tokens.ink,
                            fontSize: 16,
                            fontWeight: 600,
                        },
                    }}
                />
            </ThemeProvider>
            <div className="text-[11px] text-muted text-center">{label}</div>
        </div>
    );
}
