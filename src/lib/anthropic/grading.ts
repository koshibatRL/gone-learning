import { createAdminClient } from "@/lib/supabase/admin";
import { getAnthropicClient } from "./client";
import { buildGradingPrompt } from "./prompt-builder";
import { parseGradingResponse } from "./response-parser";
import type { EvaluationSectionWithChoices } from "@/types/database";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function gradeSubmission(submissionId: string): Promise<void> {
  const admin = createAdminClient();

  // Fetch submission
  const { data: submission, error: subError } = await admin
    .from("submissions")
    .select("*, exams(*)")
    .eq("id", submissionId)
    .single();

  if (subError || !submission) {
    console.error("Failed to fetch submission:", subError);
    return;
  }

  // Update status to evaluating
  await admin
    .from("submissions")
    .update({ status: "evaluating" })
    .eq("id", submissionId);

  // Fetch sections with choices
  const { data: sections, error: secError } = await admin
    .from("evaluation_sections")
    .select("*, evaluation_choices(*)")
    .eq("exam_id", submission.exam_id)
    .order("section_number");

  if (secError || !sections) {
    console.error("Failed to fetch sections:", secError);
    await admin
      .from("submissions")
      .update({
        status: "error",
        error_message: secError?.message ?? "評価セクションの取得に失敗しました",
      })
      .eq("id", submissionId);
    return;
  }

  const typedSections = sections as EvaluationSectionWithChoices[];

  // Build prompt
  const prompt = buildGradingPrompt(
    submission.exams.prompt_text,
    submission.answer_text,
    typedSections,
    submission.char_count,
    submission.exams.standard_char_count
  );

  // Call Claude with retries
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("INVALID_JSON: No text content in response");
      }

      const gradingResult = parseGradingResponse(textBlock.text, typedSections);

      // Save results
      const resultRows = gradingResult.results.map((r) => {
        const section = typedSections.find(
          (s) => s.section_number === r.section
        )!;
        const choice = section.evaluation_choices.find(
          (c) => c.choice_number === r.choice_number
        )!;
        return {
          submission_id: submissionId,
          section_id: section.id,
          selected_choice_id: choice.id,
          section_title: section.title,
          section_number: section.section_number,
          choice_summary: choice.summary,
          choice_feedback_text: choice.feedback_text,
          selected_choice_number: choice.choice_number,
        };
      });

      const { error: insertError } = await admin
        .from("submission_results")
        .insert(resultRows);

      if (insertError) {
        throw new Error(`DB insert failed: ${insertError.message}`);
      }

      // Mark as evaluated
      await admin
        .from("submissions")
        .update({
          status: "evaluated",
          evaluated_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `Grading attempt ${attempt + 1} failed:`,
        lastError.message
      );

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  // All retries failed
  console.error("All grading attempts failed:", lastError?.message);
  await admin
    .from("submissions")
    .update({
      status: "error",
      error_message: lastError?.message ?? "採点処理に失敗しました",
    })
    .eq("id", submissionId);
}
