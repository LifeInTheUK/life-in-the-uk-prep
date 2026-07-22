export default function OptionButton({
  idx,
  text,
  isMulti,
  toggled,
  resultClass,
  ariaChecked,
  answered,
  onClick,
}: {
  idx: number;
  text: string;
  isMulti: boolean;
  toggled: boolean;
  resultClass: "correct" | "incorrect" | null;
  ariaChecked: boolean;
  answered: boolean;
  onClick: (idx: number) => void;
}) {
  const classes = [
    "group w-full text-left p-4 border border-line rounded-xl hover:border-accent hover:bg-accent/5 active:bg-accent/10 active:scale-[0.98] transition-all option-btn flex justify-between items-center gap-3",
  ];
  if (toggled && !resultClass) classes.push("bg-accent/10 border-accent");
  if (resultClass) classes.push(resultClass);

  return (
    <button
      type="button"
      data-idx={idx}
      role={isMulti ? "checkbox" : "radio"}
      aria-checked={ariaChecked}
      aria-disabled={answered}
      className={classes.join(" ")}
      onClick={() => onClick(idx)}
    >
      <span className="flex items-center gap-3">
        <kbd className="hidden sm:inline text-sm font-mono font-medium tabular-nums text-muted/80 tracking-tight shrink-0">
          [{idx + 1}]
        </kbd>
        <span>{text}</span>
      </span>
      {isMulti && (
        <div
          className={
            "w-5 h-5 border-2 shrink-0 checkbox-indicator flex items-center justify-center transition-colors" +
            (toggled ? " bg-accent border-accent" : "")
          }
        >
          {toggled && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}
    </button>
  );
}
