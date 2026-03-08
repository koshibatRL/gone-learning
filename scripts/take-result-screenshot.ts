import { chromium } from "playwright";
import { resolve } from "path";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = resolve(__dirname, "../docs/screenshots");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Login as examinee
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', "examinee@test.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Go to history page
  await page.goto(`${BASE_URL}/history`);
  await page.waitForTimeout(3000);

  // Find result links — they are formatted like /exams/{id}/result/{id}
  const resultLink = page.locator('a[href*="/result/"]').first();
  const count = await resultLink.count();
  console.log(`Found ${count} result link(s)`);

  if (count > 0) {
    const href = await resultLink.getAttribute("href");
    console.log(`Result link: ${href}`);
    await resultLink.click();
    await page.waitForTimeout(4000);

    await page.screenshot({
      path: resolve(OUT_DIR, "06_result_desktop.png"),
      fullPage: false,
    });
    console.log("  [ok] 06_result_desktop.png");

    await page.screenshot({
      path: resolve(OUT_DIR, "06_result_desktop_full.png"),
      fullPage: true,
    });
    console.log("  [ok] 06_result_desktop_full.png");

    // Mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: resolve(OUT_DIR, "07_result_mobile.png"),
      fullPage: false,
    });
    console.log("  [ok] 07_result_mobile.png");

    await page.screenshot({
      path: resolve(OUT_DIR, "07_result_mobile_full.png"),
      fullPage: true,
    });
    console.log("  [ok] 07_result_mobile_full.png");
  } else {
    // Debug: show what's on the page
    const text = await page.textContent("body");
    console.log("Page text:", text?.substring(0, 500));
  }

  await browser.close();
}

main().catch(console.error);
