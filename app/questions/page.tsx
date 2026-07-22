import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { sql } from "@/src/db";
import type { Question } from "@/src/types";
import { TOPIC_ORDER, topicLabel } from "@/src/topics";
import { fuzzyScore } from "@/src/search";
import SearchBox from "@/src/SearchBox";

const PAGE_SIZE = 15;

export const metadata: Metadata = {
  title: "Question Bank",
  description:
    "Browse and search the full Life in the UK practice question bank, organised by category, with correct answers and explanations.",
};

function isCorrectOption(a: number | number[], index: number): boolean {
  return Array.isArray(a) ? a.includes(index) : a === index;
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; page?: string; q?: string }>;
}) {
  const { topic: topicParam, page: pageParam, q: qParam } = await searchParams;
  const query = (qParam ?? "").trim();
  const isSearching = query.length > 0;

  const rows = await sql`
    SELECT id, question, options, answer, explanation, topic
    FROM questions
    ORDER BY id
  `;
  const questions: Question[] = rows.map((row) => ({
    id: row.id,
    q: row.question,
    o: row.options,
    a: row.answer,
    ex: row.explanation,
    topic: row.topic ?? undefined,
  }));

  const topicsPresent = TOPIC_ORDER.filter((t) =>
    questions.some((q) => q.topic === t),
  );
  const selectedTopic = topicsPresent.includes(
    topicParam as (typeof TOPIC_ORDER)[number],
  )
    ? (topicParam as (typeof TOPIC_ORDER)[number])
    : topicsPresent[0];

  const matchedQuestions = isSearching
    ? questions
        .map((question) => ({
          question,
          score: fuzzyScore(query, question.q),
        }))
        .filter(
          (
            result,
          ): result is {
            question: (typeof questions)[number];
            score: number;
          } => result.score !== null,
        )
        .sort((a, b) => b.score - a.score)
        .map((result) => result.question)
    : null;

  const resultQuestions =
    matchedQuestions ?? questions.filter((q) => q.topic === selectedTopic);
  const totalPages = Math.max(1, Math.ceil(resultQuestions.length / PAGE_SIZE));
  const page = Math.min(Math.max(Number(pageParam) || 1, 1), totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const pageQuestions = resultQuestions.slice(start, start + PAGE_SIZE);
  const pageHref = (p: number) =>
    isSearching
      ? `/questions?q=${encodeURIComponent(query)}&page=${p}`
      : `/questions?topic=${selectedTopic}&page=${p}`;

  return (
    <div className="order-3 flex flex-col gap-5 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
      <div>
        <h2 className="text-lg font-semibold">Question Bank</h2>
        <p className="text-xs text-muted mt-1">
          {questions.length} questions and answers, organised by category
        </p>
      </div>

      <Suspense fallback={<div className="h-[42px]" />}>
        <SearchBox />
      </Suspense>

      {isSearching ? (
        <p className="text-xs text-muted -mt-2 flex items-center gap-2">
          {resultQuestions.length} result
          {resultQuestions.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          <Link
            href="/questions"
            className="text-accent hover:text-accent-dark font-medium"
          >
            Clear
          </Link>
        </p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2">
            {topicsPresent.map((t) => {
              const count = questions.filter((q) => q.topic === t).length;
              const active = t === selectedTopic;
              return (
                <li key={t}>
                  <Link
                    href={`/questions?topic=${t}`}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 transition-colors ${
                      active
                        ? "bg-accent text-white"
                        : "bg-accent/10 text-accent hover:bg-accent/20"
                    }`}
                  >
                    {topicLabel(t)}
                    <span
                      className={active ? "text-white/80" : "text-accent/70"}
                    >
                      {count}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="text-xs text-muted -mt-2">
            {resultQuestions.length} questions in this category &middot; page{" "}
            {page} of {totalPages}
          </p>
        </>
      )}

      {pageQuestions.length === 0 && (
        <p className="text-sm text-muted py-6 text-center">
          No questions match &ldquo;{query}&rdquo;.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {pageQuestions.map((question, i) => (
          <li
            key={question.id}
            className="p-4 border border-line rounded-xl bg-surface"
          >
            <p className="text-sm font-medium mb-3">
              {start + i + 1}. {question.q}
            </p>
            <ul className="flex flex-col gap-1.5">
              {question.o.map((option, i) => {
                const correct = isCorrectOption(question.a, i);
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                      correct ? "bg-good-soft text-ink" : "text-muted"
                    }`}
                  >
                    {correct ? (
                      <svg
                        className="w-4 h-4 text-good flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span className="w-4 h-4 flex-shrink-0" />
                    )}
                    {option}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-2">
        {page > 1 ? (
          <Link
            href={pageHref(page - 1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-dark"
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
          </Link>
        ) : (
          <span />
        )}
        <span className="text-xs text-muted">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={pageHref(page + 1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-dark"
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
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
