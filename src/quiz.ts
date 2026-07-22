import type { Question, SessionQuestion } from "./types";
import { getSM2, saveSM2, updateGlobalAccuracy, calculateSM2 } from "./sm2";
import { addResult } from "./history";
import { topicLabel } from "./topics";
import { SESSION_SIZE } from "./config";
import {
  hasReported,
  markReported,
  submitFeedback,
  type FeedbackCategory,
} from "./feedback";

let questions: Question[] = [];

async function loadQuestions(): Promise<Question[]> {
  if (questions.length > 0) return questions;
  const res = await fetch("/api/questions");
  questions = await res.json();
  return questions;
}

let sessionQueue: SessionQuestion[] = [];
let firstTryScore = 0;
let initialQuestionsCount = SESSION_SIZE;
let answered = false;
let currentQuestion: SessionQuestion | null = null;
let selectedOptions: number[] = []; // Track selections for multiple-choice questions
let currentDisplayOptions: { text: string; originalIndex: number }[] = []; // Track shuffled options for mapping original indices

// Queried lazily inside initQuiz() rather than at module load time, since
// these nodes are rendered by React (QuizPage/Layout) and don't exist yet
// when this module is first imported.
let container: HTMLElement;
let feedback: HTMLElement;
let nextBtn: HTMLButtonElement;
let restartBtn: HTMLButtonElement;
let homeBtn: HTMLElement;
let scoreEl: HTMLElement;
let totalQuestionsEl: HTMLElement;
let keydownListenerAttached = false;

const ENTER_KBD = `<kbd class="hidden sm:inline-flex items-center justify-center px-1.5 h-5 text-[11px] font-mono rounded border border-white/30 bg-white/10">↵</kbd>`;

const REPORT_CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: "typo", label: "Typo / spelling" },
  { value: "wrong_info", label: "Wrong or outdated info" },
  { value: "confusing", label: "Confusing wording" },
  { value: "duplicate", label: "Duplicate question" },
];

function reportButtonHtml(questionId: number): string {
  if (hasReported(questionId)) return "";
  return `<button type="button" data-report-btn="${questionId}" aria-label="Report an issue with this question" class="inline-flex items-center justify-center w-6 h-6 rounded-full text-muted hover:text-bad hover:bg-bad-soft transition-colors">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3v18M3 4h13l-2 4 2 4H3"></path></svg>
    </button>`;
}

function showReportModal(questionId: number): void {
  let selected: FeedbackCategory | null = null;

  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50";
  overlay.innerHTML = `
        <div class="bg-surface border border-line rounded-xl p-5 w-full max-w-sm">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold">Report a problem</h3>
                <button type="button" data-report-close aria-label="Close" class="text-muted hover:text-ink">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="space-y-2 mb-4">
                ${REPORT_CATEGORIES.map(
                  (c) =>
                    `<button type="button" data-report-category="${c.value}" class="w-full text-left text-sm p-3 border-2 border-line rounded-lg hover:border-accent transition-colors">${c.label}</button>`,
                ).join("")}
            </div>
            <button type="button" data-report-submit disabled class="w-full bg-accent hover:bg-accent-dark text-white font-medium text-sm py-2.5 px-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all">Submit</button>
        </div>
    `;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  const submitBtn = overlay.querySelector(
    "[data-report-submit]",
  ) as HTMLButtonElement;

  overlay.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (target === overlay || target.closest("[data-report-close]")) {
      close();
      return;
    }

    const categoryBtn = target.closest(
      "[data-report-category]",
    ) as HTMLElement | null;
    if (categoryBtn) {
      selected = categoryBtn.dataset.reportCategory as FeedbackCategory;
      overlay.querySelectorAll("[data-report-category]").forEach((btn) => {
        btn.classList.remove(
          "border-accent",
          "bg-accent",
          "text-white",
          "font-semibold",
        );
        btn.classList.add("border-line");
      });
      categoryBtn.classList.remove("border-line");
      categoryBtn.classList.add(
        "border-accent",
        "bg-accent",
        "text-white",
        "font-semibold",
      );
      submitBtn.disabled = false;
      return;
    }

    if (target.closest("[data-report-submit]") && selected) {
      submitBtn.disabled = true;
      submitFeedback(questionId, selected).then((ok) => {
        if (ok) markReported(questionId);
        overlay.querySelector(".space-y-2")!.innerHTML = "";
        submitBtn.classList.add("hidden");
        const heading = overlay.querySelector("h3")!;
        heading.textContent = ok
          ? "Thanks — reported"
          : "Something went wrong, try again later";
        setTimeout(close, 1200);
      });
      const reportBtn = document.querySelector(
        `[data-report-btn="${questionId}"]`,
      );
      reportBtn?.remove();
    }
  });
}

const SESSION_STORAGE_KEY = "ukTestSession";

interface StoredSession {
  sessionQueue: SessionQuestion[];
  firstTryScore: number;
  initialQuestionsCount: number;
}

function saveSession(): void {
  const stored: StoredSession = {
    sessionQueue,
    firstTryScore,
    initialQuestionsCount,
  };
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored));
}

function clearSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

function restoreSession(): boolean {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return false;

  try {
    const stored = JSON.parse(raw) as StoredSession;
    if (
      !Array.isArray(stored.sessionQueue) ||
      stored.sessionQueue.length === 0
    ) {
      return false;
    }

    sessionQueue = stored.sessionQueue;
    firstTryScore = stored.firstTryScore;
    initialQuestionsCount = stored.initialQuestionsCount;
    scoreEl.textContent = `${firstTryScore} / ${initialQuestionsCount}`;
    restartBtn.classList.add("hidden");
    homeBtn.classList.add("hidden");

    updateGlobalAccuracy();
    render();
    return true;
  } catch {
    return false;
  }
}

export function startSession(): void {
  // Load SM2 data and sort so past-due questions come first
  // Also prioritize those with lower historical accuracy
  const allWithSM2: SessionQuestion[] = questions.map((q: Question) => {
    const sm2Data = getSM2(q.id);
    const accuracy =
      sm2Data.attempts > 0 ? sm2Data.correct / sm2Data.attempts : 0;
    return {
      ...q,
      sm2: sm2Data,
      accuracy: accuracy,
      isFirstTry: true,
    };
  });

  // Shuffle first so questions with equal priority (e.g. all unseen) come
  // out in random order instead of array order.
  for (let i = allWithSM2.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allWithSM2[i], allWithSM2[j]] = [allWithSM2[j], allWithSM2[i]];
  }

  allWithSM2.sort((a, b) => {
    if (a.sm2.next !== b.sm2.next) {
      return a.sm2.next - b.sm2.next; // Overdue first
    }
    return a.accuracy - b.accuracy; // Lowest accuracy first
  });

  // Limit session to the configured test length
  sessionQueue = allWithSM2.slice(0, SESSION_SIZE);
  initialQuestionsCount = sessionQueue.length;
  firstTryScore = 0;
  scoreEl.textContent = `${firstTryScore} / ${initialQuestionsCount}`;
  restartBtn.classList.add("hidden");
  homeBtn.classList.add("hidden");

  updateGlobalAccuracy();
  saveSession();
  render();
}

function render(): void {
  if (sessionQueue.length === 0) {
    showResults();
    return;
  }

  answered = false;
  selectedOptions = [];
  currentQuestion = sessionQueue[0];
  const isMulti = Array.isArray(currentQuestion.a);

  currentDisplayOptions = currentQuestion.o.map((text, originalIndex) => ({
    text,
    originalIndex,
  }));
  for (let i = currentDisplayOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [currentDisplayOptions[i], currentDisplayOptions[j]] = [
      currentDisplayOptions[j],
      currentDisplayOptions[i],
    ];
  }

  nextBtn.classList.add("hidden");
  feedback.classList.add("hidden");

  const itemNo = initialQuestionsCount - sessionQueue.length + 1;
  const progressPct = Math.round(((itemNo - 1) / initialQuestionsCount) * 100);

  container.innerHTML = `
                <div class="mb-4">
                    <div class="flex justify-between items-baseline text-xs text-muted mb-2 tabular">
                        <span>Question ${itemNo} of ${initialQuestionsCount}</span>
                        ${isMulti ? `<span class="text-accent font-medium">Select ${(currentQuestion.a as number[]).length}</span>` : ""}
                    </div>
                    <div class="h-1.5 bg-line rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all relative overflow-hidden" style="width: ${progressPct}%; background: linear-gradient(90deg, var(--color-accent-dark), var(--color-accent));">
                            <div class="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-white/80 to-transparent"></div>
                        </div>
                    </div>
                </div>
                <span class="inline-block text-xs font-medium text-accent bg-accent/10 rounded-full px-2.5 py-1 mb-3">${topicLabel(currentQuestion.topic)}</span>
                <h2 id="question-heading" class="text-lg sm:text-xl font-semibold leading-snug mb-5">${currentQuestion.q}</h2>
                <div class="space-y-2" role="${isMulti ? "group" : "radiogroup"}" aria-labelledby="question-heading">
                    ${currentDisplayOptions
                      .map(
                        (optObj, i) => `
                        <button data-idx="${i}" role="${isMulti ? "checkbox" : "radio"}" aria-checked="false" class="group w-full text-left p-4 border border-line rounded-xl hover:border-accent hover:bg-accent/5 active:bg-accent/10 active:scale-[0.98] transition-all option-btn flex justify-between items-center gap-3">
                            <span class="flex items-center gap-3">
                                <kbd class="hidden sm:inline text-sm font-mono font-medium tabular-nums text-muted/80 tracking-tight shrink-0">[${i + 1}]</kbd>
                                <span>${optObj.text}</span>
                            </span>
                            ${isMulti ? `<div class="w-5 h-5 border-2 shrink-0 checkbox-indicator flex items-center justify-center transition-colors"></div>` : ""}
                        </button>
                    `,
                      )
                      .join("")}
                </div>
                ${isMulti ? `<button id="submit-multi-btn" class="mt-5 w-full bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-3 px-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2" disabled>Check Answers <kbd class="hidden sm:inline-flex items-center justify-center px-1.5 h-5 text-[11px] font-mono rounded border border-white/30 bg-white/10">↵</kbd></button>` : ""}
            `;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  container.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}

function handleOptionClick(idx: number): void {
  if (answered) return;
  const isMulti = Array.isArray(currentQuestion!.a);

  if (!isMulti) {
    checkSingle(idx);
  } else {
    toggleOption(idx);
  }
}

function toggleOption(idx: number): void {
  const btn = document.querySelectorAll(".option-btn")[idx];
  const checkbox = btn.querySelector(".checkbox-indicator");
  const idxInArray = selectedOptions.indexOf(idx);

  if (idxInArray > -1) {
    selectedOptions.splice(idxInArray, 1);
    btn.classList.remove("bg-accent/10", "border-accent");
    btn.setAttribute("aria-checked", "false");
    if (checkbox) {
      checkbox.classList.remove("bg-accent", "border-accent");
      checkbox.innerHTML = "";
    }
  } else {
    const requiredCount = (currentQuestion!.a as number[]).length;
    if (selectedOptions.length < requiredCount) {
      selectedOptions.push(idx);
      btn.classList.add("bg-accent/10", "border-accent");
      btn.setAttribute("aria-checked", "true");
      if (checkbox) {
        checkbox.classList.add("bg-accent", "border-accent");
        checkbox.innerHTML = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>`;
      }
    }
  }

  const submitBtn = document.getElementById(
    "submit-multi-btn",
  ) as HTMLButtonElement | null;
  if (submitBtn) {
    submitBtn.disabled =
      selectedOptions.length !== (currentQuestion!.a as number[]).length;
  }
}

function processResult(isCorrect: boolean, selected: number | number[]): void {
  const question = currentQuestion!;
  let qStats = getSM2(question.id);

  // Track total attempts and correct answers for accuracy tracking (only count first try of session)
  if (question.isFirstTry) {
    qStats.attempts = (qStats.attempts || 0) + 1;
    if (isCorrect) {
      qStats.correct = (qStats.correct || 0) + 1;
    }
  }

  if (isCorrect) {
    if (question.isFirstTry) {
      firstTryScore++;
      scoreEl.textContent = `${firstTryScore} / ${initialQuestionsCount}`;
    }

    const acc = Math.round(
      ((qStats.correct || 0) / (qStats.attempts || 1)) * 100,
    );
    feedback.innerHTML = `<div class="flex items-center justify-between gap-3 mb-2">
                    <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-good">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                        Correct
                    </span>
                    <span class="flex items-center gap-2 text-xs text-muted tabular">
                        ${acc}% historical
                        ${reportButtonHtml(question.id)}
                    </span>
                </div>
                <p class="text-sm text-muted leading-relaxed">${question.ex}</p>`;

    question.sm2 = calculateSM2(question.sm2, 4);
    question.sm2.attempts = qStats.attempts;
    question.sm2.correct = qStats.correct;
    question.sm2.lastCorrect = true;
    question.sm2.lastSelected = selected;
    saveSM2(question.id, question.sm2);

    sessionQueue.shift();
  } else {
    const acc = Math.round(
      ((qStats.correct || 0) / (qStats.attempts || 1)) * 100,
    );
    feedback.innerHTML = `<div class="flex items-center justify-between gap-3 mb-2">
                    <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-bad">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                        Incorrect
                    </span>
                    <span class="flex items-center gap-2 text-xs text-muted tabular">
                        ${acc}% historical
                        ${reportButtonHtml(question.id)}
                    </span>
                </div>
                <p class="text-sm text-muted leading-relaxed">${question.ex}</p>`;

    question.sm2 = calculateSM2(question.sm2, 1);
    question.sm2.attempts = qStats.attempts;
    question.sm2.correct = qStats.correct;
    question.sm2.lastCorrect = false;
    question.sm2.lastSelected = selected;
    saveSM2(question.id, question.sm2);

    // Remove from current session instead of pushing to back
    sessionQueue.shift();
  }

  feedback.classList.remove("hidden");
  nextBtn.classList.remove("hidden");
  nextBtn.innerHTML =
    sessionQueue.length === 0
      ? `View Results ${ENTER_KBD}`
      : `Next Question ${ENTER_KBD}`;

  document
    .querySelectorAll(".option-btn")
    .forEach((btn) => btn.setAttribute("aria-disabled", "true"));

  const submitBtn = document.getElementById("submit-multi-btn");
  if (submitBtn) submitBtn.classList.add("hidden");

  saveSession();
}

function checkSingle(idx: number): void {
  answered = true;
  const buttons = document.querySelectorAll(".option-btn");

  const originalIdx = currentDisplayOptions[idx].originalIndex;
  const isCorrect = originalIdx === currentQuestion!.a;
  const correctRenderedIdx = currentDisplayOptions.findIndex(
    (opt) => opt.originalIndex === currentQuestion!.a,
  );

  buttons[idx].setAttribute("aria-checked", "true");

  if (isCorrect) {
    buttons[idx].classList.add("correct");
  } else {
    buttons[idx].classList.add("incorrect");
    buttons[correctRenderedIdx].classList.add("correct");
  }

  processResult(isCorrect, originalIdx);
}

function checkMulti(): void {
  answered = true;
  const buttons = document.querySelectorAll(".option-btn");

  const correctAnswers = [...(currentQuestion!.a as number[])].sort();
  const selectedOriginals = selectedOptions
    .map((renderedIdx) => currentDisplayOptions[renderedIdx].originalIndex)
    .sort();
  const isCorrect =
    JSON.stringify(correctAnswers) === JSON.stringify(selectedOriginals);

  selectedOptions.forEach((renderedIdx) => {
    const origIdx = currentDisplayOptions[renderedIdx].originalIndex;
    if ((currentQuestion!.a as number[]).includes(origIdx)) {
      buttons[renderedIdx].classList.add("correct");
      buttons[renderedIdx].classList.remove("bg-accent/10", "border-accent");
    } else {
      buttons[renderedIdx].classList.add("incorrect");
      buttons[renderedIdx].classList.remove("bg-accent/10", "border-accent");
    }
  });

  (currentQuestion!.a as number[]).forEach((origIdx) => {
    const renderedIdx = currentDisplayOptions.findIndex(
      (opt) => opt.originalIndex === origIdx,
    );
    if (!selectedOptions.includes(renderedIdx)) {
      buttons[renderedIdx].classList.add("correct");
    }
  });

  processResult(isCorrect, selectedOriginals);
}

function showResults(): void {
  clearSession();
  addResult(firstTryScore, initialQuestionsCount);
  nextBtn.classList.add("hidden");
  feedback.classList.add("hidden");
  const requiredToPass = Math.ceil(initialQuestionsCount * 0.75);
  const passed = firstTryScore >= requiredToPass;
  const scorePct = Math.round((firstTryScore / initialQuestionsCount) * 100);

  container.innerHTML = `
                <div class="text-center py-6 fade-in">
                    <div class="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5 ${passed ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}">
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${
                              passed
                                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>'
                                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>'
                            }
                        </svg>
                    </div>
                    <h2 class="text-xl font-semibold mb-2">${passed ? "Test passed" : "Test failed"}</h2>
                    <p class="text-sm text-muted mb-6">${
                      passed
                        ? "You met the 75% requirement for the official test."
                        : "You need 75% to pass the official test."
                    }</p>
                    <div class="flex items-center justify-center gap-2 mb-8 tabular">
                        <span class="text-4xl font-bold">${firstTryScore}</span>
                        <span class="text-xl text-muted">/ ${initialQuestionsCount}</span>
                        <span class="text-sm text-muted border-l border-line pl-3 ml-1">${scorePct}%</span>
                    </div>
                    <div class="bg-bg rounded-xl p-4 text-sm text-muted text-left">
                        <strong class="text-ink">Progress saved.</strong> Weak points have been logged and will be prioritised in your next practice test.
                    </div>
                </div>
            `;
  restartBtn.classList.remove("hidden");
  restartBtn.innerHTML = `Start New Test <kbd class="hidden sm:inline-flex items-center justify-center px-1.5 h-5 text-[11px] font-mono rounded border border-white/30 bg-white/10">↵</kbd>`;
  homeBtn.classList.remove("hidden");
}

export async function initQuiz(): Promise<void> {
  await loadQuestions();

  container = document.getElementById("quiz-container") as HTMLElement;
  feedback = document.getElementById("feedback-container") as HTMLElement;
  nextBtn = document.getElementById("next-btn") as HTMLButtonElement;
  restartBtn = document.getElementById("restart-btn") as HTMLButtonElement;
  homeBtn = document.getElementById("home-btn") as HTMLElement;
  scoreEl = document.getElementById("score") as HTMLElement;
  totalQuestionsEl = document.getElementById("total-questions") as HTMLElement;

  totalQuestionsEl.textContent = String(questions.length);

  container.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest(
      ".option-btn",
    ) as HTMLElement | null;
    if (btn) {
      handleOptionClick(Number(btn.dataset.idx));
      return;
    }
    const submitBtn = (e.target as HTMLElement).closest("#submit-multi-btn");
    if (submitBtn) {
      checkMulti();
    }
  });

  nextBtn.addEventListener("click", render);
  restartBtn.addEventListener("click", startSession);

  feedback.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest(
      "[data-report-btn]",
    ) as HTMLElement | null;
    if (btn) {
      showReportModal(Number(btn.dataset.reportBtn));
    }
  });

  if (!keydownListenerAttached) {
    keydownListenerAttached = true;
    document.addEventListener("keydown", (e) => {
      if (e.key >= "1" && e.key <= "9") {
        const optionButtons =
          document.querySelectorAll<HTMLButtonElement>(".option-btn");
        const idx = Number(e.key) - 1;
        if (idx < optionButtons.length) {
          e.preventDefault();
          optionButtons[idx].click();
        }
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        // A focused button already handles Enter/Space natively;
        // only step in when the key press isn't targeting one.
        if (document.activeElement instanceof HTMLButtonElement) return;

        const submitBtn = document.getElementById(
          "submit-multi-btn",
        ) as HTMLButtonElement | null;

        if (!nextBtn.classList.contains("hidden")) {
          e.preventDefault();
          nextBtn.click();
        } else if (!restartBtn.classList.contains("hidden")) {
          e.preventDefault();
          restartBtn.click();
        } else if (submitBtn && !submitBtn.disabled) {
          e.preventDefault();
          submitBtn.click();
        }
      }
    });
  }

  if (!restoreSession()) {
    startSession();
  }
}
