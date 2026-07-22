"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 350;

export default function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [value, setValue] = useState(urlQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the query we last pushed to the URL ourselves, so the sync effect
  // below can tell "the URL changed because we navigated" apart from "the URL
  // changed because of something external (Clear link, back/forward)" and
  // only overwrite the input in the latter case. Without this, every debounced
  // navigation re-fired the effect and stomped on keystrokes typed in the
  // meantime, dropping characters when typing fast.
  const lastPushedQuery = useRef(urlQuery);

  useEffect(() => {
    if (urlQuery !== lastPushedQuery.current) {
      lastPushedQuery.current = urlQuery;
      setValue(urlQuery);
    }
  }, [urlQuery]);

  function handleChange(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = next.trim();
      const nextQuery = trimmed.length >= MIN_QUERY_LENGTH ? trimmed : "";
      if (nextQuery === lastPushedQuery.current) return;
      lastPushedQuery.current = nextQuery;
      router.replace(
        nextQuery ? `${pathname}?q=${encodeURIComponent(nextQuery)}` : pathname,
        { scroll: false },
      );
    }, DEBOUNCE_MS);
  }

  const showHint =
    value.trim().length > 0 && value.trim().length < MIN_QUERY_LENGTH;

  return (
    <div>
      <div className="relative">
        <svg
          className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-5.2-5.2m1.7-5.3a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search questions..."
          className="w-full text-sm bg-bg border border-line rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-accent transition-colors"
        />
      </div>
      {showHint && (
        <p className="text-xs text-muted mt-1.5">
          Type at least {MIN_QUERY_LENGTH} characters to search.
        </p>
      )}
    </div>
  );
}
