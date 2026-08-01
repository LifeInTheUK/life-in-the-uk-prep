"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import type { SM2Data } from "./types";
import { TOPIC_ORDER, topicShortLabel } from "./topics";
import { useTheme } from "./themeContext";
import { getMuiTheme, CHART_TOKENS } from "./muiTheme";

interface QuestionTopic {
    id: number;
    topic?: string;
}

export default function TopicAccuracyChart({
    progress,
}: {
    progress: Record<number, SM2Data>;
}) {
    const { isDark } = useTheme();
    const [questionTopics, setQuestionTopics] = useState<QuestionTopic[] | null>(null);

    useEffect(() => {
        fetch("/api/questions/topics")
            .then((res) => res.json())
            .then(setQuestionTopics);
    }, []);

    if (questionTopics === null) return null;

    const byTopic = new Map<string, { attempts: number; correct: number }>();
    for (const t of TOPIC_ORDER) byTopic.set(t, { attempts: 0, correct: 0 });

    for (const q of questionTopics) {
        const sm2 = progress[q.id];
        if (!sm2 || sm2.attempts === 0) continue;
        const key = q.topic && byTopic.has(q.topic) ? q.topic : null;
        if (!key) continue;
        const bucket = byTopic.get(key)!;
        bucket.attempts += sm2.attempts;
        bucket.correct += sm2.correct;
    }

    const entries = TOPIC_ORDER.map((topic) => {
        const bucket = byTopic.get(topic)!;
        return {
            topic,
            label: topicShortLabel(topic),
            attempts: bucket.attempts,
            accuracy:
                bucket.attempts > 0
                    ? Math.round((bucket.correct / bucket.attempts) * 100)
                    : null,
        };
    })
        .filter((e) => e.attempts > 0)
        .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));

    if (entries.length === 0) {
        return (
            <p className="text-sm text-muted">
                Answer questions from different topics to see a breakdown here.
            </p>
        );
    }

    const tokens = isDark ? CHART_TOKENS.dark : CHART_TOKENS.light;

    return (
        <div>
            <ThemeProvider theme={getMuiTheme(isDark)}>
                <BarChart
                    height={Math.max(entries.length * 40, 100)}
                    layout="horizontal"
                    yAxis={[
                        {
                            data: entries.map((e) => e.label),
                            scaleType: "band",
                            tickLabelStyle: { fontSize: 11 },
                            width: "auto",
                        },
                    ]}
                    xAxis={[
                        { min: 0, max: 100, valueFormatter: (v: number) => `${v}%` },
                    ]}
                    series={[
                        {
                            data: entries.map((e) => e.accuracy),
                            color: tokens.accent,
                            valueFormatter: (v: number | null) =>
                                v === null ? "" : `${v}%`,
                        },
                    ]}
                    margin={{ left: 10, right: 20, top: 10, bottom: 30 }}
                    grid={{ vertical: true }}
                    hideLegend
                />
            </ThemeProvider>
            <p className="text-xs text-muted mt-2">
                Accuracy by topic, weakest first — only topics you've answered
                questions from are shown.
            </p>
        </div>
    );
}
