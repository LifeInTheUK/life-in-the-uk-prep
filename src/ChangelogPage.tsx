"use client";

import { useEffect, useState } from "react";

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
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-lg font-semibold mb-4">Changelog</h1>
      {releases === null ? (
        <p className="text-sm text-muted">Loading…</p>
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
              <p className="text-sm">{r.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
