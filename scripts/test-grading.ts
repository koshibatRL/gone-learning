import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// Parse .env.local
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

// --- Constants ---
const EXAM_ID = "10000000-0000-0000-0000-000000000001";
const LOGICTEST_DIR = resolve(__dirname, "../logictest");

const ANSWER_1 = readFileSync(resolve(LOGICTEST_DIR, "answer1.txt"), "utf-8").trim();
const ANSWER_2 = readFileSync(resolve(LOGICTEST_DIR, "answer2.txt"), "utf-8").trim();

const expectedData = JSON.parse(
  readFileSync(resolve(LOGICTEST_DIR, "expected.json"), "utf-8")
);
const EXPECTED_1: GradingResultItem[] = expectedData.answer1;
const EXPECTED_2: GradingResultItem[] = expectedData.answer2;

// --- Types ---
interface GradingResultItem {
  section: number;
  choice_number: number;
}

interface EvaluationChoice {
  id: string;
  section_id: string;
  choice_number: number;
  summary: string;
  feedback_text: string;
}

interface EvaluationSectionWithChoices {
  id: string;
  exam_id: string;
  section_number: number;
  title: string;
  evaluation_choices: EvaluationChoice[];
}

// --- Supabase ---
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function fetchSections(): Promise<EvaluationSectionWithChoices[]> {
  const admin = getAdmin();
  const { data, error } = await admin
    .from("evaluation_sections")
    .select("*, evaluation_choices(*)")
    .eq("exam_id", EXAM_ID)
    .order("section_number");

  if (error || !data) {
    throw new Error(`Failed to fetch sections: ${error?.message}`);
  }
  return data as EvaluationSectionWithChoices[];
}

async function fetchExam(): Promise<{
  prompt_text: string;
  standard_char_count: number;
}> {
  const admin = getAdmin();
  const { data, error } = await admin
    .from("exams")
    .select("prompt_text, standard_char_count")
    .eq("id", EXAM_ID)
    .single();

  if (error || !data) {
    throw new Error(`Failed to fetch exam: ${error?.message}`);
  }
  return data;
}

// --- Per-section prompt builder ---
function buildPerSectionPrompt(
  promptText: string,
  answerText: string,
  section: EvaluationSectionWithChoices,
  charCount: number
): string {
  const choices = section.evaluation_choices
    .sort((a, b) => a.choice_number - b.choice_number)
    .map((c) => `- ${c.choice_number}: ${c.summary}\n  詳細: ${c.feedback_text}`)
    .join("\n");

  let extra = "";
  // For section 7 (表現・表記・構成), provide char count info
  if (section.section_number === 7) {
    extra = `\n\n【参考情報】この答案の文字数は ${charCount} 字です。`;
  }

  return `あなたは公務員試験の論文採点官です。
以下の答案を読み、この評価セクションから最も適切な選択肢を1つだけ選んでください。

【出題】
${promptText}

【答案】
${answerText}${extra}

【評価セクション】
■ 評価${section.section_number}: ${section.title}
${choices}

【回答形式】
選択肢の番号のみを回答してください。説明は不要です。
例: 11`;
}

// --- Claude API ---
function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

async function callClaudePerSection(
  client: Anthropic,
  prompt: string,
  sectionNumber: number
): Promise<number> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 64,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error(`Section ${sectionNumber}: No text content in response`);
  }

  const cleaned = textBlock.text.trim();
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) {
    throw new Error(
      `Section ${sectionNumber}: Could not parse "${cleaned}" as number`
    );
  }
  return num;
}

async function gradePerSection(
  promptText: string,
  answerText: string,
  sections: EvaluationSectionWithChoices[]
): Promise<GradingResultItem[]> {
  const client = getClient();
  const charCount = answerText.length;

  const promises = sections.map(async (section) => {
    const prompt = buildPerSectionPrompt(
      promptText,
      answerText,
      section,
      charCount
    );
    const choiceNumber = await callClaudePerSection(
      client,
      prompt,
      section.section_number
    );
    return { section: section.section_number, choice_number: choiceNumber };
  });

  return Promise.all(promises);
}

// --- Batch (all sections in one request, for comparison) ---
function buildBatchPrompt(
  promptText: string,
  answerText: string,
  sections: EvaluationSectionWithChoices[],
  standardCharCount: number
): string {
  const charCount = answerText.length;
  const sorted = [...sections].sort(
    (a, b) => a.section_number - b.section_number
  );
  const sectionsText = sorted
    .map((s) => {
      const choices = s.evaluation_choices
        .sort((a, b) => a.choice_number - b.choice_number)
        .map((c) => `- ${c.choice_number}: ${c.summary}\n  詳細: ${c.feedback_text}`)
        .join("\n");
      return `■ 評価${s.section_number}: ${s.title}\n${choices}`;
    })
    .join("\n");

  return `あなたは公務員試験の論文採点官です。
以下の答案を読み、各評価セクションから最も適切な選択肢を1つずつ選んでください。

【出題】
${promptText}

【答案】
${answerText}

【参考情報】
- この答案の文字数: ${charCount}字
- 標準字数: ${standardCharCount}字

【評価セクション・選択肢】
${sectionsText}

【回答形式】
以下のJSON形式のみで回答してください。説明は不要です：
{"results": [{"section": 1, "choice_number": 11}, {"section": 2, "choice_number": 21}, ...]}`;
}

async function callClaudeBatch(
  prompt: string,
  label?: string
): Promise<GradingResultItem[]> {
  const client = getClient();
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in response");
  }

  // Save input/output to logictest/
  if (label) {
    const { writeFileSync } = require("fs");
    writeFileSync(
      resolve(LOGICTEST_DIR, `${label}_input.txt`),
      prompt,
      "utf-8"
    );
    writeFileSync(
      resolve(LOGICTEST_DIR, `${label}_output.txt`),
      textBlock.text,
      "utf-8"
    );
  }

  let cleaned = textBlock.text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }

  const parsed = JSON.parse(cleaned);
  return parsed.results as GradingResultItem[];
}

// --- Few-shot prompt builder ---
function buildFewShotBatchPrompt(
  promptText: string,
  answerText: string,
  sections: EvaluationSectionWithChoices[],
  exampleAnswer: string,
  exampleResults: GradingResultItem[]
): string {
  const sorted = [...sections].sort(
    (a, b) => a.section_number - b.section_number
  );
  const sectionsText = sorted
    .map((s) => {
      const choices = s.evaluation_choices
        .sort((a, b) => a.choice_number - b.choice_number)
        .map((c) => `- ${c.choice_number}: ${c.summary}\n  詳細: ${c.feedback_text}`)
        .join("\n");
      return `■ 評価${s.section_number}: ${s.title}\n${choices}`;
    })
    .join("\n");

  const exampleJson = JSON.stringify({ results: exampleResults });

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

// --- Comparison ---
function compareResults(
  label: string,
  actual: GradingResultItem[],
  expected: GradingResultItem[],
  sections: EvaluationSectionWithChoices[]
): { matches: number; total: number } {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`${"=".repeat(60)}`);
  console.log(
    `${"セクション".padEnd(28)}${"期待".padEnd(8)}${"実際".padEnd(8)}結果`
  );
  console.log("-".repeat(60));

  let matches = 0;
  const total = expected.length;

  for (const exp of expected) {
    const act = actual.find((a) => a.section === exp.section);
    const section = sections.find((s) => s.section_number === exp.section);
    const sectionLabel = section
      ? `評価${section.section_number}: ${section.title}`
      : `評価${exp.section}`;
    const actChoice = act?.choice_number ?? "N/A";
    const match = act?.choice_number === exp.choice_number;
    if (match) matches++;

    console.log(
      `${sectionLabel.padEnd(28)}${String(exp.choice_number).padEnd(8)}${String(actChoice).padEnd(8)}${match ? "✓" : "✗"}`
    );
  }

  console.log("-".repeat(60));
  console.log(
    `一致率: ${matches}/${total} (${Math.round((matches / total) * 100)}%)`
  );

  return { matches, total };
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  const modeIdx = args.indexOf("--mode");
  const mode = modeIdx !== -1 ? args[modeIdx + 1] : "both";

  if (!["batch", "per-section", "few-shot", "both"].includes(mode)) {
    console.error(
      "Usage: npx tsx scripts/test-grading.ts [--mode batch|per-section|few-shot|both]"
    );
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY is not set in .env.local");
    process.exit(1);
  }

  console.log("Fetching exam data from Supabase...");
  const [sections, exam] = await Promise.all([fetchSections(), fetchExam()]);
  const { prompt_text: promptText, standard_char_count: standardCharCount } =
    exam;
  console.log(
    `  ${sections.length} sections loaded, 標準字数: ${standardCharCount}`
  );

  const summary: Record<
    string,
    {
      answer1?: { matches: number; total: number };
      answer2?: { matches: number; total: number };
    }
  > = {};

  // --- Batch (all sections in one request) ---
  if (mode === "batch" || mode === "both") {
    console.log("\n>>> Batch: 解答例1を採点中...");
    const b1 = await callClaudeBatch(
      buildBatchPrompt(promptText, ANSWER_1, sections, standardCharCount),
      "batch_answer1"
    );
    const b1Result = compareResults("Batch — 解答例1", b1, EXPECTED_1, sections);

    console.log("\n>>> Batch: 解答例2を採点中...");
    const b2 = await callClaudeBatch(
      buildBatchPrompt(promptText, ANSWER_2, sections, standardCharCount),
      "batch_answer2"
    );
    const b2Result = compareResults("Batch — 解答例2", b2, EXPECTED_2, sections);

    summary["Batch"] = { answer1: b1Result, answer2: b2Result };
  }

  // --- Per-section ---
  if (mode === "per-section" || mode === "both") {
    console.log("\n>>> Per-section: 解答例1を採点中...");
    const ps1 = await gradePerSection(promptText, ANSWER_1, sections);
    const ps1Result = compareResults(
      "Per-section — 解答例1",
      ps1,
      EXPECTED_1,
      sections
    );

    console.log("\n>>> Per-section: 解答例2を採点中...");
    const ps2 = await gradePerSection(promptText, ANSWER_2, sections);
    const ps2Result = compareResults(
      "Per-section — 解答例2",
      ps2,
      EXPECTED_2,
      sections
    );

    summary["Per-section"] = { answer1: ps1Result, answer2: ps2Result };
  }

  // --- Few-shot (example 1 as demo, grade example 2) ---
  if (mode === "few-shot" || mode === "both") {
    console.log("\n>>> Few-shot: 解答例2を採点中（解答例1を例示）...");
    const fs2 = await callClaudeBatch(
      buildFewShotBatchPrompt(
        promptText,
        ANSWER_2,
        sections,
        ANSWER_1,
        EXPECTED_1
      )
    );
    const fs2Result = compareResults(
      "Few-shot — 解答例2（解答例1を例示）",
      fs2,
      EXPECTED_2,
      sections
    );

    summary["Few-shot"] = { answer2: fs2Result };
  }

  // --- Summary ---
  if (mode === "both") {
    console.log(`\n${"=".repeat(60)}`);
    console.log("  比較サマリー");
    console.log(`${"=".repeat(60)}`);
    console.log(
      `${"方式".padEnd(16)}${"解答例1".padEnd(12)}${"解答例2".padEnd(12)}平均`
    );
    console.log("-".repeat(52));
    for (const [name, r] of Object.entries(summary)) {
      const pct1 = r.answer1
        ? Math.round((r.answer1.matches / r.answer1.total) * 100)
        : 0;
      const pct2 = r.answer2
        ? Math.round((r.answer2.matches / r.answer2.total) * 100)
        : 0;
      const avg = Math.round((pct1 + pct2) / 2);
      console.log(
        `${name.padEnd(16)}${`${pct1}%`.padEnd(12)}${`${pct2}%`.padEnd(12)}${avg}%`
      );
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
