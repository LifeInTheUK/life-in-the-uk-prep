"use client";

import { topicLabel } from "../topics";
import { formatAnswer } from "./formatAnswer";
import type { AnsweredQuestionRecord } from "./types";

function ReviewAnswerRow({ record, index }: { record: AnsweredQuestionRecord; index: number }) {
  const { isCorrect } = record;
  return (
    <li className="border border-line rounded-xl bg-surface overflow-hidden transition-shadow hover:shadow-md hover:shadow-slate-200/60 dark:hover:shadow-none">
      <details className="group">
        <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-3 min-w-0 min-h-10">
            <span className="text-xs text-muted tabular shrink-0">{index + 1}.</span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 ${isCorrect ? "text-good" : "text-bad"}`}
            >
              {isCorrect ? "Correct" : "Incorrect"}
            </span>
            <span className="text-sm font-medium line-clamp-2">{record.q}</span>
          </span>
          <svg
            className="w-4 h-4 text-muted shrink-0 transition-transform group-open:rotate-180"
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
        </summary>
        <div className="px-4 pb-4 pt-1 border-t border-line">
          <p className="text-sm font-medium mt-3 mb-2">{record.q}</p>
          <p className="text-xs text-muted mb-2">{topicLabel(record.topic)}</p>
          {!isCorrect && (
            <p className="text-xs text-muted mb-1">
              Your answer:{" "}
              <span className="text-bad">
                {formatAnswer(record.o, record.selectedOriginal)}
              </span>
            </p>
          )}
          <p className="text-xs text-muted mb-2">
            Correct answer:{" "}
            <span className="text-good">
              {formatAnswer(record.o, record.correctAnswer)}
            </span>
          </p>
          <p className="text-sm text-muted leading-relaxed">{record.explanation}</p>
        </div>
      </details>
    </li>
  );
}

// Read-only per-session review of the test just taken. Every field comes from
// the record itself — unlike /review's ReviewRow, there's no useProgress() or
// loadQuestions() lookup, so this renders instantly with no fetch.
export default function ReviewAnswersList({
  answerHistory,
}: {
  answerHistory: AnsweredQuestionRecord[];
}) {
  if (answerHistory.length === 0) {
    return (
      <p id="session-review-empty" className="text-sm text-muted py-4 text-center">
        You didn&apos;t answer any questions in this test.
      </p>
    );
  }

  return (
    <ul id="session-review-list" className="flex flex-col gap-3 pt-2">
      {answerHistory.map((record, i) => (
        <ReviewAnswerRow key={`${record.questionId}-${i}`} record={record} index={i} />
      ))}
    </ul>
  );
}
