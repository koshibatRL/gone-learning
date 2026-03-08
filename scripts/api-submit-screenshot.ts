import { chromium } from "playwright";
import { resolve } from "path";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = resolve(__dirname, "../docs/screenshots");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Login
  console.log("Logging in...");
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', "examinee@test.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Get exam ID from the exams page
  console.log("Getting exam ID...");
  await page.goto(`${BASE_URL}/exams`);
  await page.waitForTimeout(2000);

  const examLink = page.locator('a[href^="/exams/"]').first();
  const href = await examLink.getAttribute("href");
  const examId = href?.replace("/exams/", "");
  console.log(`Exam ID: ${examId}`);

  if (!examId) {
    console.log("No exam found.");
    await browser.close();
    return;
  }

  // Submit via API using fetch within the browser context (preserves cookies)
  console.log("Submitting essay via API...");
  const answerText = "　犯罪の起きにくい社会の実現に向けて、警察官が果たすべき役割は大きく二つあると考える。一つは犯罪の未然防止と捜査活動の強化、もう一つは地域社会との協働による防犯基盤の構築である。\n　まず、犯罪の未然防止と捜査活動の強化について述べる。令和5年の刑法犯認知件数は約70万件と、前年に続き増加傾向にある。特殊詐欺の被害額は依然として高水準にあり、児童虐待の相談件数も過去最多を更新し続けている。こうした現状を踏まえれば、警察官はまず日常的なパトロールの強化を通じて犯罪の芽を早期に摘み取る役割が求められる。\n　次に、地域社会との協働による防犯基盤の構築について述べる。犯罪の抑止には警察の力だけでは限界があり、地域住民との連携が不可欠である。自治会や学校と連携した防犯教室の開催や、高齢者を狙った特殊詐欺の注意喚起活動など、地域に密着した取り組みが重要である。";

  const result = await page.evaluate(
    async ({ examId, answerText }) => {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id: examId, answer_text: answerText }),
      });
      return { status: res.status, body: await res.json() };
    },
    { examId, answerText }
  );

  console.log("Submission result:", JSON.stringify(result));

  if (result.status !== 200 && result.status !== 201) {
    console.log("Submission failed.");
    await browser.close();
    return;
  }

  const submissionId = result.body.submission_id;
  console.log(`Submission ID: ${submissionId}`);

  // Navigate to result page
  const resultUrl = `/exams/${examId}/result/${submissionId}`;
  console.log(`Navigating to: ${resultUrl}`);
  await page.goto(`${BASE_URL}${resultUrl}`);
  await page.waitForTimeout(2000);

  // Take grading progress screenshot
  await page.screenshot({ path: resolve(OUT_DIR, "05b_grading_progress.png") });
  console.log("  [ok] 05b_grading_progress.png");

  // Wait for grading
  console.log("Waiting for grading to complete...");
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(2000);
    const bodyText = await page.textContent("body");
    if (bodyText?.includes("採点結果")) {
      console.log("Grading complete!");
      await page.waitForTimeout(1500);
      break;
    }
    if (bodyText?.includes("採点エラー")) {
      console.log("Grading error.");
      break;
    }
    console.log(`  waiting... (${(i + 1) * 2}s)`);
  }

  // Take result screenshots
  await page.screenshot({ path: resolve(OUT_DIR, "06_result_desktop.png") });
  console.log("  [ok] 06_result_desktop.png");

  await page.screenshot({ path: resolve(OUT_DIR, "06_result_desktop_full.png"), fullPage: true });
  console.log("  [ok] 06_result_desktop_full.png");

  // Mobile view
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: resolve(OUT_DIR, "07_result_mobile.png") });
  console.log("  [ok] 07_result_mobile.png");
  await page.screenshot({ path: resolve(OUT_DIR, "07_result_mobile_full.png"), fullPage: true });
  console.log("  [ok] 07_result_mobile_full.png");

  // History with data
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${BASE_URL}/history`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: resolve(OUT_DIR, "05_history.png") });
  console.log("  [ok] 05_history.png (updated with submission data)");

  await browser.close();
  console.log("\nDone!");
}

main().catch(console.error);
