import Skeleton from "@/src/Skeleton";

export default function Loading() {
  return (
    <div className="order-3 flex flex-col gap-5 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>

      <Skeleton className="h-[42px] w-full" />

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-32 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>

      <ul className="flex flex-col gap-3">
        {Array.from({ length: 15 }).map((_, i) => (
          <li
            key={i}
            className="p-4 border border-line rounded-xl bg-surface flex flex-col gap-2"
          >
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </li>
        ))}
      </ul>
    </div>
  );
}
