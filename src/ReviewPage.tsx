"use client";

import { useEffect, useState } from "react";
import { getSM2 } from "./sm2";
import type { Question, SM2Data } from "./types";

function formatAnswer(o: string[], a: number | number[] | undefined): string {
  if (a === undefined) return "—";
  if (Array.isArray(a)) return a.map((i) => o[i]).join(", ");
  return o[a];
}

interface Attempted {
  question: Question;
  sm2: SM2Data;
}

function ReviewRow({ question, sm2 }: Attempted) {
  const isCorrect = sm2.lastCorrect;
  return (
    <li className="border border-line rounded-xl bg-surface overflow-hidden transition-shadow hover:shadow-md hover:shadow-slate-200/60 dark:hover:shadow-none">
      <details className="group">
        <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-3 min-w-0 min-h-10">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 ${isCorrect ? "text-good" : "text-bad"}`}
            >
              {isCorrect ? "Correct" : "Incorrect"}
            </span>
            <span className="text-sm font-medium line-clamp-2">
              {question.q}
            </span>
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
          <p className="text-sm font-medium mt-3 mb-2">{question.q}</p>
          <p className="text-xs text-muted tabular mb-2">
            {sm2.correct}/{sm2.attempts} correct overall
          </p>
          {!isCorrect && (
            <p className="text-xs text-muted mb-1">
              Your answer:{" "}
              <span className="text-bad">
                {formatAnswer(question.o, sm2.lastSelected)}
              </span>
            </p>
          )}
          <p className="text-xs text-muted mb-2">
            Correct answer:{" "}
            <span className="text-good">
              {formatAnswer(question.o, question.a)}
            </span>
          </p>
          <p className="text-sm text-muted leading-relaxed">{question.ex}</p>
        </div>
      </details>
    </li>
  );
}

const PAGE_SIZE = 15;

export default function ReviewPage() {
  const [attempted, setAttempted] = useState<Attempted[]>([]);
  const [tab, setTab] = useState<"incorrect" | "correct">("incorrect");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/questions")
      .then((res) => res.json())
      .then((qs: Question[]) => {
        const loaded = qs
          .map((question) => ({ question, sm2: getSM2(question.id) }))
          .filter((a) => a.sm2.attempts > 0);
        setAttempted(loaded);
        if (loaded.filter((a) => a.sm2.lastCorrect === false).length === 0) {
          setTab("correct");
        }
      });
  }, []);

  const incorrect = attempted.filter((a) => a.sm2.lastCorrect === false);
  const correct = attempted.filter((a) => a.sm2.lastCorrect === true);
  const shown = tab === "incorrect" ? incorrect : correct;
  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageShown = shown.slice(pageStart, pageStart + PAGE_SIZE);

  function selectTab(next: "incorrect" | "correct") {
    setTab(next);
    setPage(1);
  }

  return (
    <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
      <h2 className="text-lg font-semibold">Review answers</h2>

      {attempted.length === 0 ? (
        <p className="text-sm text-muted">
          You haven't answered any questions yet — start a test to build up your
          review list.
        </p>
      ) : (
        <>
          <div className="flex gap-2 border-b border-line" role="tablist">
            <button
              role="tab"
              aria-selected={tab === "incorrect"}
              onClick={() => selectTab("incorrect")}
              className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === "incorrect"
                  ? "text-bad border-bad"
                  : "text-muted border-transparent hover:text-ink"
              }`}
            >
              Incorrect ({incorrect.length})
            </button>
            <button
              role="tab"
              aria-selected={tab === "correct"}
              onClick={() => selectTab("correct")}
              className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === "correct"
                  ? "text-good border-good"
                  : "text-muted border-transparent hover:text-ink"
              }`}
            >
              Correct ({correct.length})
            </button>
          </div>

          {shown.length === 0 ? (
            <p className="text-sm text-muted">Nothing here yet.</p>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {pageShown.map((a) => (
                  <ReviewRow key={a.question.id} {...a} />
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </button>
                  <span className="text-xs text-muted">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Next
                    <svg
                      className="w-4 h-4"
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
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
