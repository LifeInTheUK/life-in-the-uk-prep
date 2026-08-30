"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { authClient } from "@/lib/auth/client";
import { useQuiz } from "./quiz/QuizContext";
import { canSubmitMulti, isMultiSelect } from "./quiz/derived";
import QuestionCard from "./quiz/QuestionCard";
import OptionsList from "./quiz/OptionsList";
import FeedbackPanel from "./quiz/FeedbackPanel";
import NavigationBar from "./quiz/NavigationBar";
import ResultsScreen from "./quiz/ResultsScreen";

const SignInPromptModal = dynamic(() => import("./quiz/SignInPromptModal"), { ssr: false });

function QuizPageInner() {
  const { state, start, selectOption, submitMulti, next, restart } = useQuiz();
  const { data: session, isPending } = authClient.useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const promptedRef = useRef(false);

  useEffect(() => {
    if (state.phase === "loading") start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.phase !== "results") {
      promptedRef.current = false;
      return;
    }
    if (!isPending && !session?.user && !promptedRef.current) {
      promptedRef.current = true;
      setShowSignInPrompt(true);
    }
  }, [state.phase, isPending, session]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      // Don't hijack keystrokes meant for a text field - e.g. ReportModal's
      // "Other" textarea (mounted on this page via FeedbackPanel), where
      // typing "1"-"9" or a space should type, not select an option / advance.
      const target = document.activeElement;
      if (
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      if (e.key >= "1" && e.key <= "9") {
        const idx = Number(e.key) - 1;
        if (idx < state.currentDisplayOptions.length) {
          e.preventDefault();
          selectOption(idx);
        }
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        // A focused button already handles Enter/Space natively; only step
        // in when the key press isn't targeting one, to avoid double-firing.
        if (document.activeElement instanceof HTMLButtonElement) return;

        if (state.phase === "active" && state.answered) {
          e.preventDefault();
          next();
        } else if (state.phase === "results") {
          e.preventDefault();
          restart();
        } else if (isMultiSelect(state) && canSubmitMulti(state)) {
          e.preventDefault();
          submitMulti();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [state, selectOption, submitMulti, next, restart]);

  useEffect(() => {
    if (!state.currentQuestion) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    containerRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [state.currentQuestion?.id]);

  if (state.phase === "loading") {
    return (
      <p className="order-1 text-sm text-muted py-8 text-center">Loading questions...</p>
    );
  }

  if (state.phase === "results") {
    return (
      <>
        <div id="quiz-container" className="order-1 fade-in">
          <ResultsScreen
            firstTryScore={state.firstTryScore}
            initialQuestionsCount={state.initialQuestionsCount}
            timedOut={state.endReason === "timeout"}
          />
        </div>
        <NavigationBar />
        {showSignInPrompt && (
          <SignInPromptModal
            score={state.firstTryScore}
            total={state.initialQuestionsCount}
            onClose={() => setShowSignInPrompt(false)}
          />
        )}
      </>
    );
  }

  const question = state.currentQuestion;
  if (!question) return null;

  const isMulti = Array.isArray(question.a);
  const itemNo = state.initialQuestionsCount - state.sessionQueue.length + (state.answered ? 0 : 1);

  return (
    <>
      <div id="quiz-container" ref={containerRef} className="order-1 fade-in">
        <QuestionCard
          question={question}
          itemNo={itemNo}
          total={state.initialQuestionsCount}
          isMulti={isMulti}
          requiredCount={isMulti ? (question.a as number[]).length : 0}
        />
        <OptionsList
          question={question}
          displayOptions={state.currentDisplayOptions}
          selectedOptions={state.selectedOptions}
          answered={state.answered}
          lastResult={state.lastResult}
          onSelectOption={selectOption}
          onSubmitMulti={submitMulti}
        />
      </div>
      <NavigationBar />
      <div
        id="feedback-container"
        className={"order-3 sm:order-2 mt-5 pt-5 border-t border-line" + (state.answered ? "" : " hidden")}
        role="status"
        aria-live="polite"
      >
        {state.answered && state.lastResult && <FeedbackPanel lastResult={state.lastResult} />}
      </div>
    </>
  );
}

export default function QuizPage() {
  return (
    <div className="order-2 sm:order-3 flex flex-col sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
      <QuizPageInner />
    </div>
  );
}
