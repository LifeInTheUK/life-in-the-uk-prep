// Renders an answer index (or multi-select index array) as the option text
// it points at. Shared by the all-time /review page and the per-session
// results review list, which display answers identically.
export function formatAnswer(o: string[], a: number | number[] | undefined): string {
  if (a === undefined) return "—";
  if (Array.isArray(a)) return a.map((i) => o[i]).join(", ");
  return o[a];
}
