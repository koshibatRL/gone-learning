import { ResultCard } from "./result-card";
import type {
  EvaluationSection,
  EvaluationChoice,
  SubmissionResult,
} from "@/types/database";

interface ResultData {
  result: SubmissionResult;
  section: EvaluationSection;
  choice: EvaluationChoice;
}

interface ResultSummaryProps {
  results: ResultData[];
}

// Choice numbers that represent "positive" evaluations (no issues found)
const POSITIVE_CHOICES = new Set([11, 21, 31, 41, 51, 61, 71]);

export function ResultSummary({ results }: ResultSummaryProps) {
  const sorted = [...results].sort(
    (a, b) => a.section.section_number - b.section.section_number
  );

  return (
    <div className="space-y-3">
      {sorted.map((r) => (
        <ResultCard
          key={r.result.id}
          sectionNumber={r.section.section_number}
          sectionTitle={r.section.title}
          choiceSummary={r.choice.summary}
          feedbackText={r.choice.feedback_text}
          isPositive={POSITIVE_CHOICES.has(r.choice.choice_number)}
        />
      ))}
    </div>
  );
}
