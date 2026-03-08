import { chromium } from "playwright";
import { resolve } from "path";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = resolve(__dirname, "../docs/screenshots");

const EXAMINEE = { email: "examinee@test.com", password: "password123" };
const ADMIN = { email: "admin@test.com", password: "password123" };

async function screenshot(
  page: import("playwright").Page,
  name: string,
  opts?: { fullPage?: boolean }
) {
  await page.waitForTimeout(500); // let rendering settle
  await page.screenshot({
    path: resolve(OUT_DIR, `${name}.png`),
    fullPage: opts?.fullPage ?? false,
  });
  console.log(`  [ok] ${name}.png`);
}

async function login(
  page: import("playwright").Page,
  creds: { email: string; password: string }
) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // ── 1. Auth pages (no login) ──
  console.log("Auth pages...");
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();

    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]');
    await screenshot(page, "01_login");

    await page.goto(`${BASE_URL}/signup`);
    await page.waitForSelector('input[type="email"]');
    await screenshot(page, "02_signup");

    await ctx.close();
  }

  // ── 2. Examinee pages ──
  console.log("Examinee pages...");
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await login(page, EXAMINEE);

    // Exam list
    await page.goto(`${BASE_URL}/exams`);
    await page.waitForTimeout(1500);
    await screenshot(page, "03_exam_list");

    // Click first exam to get essay editor
    const examLink = page.locator("a[href^='/exams/']").first();
    if (await examLink.count()) {
      await examLink.click();
      await page.waitForTimeout(1500);
      await screenshot(page, "04_essay_editor");
      await screenshot(page, "04_essay_editor_full", { fullPage: true });
    }

    // History
    await page.goto(`${BASE_URL}/history`);
    await page.waitForTimeout(1500);
    await screenshot(page, "05_history");

    // Click on the first "採点済" result to get the result page
    const resultLink = page.locator("a[href*='/result/']").first();
    if (await resultLink.count()) {
      await resultLink.click();
      await page.waitForTimeout(2000);
      await screenshot(page, "06_result_desktop");
      await screenshot(page, "06_result_desktop_full", { fullPage: true });
    }

    // Mobile result view
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await screenshot(page, "07_result_mobile");
    await screenshot(page, "07_result_mobile_full", { fullPage: true });

    await ctx.close();
  }

  // ── 3. Admin pages ──
  console.log("Admin pages...");
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await login(page, ADMIN);

    // Admin exam list
    await page.goto(`${BASE_URL}/admin/exams`);
    await page.waitForTimeout(1500);
    await screenshot(page, "08_admin_exam_list");

    // Click first exam to get edit page
    const editLink = page.locator("a[href^='/admin/exams/']").first();
    if (await editLink.count()) {
      await editLink.click();
      await page.waitForTimeout(1500);
      await screenshot(page, "09_admin_exam_edit");
      await screenshot(page, "09_admin_exam_edit_full", { fullPage: true });
    }

    await ctx.close();
  }

  await browser.close();
  console.log("\nDone! Screenshots saved to docs/screenshots/");
}

main().catch(console.error);
