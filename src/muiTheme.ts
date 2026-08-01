import { createTheme, type Theme } from "@mui/material/styles";

// Mirrors src/style.css's @theme tokens (light) and .dark overrides, so MUI X
// charts stay visually consistent with the rest of the (otherwise all-Tailwind)
// UI in both modes without a runtime CSS-var read (avoids an SSR/client mismatch
// since ThemeProvider needs a theme object synchronously at render time).
const TOKENS = {
    light: {
        surface: "#ffffff",
        line: "#e5e7eb",
        ink: "#0f172a",
        muted: "#64748b",
        accent: "#4f46e5",
        good: "#16a34a",
        bad: "#dc2626",
    },
    dark: {
        surface: "#1a1d24",
        line: "#2a2e37",
        ink: "#f1f2f4",
        muted: "#9099a8",
        accent: "#818cf8",
        good: "#34d399",
        bad: "#f87171",
    },
};

export function getMuiTheme(isDark: boolean): Theme {
    const t = isDark ? TOKENS.dark : TOKENS.light;
    return createTheme({
        cssVariables: false,
        palette: {
            mode: isDark ? "dark" : "light",
            primary: { main: t.accent },
            success: { main: t.good },
            error: { main: t.bad },
            text: { primary: t.ink, secondary: t.muted },
            divider: t.line,
            background: { paper: t.surface },
        },
        typography: {
            fontFamily: "Inter, ui-sans-serif, sans-serif",
        },
    });
}

export const CHART_TOKENS = TOKENS;
