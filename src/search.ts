// Lightweight fuzzy match: exact substring beats an in-order (possibly gappy)
// character subsequence match, so typos/partial words still surface a result
// without pulling in a fuzzy-search dependency for one search box.
export function fuzzyScore(query: string, text: string): number | null {
  const q = query.trim().toLowerCase();
  const t = text.toLowerCase();
  if (!q) return null;

  const idx = t.indexOf(q);
  if (idx !== -1) {
    return 1000 - idx;
  }

  let qi = 0;
  let gaps = 0;
  let lastMatch = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      if (lastMatch !== -1) gaps += ti - lastMatch - 1;
      lastMatch = ti;
      qi++;
    }
  }
  if (qi < q.length) return null; // not all query chars found in order

  return 500 - gaps;
}
