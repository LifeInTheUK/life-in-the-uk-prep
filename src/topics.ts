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

// Shorter than TOPIC_LABELS — for narrow fixed-width contexts (chart axis
// tick labels) where the full label would be ellipsis-truncated illegibly.
const TOPIC_SHORT_LABELS: Record<string, string> = {
  "uk-overview": "UK Overview",
  "values-principles": "Values",
  history: "History",
  culture: "Culture",
  "government-law": "Gov & Law",
};

export function topicShortLabel(topic: string | undefined): string {
  if (!topic) return "General";
  return TOPIC_SHORT_LABELS[topic] ?? topicLabel(topic);
}
