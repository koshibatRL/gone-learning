import type { GradingResponse, GradingResultItem } from "@/types/grading";
import type { EvaluationSectionWithChoices } from "@/types/database";

export function parseGradingResponse(
  raw: string,
  sections: EvaluationSectionWithChoices[]
): GradingResponse {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`INVALID_JSON: Failed to parse response as JSON`);
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("results" in parsed) ||
    !Array.isArray((parsed as { results: unknown }).results)
  ) {
    throw new Error(`INVALID_STRUCTURE: Missing "results" array`);
  }

  const results = (parsed as { results: unknown[] }).results;

  if (results.length !== sections.length) {
    throw new Error(
      `INVALID_STRUCTURE: Expected ${sections.length} results, got ${results.length}`
    );
  }

  const validatedResults: GradingResultItem[] = [];

  for (const result of results) {
    if (
      !result ||
      typeof result !== "object" ||
      !("section" in result) ||
      !("choice_number" in result)
    ) {
      throw new Error(
        `INVALID_STRUCTURE: Each result must have "section" and "choice_number"`
      );
    }

    const item = result as { section: number; choice_number: number };
    const section = sections.find(
      (s) => s.section_number === item.section
    );

    if (!section) {
      throw new Error(
        `INVALID_STRUCTURE: Unknown section number ${item.section}`
      );
    }

    const validChoice = section.evaluation_choices.some(
      (c) => c.choice_number === item.choice_number
    );

    if (!validChoice) {
      throw new Error(
        `INVALID_STRUCTURE: Invalid choice_number ${item.choice_number} for section ${item.section}`
      );
    }

    validatedResults.push({
      section: item.section,
      choice_number: item.choice_number,
    });
  }

  return { results: validatedResults };
}
