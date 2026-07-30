"use client";

import { useEffect, useState } from "react";
import Skeleton from "./Skeleton";

interface Release {
  sha: string;
  message: string;
  releasedAt: number;
}

export default function ChangelogPage() {
  const [releases, setReleases] = useState<Release[] | null>(null);

  useEffect(() => {
    fetch("/api/releases")
      .then((res) => res.json())
      .then(setReleases)
      .catch(() => setReleases([]));
  }, []);

  return (
    <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
      <h1 className="text-lg font-semibold">Changelog</h1>
      {releases === null ? (
        <ul className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="border border-line rounded-xl p-4 bg-surface">
              <div className="flex items-center justify-between gap-3 mb-2">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-3/4" />
            </li>
          ))}
        </ul>
      ) : releases.length === 0 ? (
        <p className="text-sm text-muted">No releases recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {releases.map((r) => (
            <li
              key={r.sha}
              className="border border-line rounded-xl p-4 bg-surface"
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <code className="text-xs text-muted">{r.sha}</code>
                <span className="text-xs text-muted">
                  {new Date(r.releasedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm whitespace-pre-line">{r.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
