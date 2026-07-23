export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-line animate-pulse rounded ${className}`} />;
}
