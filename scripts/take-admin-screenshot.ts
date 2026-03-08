import { chromium } from "playwright";
import { resolve } from "path";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = resolve(__dirname, "../docs/screenshots");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Login as admin
  console.log("Logging in as admin...");
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', "admin@test.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Go to exam edit page directly
  const examId = "10000000-0000-0000-0000-000000000001";
  console.log("Navigating to exam edit...");
  await page.goto(`${BASE_URL}/admin/exams/${examId}`);
  await page.waitForTimeout(2000);

  await page.screenshot({ path: resolve(OUT_DIR, "09_admin_exam_edit.png") });
  console.log("  [ok] 09_admin_exam_edit.png");

  await page.screenshot({ path: resolve(OUT_DIR, "09_admin_exam_edit_full.png"), fullPage: true });
  console.log("  [ok] 09_admin_exam_edit_full.png");

  // Also take new exam page screenshot
  await page.goto(`${BASE_URL}/admin/exams/new`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: resolve(OUT_DIR, "08b_admin_exam_new.png") });
  console.log("  [ok] 08b_admin_exam_new.png");

  await browser.close();
  console.log("Done!");
}

main().catch(console.error);
