"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import SignInNudge from "./SignInNudge";
import Skeleton from "./Skeleton";
import { submitQuestionProposal } from "./proposeQuestion";
import { TOPIC_ORDER, topicLabel } from "./topics";

const MAX_QUESTION_LENGTH = 500;
const MAX_OPTION_LENGTH = 200;
const MAX_EXPLANATION_LENGTH = 1000;
const MAX_OPTIONS = 6;

type OptionRow = { text: string; correct: boolean };

function emptyRows(): OptionRow[] {
  return [
    { text: "", correct: false },
    { text: "", correct: false },
  ];
}

export default function ProposeQuestionPage() {
  const { data: session, isPending } = authClient.useSession();

  const [question, setQuestion] = useState("");
  const [rows, setRows] = useState<OptionRow[]>(emptyRows());
  const [explanation, setExplanation] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [ok, setOk] = useState(true);
  const [reason, setReason] = useState<"rate_limited" | "invalid" | "other">("other");

  if (isPending) {
    return (
      <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
        <h2 className="text-lg font-semibold">Propose a question</h2>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
        <h2 className="text-lg font-semibold">Propose a question</h2>
        <SignInNudge
          title="Sign in to propose a question"
          body="Suggest a new question for the test bank — sign in to submit it for review."
          callbackURL="/propose-question"
        />
        <Link
          href="/"
          className="self-start text-sm font-medium text-muted hover:text-ink transition-colors"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const nonEmptyRows = rows.filter((r) => r.text.trim().length > 0);
  const optionsProvided = nonEmptyRows.length > 0;
  const optionsValid =
    !optionsProvided || (nonEmptyRows.length >= 2 && nonEmptyRows.some((r) => r.correct));
  const canSubmit = question.trim().length > 0 && optionsValid && status !== "submitting";

  function updateText(idx: number, text: string) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, text } : r)));
  }

  function toggleCorrect(idx: number) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, correct: !r.correct } : r)));
  }

  function addRow() {
    setRows((prev) => (prev.length >= MAX_OPTIONS ? prev : [...prev, { text: "", correct: false }]));
  }

  function removeRow(idx: number) {
    setRows((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== idx)));
  }

  function reset() {
    setQuestion("");
    setRows(emptyRows());
    setExplanation("");
    setTopic("");
    setStatus("idle");
  }

  async function submit() {
    if (!canSubmit) return;
    setStatus("submitting");

    const options = optionsProvided ? nonEmptyRows.map((r) => r.text.trim()) : undefined;
    const answerIndices = nonEmptyRows
      .map((r, i) => (r.correct ? i : -1))
      .filter((i) => i !== -1);
    const answer = optionsProvided
      ? answerIndices.length === 1
        ? answerIndices[0]
        : answerIndices
      : undefined;

    const result = await submitQuestionProposal({
      question: question.trim(),
      options,
      answer,
      explanation: explanation.trim() || undefined,
      topic: topic || undefined,
    });

    if (result.ok) {
      setOk(true);
    } else {
      setOk(false);
      setReason(result.reason);
    }
    setStatus("done");
  }

  if (status === "done" && ok) {
    return (
      <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
        <h2 className="text-lg font-semibold">Thanks — submitted for review</h2>
        <p className="text-sm text-muted">
          Your proposed question has been sent to the team for review.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="text-sm font-medium text-accent hover:opacity-80 transition-opacity"
          >
            Propose another
          </button>
          <Link
            href="/profile"
            className="text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            Back to profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
      <h2 className="text-lg font-semibold">Propose a question</h2>
      <p className="text-sm text-muted">
        Suggest a new question for the test bank. Answer options are optional
        — you can just propose the question text and let the team fill in the
        rest.
      </p>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-ink">Question</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          rows={3}
          placeholder="e.g. What is the capital of Scotland?"
          className="w-full text-sm bg-bg border border-line rounded-lg p-3 focus:outline-none focus:border-accent transition-colors resize-none"
        />
        <p className="text-[11px] text-muted text-right tabular">
          {question.length}/{MAX_QUESTION_LENGTH}
        </p>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-line">
        <label className="text-sm font-semibold text-ink">
          Options <span className="text-muted font-normal">(optional)</span>
        </label>
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={row.correct}
              onChange={() => toggleCorrect(idx)}
              aria-label={`Mark option ${idx + 1} as correct`}
              className="shrink-0 w-4 h-4 accent-accent"
            />
            <input
              type="text"
              value={row.text}
              onChange={(e) => updateText(idx, e.target.value)}
              maxLength={MAX_OPTION_LENGTH}
              placeholder={`Option ${idx + 1}`}
              className="flex-1 min-w-0 text-sm bg-bg border border-line rounded-lg p-2.5 focus:outline-none focus:border-accent transition-colors"
            />
            {rows.length > 2 && (
              <button
                type="button"
                aria-label={`Remove option ${idx + 1}`}
                onClick={() => removeRow(idx)}
                className="shrink-0 text-muted hover:text-bad transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {rows.length < MAX_OPTIONS && (
          <button
            type="button"
            onClick={addRow}
            className="self-start text-sm font-medium text-accent hover:opacity-80 transition-opacity"
          >
            + Add option
          </button>
        )}
        {optionsProvided && !optionsValid && (
          <p className="text-xs text-bad">
            Provide at least 2 options and check the correct one(s).
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-line">
        <label className="text-sm font-semibold text-ink">
          Explanation <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          maxLength={MAX_EXPLANATION_LENGTH}
          rows={2}
          placeholder="Why is this the correct answer?"
          className="w-full text-sm bg-bg border border-line rounded-lg p-3 focus:outline-none focus:border-accent transition-colors resize-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-ink">
          Topic <span className="text-muted font-normal">(optional)</span>
        </label>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full text-sm bg-bg border border-line rounded-lg p-2.5 focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">— No specific topic —</option>
          {TOPIC_ORDER.map((t) => (
            <option key={t} value={t}>
              {topicLabel(t)}
            </option>
          ))}
        </select>
      </div>

      {status === "done" && !ok && (
        <p className="text-sm text-bad">
          {reason === "rate_limited"
            ? "Too many submissions — try again later."
            : reason === "invalid"
              ? "Something in the form isn't valid — check your options and answer."
              : "Something went wrong, try again later."}
        </p>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={submit}
        className="w-full bg-accent hover:bg-accent-dark text-white font-medium text-sm py-2.5 px-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {status === "submitting" ? "Submitting..." : "Submit proposal"}
      </button>
    </div>
  );
}
