import Skeleton from "./Skeleton";

export default function FriendRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
