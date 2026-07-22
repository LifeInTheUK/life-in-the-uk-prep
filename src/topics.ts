export const TOPIC_ORDER = [
  "uk-overview",
  "values-principles",
  "history",
  "culture",
  "government-law",
] as const;

const TOPIC_LABELS: Record<string, string> = {
  "uk-overview": "UK Overview",
  "values-principles": "Values & Principles",
  history: "History",
  culture: "Culture & Modern Life",
  "government-law": "Government & Law",
};

export function topicLabel(topic: string | undefined): string {
  if (!topic) return "General";
  return TOPIC_LABELS[topic] ?? topic;
}
