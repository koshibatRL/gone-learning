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

  // Go to exam
  console.log("Finding exam...");
  await page.goto(`${BASE_URL}/exams`);
  await page.waitForTimeout(2000);

  const examLink = page.locator('a[href^="/exams/"]').first();
  if (!(await examLink.count())) {
    console.log("No exams found.");
    await browser.close();
    return;
  }

  await examLink.click();
  await page.waitForTimeout(2000);

  // Type into editor
  console.log("Writing essay...");
  const editorContainer = page.locator('[tabindex="0"]').first();
  if (await editorContainer.count()) {
    await editorContainer.click();
    await page.waitForTimeout(300);
    const text = "　犯罪の起きにくい社会の実現に向けて、警察官が果たすべき役割は大きく二つあると考える。一つは犯罪の未然防止と捜査活動の強化、もう一つは地域社会との協働による防犯基盤の構築である。";
    for (const char of text) {
      await page.keyboard.type(char, { delay: 5 });
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: resolve(OUT_DIR, "04_essay_editor_with_text.png") });
    console.log("  [ok] 04_essay_editor_with_text.png");
  }

  // Debug: list all buttons
  const allButtons = await page.locator("button").all();
  console.log(`\nButtons on page: ${allButtons.length}`);
  for (let i = 0; i < allButtons.length; i++) {
    const text = await allButtons[i].textContent();
    const disabled = await allButtons[i].isDisabled();
    const visible = await allButtons[i].isVisible();
    console.log(`  [${i}] text="${text?.trim()}" disabled=${disabled} visible=${visible}`);
  }

  // Click submit button directly by index (button[1] per debug output)
  console.log("\nClicking submit button...");
  const submitButton = allButtons.find(async (b) => {
    const t = await b.textContent();
    return t?.includes("提出する");
  });

  // Try direct nth approach
  if (allButtons.length >= 2) {
    await allButtons[1].click();
    await page.waitForTimeout(1000);

    // Take dialog screenshot
    await page.screenshot({ path: resolve(OUT_DIR, "04b_submit_dialog.png") });
    console.log("  [ok] 04b_submit_dialog.png");

    // Find and click confirm button in dialog
    const dialogButtons = await page.locator('[role="alertdialog"] button').all();
    console.log(`Dialog buttons: ${dialogButtons.length}`);
    for (let i = 0; i < dialogButtons.length; i++) {
      const t = await dialogButtons[i].textContent();
      console.log(`  dialog button [${i}]: "${t?.trim()}"`);
    }

    // Click the last button (提出) in the dialog
    if (dialogButtons.length > 0) {
      await dialogButtons[dialogButtons.length - 1].click();
      console.log("Submitted! Waiting for grading...");

      await page.waitForTimeout(2000);
      await page.screenshot({ path: resolve(OUT_DIR, "05b_grading_progress.png") });
      console.log("  [ok] 05b_grading_progress.png");

      // Wait for grading
      for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(2000);
        const bodyText = await page.textContent("body");
        if (bodyText?.includes("採点結果")) {
          console.log("Grading complete!");
          await page.waitForTimeout(1000);
          break;
        }
        if (bodyText?.includes("採点エラー")) {
          console.log("Grading error.");
          await page.waitForTimeout(500);
          break;
        }
        console.log(`  waiting... (${(i + 1) * 2}s)`);
      }

      // Result screenshots
      await page.screenshot({ path: resolve(OUT_DIR, "06_result_desktop.png") });
      console.log("  [ok] 06_result_desktop.png");

      await page.screenshot({ path: resolve(OUT_DIR, "06_result_desktop_full.png"), fullPage: true });
      console.log("  [ok] 06_result_desktop_full.png");

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
      console.log("  [ok] 05_history.png (updated)");
    }
  }

  await browser.close();
  console.log("\nDone!");
}

main().catch(console.error);
