export default function ProgressBar({ itemNo, total }: { itemNo: number; total: number }) {
  const progressPct = Math.round(((itemNo - 1) / total) * 100);

  return (
    <div className="h-1.5 bg-line rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all relative overflow-hidden"
        style={{
          width: `${progressPct}%`,
          background: "linear-gradient(90deg, var(--color-accent-dark), var(--color-accent))",
        }}
      >
        <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-white/80 to-transparent" />
      </div>
    </div>
  );
}
