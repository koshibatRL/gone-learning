import type { EvaluationSectionWithChoices } from "@/types/database";
import type { GradingResultItem } from "@/types/grading";

function buildSectionsText(sections: EvaluationSectionWithChoices[]): string {
  const sortedSections = [...sections].sort(
    (a, b) => a.section_number - b.section_number
  );

  return sortedSections
    .map((section) => {
      const choicesText = section.evaluation_choices
        .sort((a, b) => a.choice_number - b.choice_number)
        .map((choice) => `- ${choice.choice_number}: ${choice.summary}\n  詳細: ${choice.feedback_text}`)
        .join("\n");
      return `■ 評価${section.section_number}: ${section.title}\n${choicesText}`;
    })
    .join("\n");
}

export function buildGradingPrompt(
  promptText: string,
  answerText: string,
  sections: EvaluationSectionWithChoices[]
): string {
  const sectionsText = buildSectionsText(sections);

  return `あなたは公務員試験の論文採点官です。
以下の答案を読み、各評価セクションから最も適切な選択肢を1つずつ選んでください。

【出題】
${promptText}

【答案】
${answerText}

【評価セクション・選択肢】
${sectionsText}

【回答形式】
以下のJSON形式のみで回答してください。説明は不要です：
{"results": [{"section": 1, "choice_number": 11}, {"section": 2, "choice_number": 21}, ...]}`;
}

export function buildFewShotGradingPrompt(
  promptText: string,
  answerText: string,
  sections: EvaluationSectionWithChoices[],
  exampleAnswer: string,
  exampleResults: GradingResultItem[]
): string {
  const sectionsText = buildSectionsText(sections);

  const exampleJson = JSON.stringify({
    results: exampleResults,
  });

  return `あなたは公務員試験の論文採点官です。
以下の例を参考にして、答案を評価してください。

【出題】
${promptText}

【評価セクション・選択肢】
${sectionsText}

--- 採点例 ---
【例の答案】
${exampleAnswer}

【例の判定結果】
${exampleJson}
--- 採点例ここまで ---

では、以下の答案を同じ要領で採点してください。

【答案】
${answerText}

【回答形式】
以下のJSON形式のみで回答してください。説明は不要です：
{"results": [{"section": 1, "choice_number": 11}, {"section": 2, "choice_number": 21}, ...]}`;
}
