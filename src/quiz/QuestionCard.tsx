import type { SessionQuestion } from "../types";
import { topicLabel } from "../topics";
import ProgressBar from "./ProgressBar";

export default function QuestionCard({
  question,
  itemNo,
  total,
  isMulti,
  requiredCount,
}: {
  question: SessionQuestion;
  itemNo: number;
  total: number;
  isMulti: boolean;
  requiredCount: number;
}) {
  return (
    <>
      <div className="mb-4">
        <div className="flex justify-between items-baseline text-xs text-muted mb-2 tabular">
          <span>
            Question {itemNo} of {total}
          </span>
          {isMulti && (
            <span className="text-accent font-medium">Select {requiredCount}</span>
          )}
        </div>
        <ProgressBar itemNo={itemNo} total={total} />
      </div>
      <span className="inline-block text-xs font-medium text-accent bg-accent/10 rounded-full px-2.5 py-1 mb-3">
        {topicLabel(question.topic)}
      </span>
      <h2 id="question-heading" className="text-lg sm:text-xl font-semibold leading-snug mb-5">
        {question.q}
      </h2>
    </>
  );
}
