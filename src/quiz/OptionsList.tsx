import type { SessionQuestion } from "../types";
import type { LastResult } from "./types";
import OptionButton from "./OptionButton";

export default function OptionsList({
  question,
  displayOptions,
  selectedOptions,
  answered,
  lastResult,
  onSelectOption,
  onSubmitMulti,
}: {
  question: SessionQuestion;
  displayOptions: { text: string; originalIndex: number }[];
  selectedOptions: number[];
  answered: boolean;
  lastResult: LastResult | null;
  onSelectOption: (idx: number) => void;
  onSubmitMulti: () => void;
}) {
  const isMulti = Array.isArray(question.a);
  const requiredCount = isMulti ? (question.a as number[]).length : 0;
  const selectedOriginals = answered && isMulti ? (lastResult?.selectedOriginal as number[]) ?? [] : [];

  function resultClassFor(originalIndex: number): "correct" | "incorrect" | null {
    if (!answered || !lastResult) return null;

    if (!isMulti) {
      if (originalIndex === lastResult.selectedOriginal) {
        return lastResult.isCorrect ? "correct" : "incorrect";
      }
      if (originalIndex === (question.a as number)) return "correct"; // reveal missed correct answer
      return null;
    }

    const correctOriginals = question.a as number[];
    if (selectedOriginals.includes(originalIndex)) {
      return correctOriginals.includes(originalIndex) ? "correct" : "incorrect";
    }
    if (correctOriginals.includes(originalIndex)) return "correct"; // reveal missed correct answer
    return null;
  }

  return (
    <>
      <div
        className="space-y-2"
        role={isMulti ? "group" : "radiogroup"}
        aria-labelledby="question-heading"
      >
        {displayOptions.map((opt, i) => (
          <OptionButton
            key={opt.originalIndex}
            idx={i}
            text={opt.text}
            isMulti={isMulti}
            toggled={
              answered
                ? selectedOriginals.includes(opt.originalIndex)
                : selectedOptions.includes(i)
            }
            resultClass={resultClassFor(opt.originalIndex)}
            ariaChecked={
              isMulti
                ? answered
                  ? selectedOriginals.includes(opt.originalIndex)
                  : selectedOptions.includes(i)
                : answered && opt.originalIndex === lastResult?.selectedOriginal
            }
            answered={answered}
            onClick={onSelectOption}
          />
        ))}
      </div>
      {isMulti && !answered && (
        <button
          type="button"
          id="submit-multi-btn"
          className="btn-shine mt-5 w-full bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-3 px-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          disabled={selectedOptions.length !== requiredCount}
          onClick={onSubmitMulti}
        >
          Check Answers{" "}
          <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 h-5 text-[11px] font-mono rounded border border-white/30 bg-white/10">
            ↵
          </kbd>
        </button>
      )}
    </>
  );
}
