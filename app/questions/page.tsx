import type { Metadata } from "next";
import Link from "next/link";
import { questions } from "@/src/questions";

const PAGE_SIZE = 30;

export const metadata: Metadata = {
  title: "Question Bank",
  description:
    "Browse the full Life in the UK practice question bank, with correct answers and explanations.",
};

function isCorrectOption(a: number | number[], index: number): boolean {
  return Array.isArray(a) ? a.includes(index) : a === index;
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const totalPages = Math.max(1, Math.ceil(questions.length / PAGE_SIZE));
  const page = Math.min(Math.max(Number(pageParam) || 1, 1), totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const pageQuestions = questions.slice(start, start + PAGE_SIZE);

  return (
    <div className="order-2 sm:order-3 flex flex-col gap-5 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 py-2 sm:p-7">
      <div>
        <h2 className="text-lg font-semibold">Question Bank</h2>
        <p className="text-xs text-muted mt-1">
          {questions.length} questions and answers &middot; page {page} of{" "}
          {totalPages}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {pageQuestions.map((question, i) => (
          <li
            key={question.id}
            className="p-4 border border-line rounded-xl bg-surface"
          >
            <p className="text-sm font-medium mb-3">
              {start + i + 1}. {question.q}
            </p>
            <ul className="flex flex-col gap-1.5 mb-3">
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
            <p className="text-xs text-muted leading-relaxed">{question.ex}</p>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-2">
        {page > 1 ? (
          <Link
            href={`/questions?page=${page - 1}`}
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
            href={`/questions?page=${page + 1}`}
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
