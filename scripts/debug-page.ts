import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Login
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', "examinee@test.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Go to first exam
  await page.goto(`${BASE_URL}/exams`);
  await page.waitForTimeout(2000);

  const examLink = page.locator('a[href^="/exams/"]').first();
  if (await examLink.count()) {
    const href = await examLink.getAttribute("href");
    console.log("Exam link:", href);
    await examLink.click();
    await page.waitForTimeout(2000);

    // List all buttons on page
    const buttons = page.locator("button");
    const bCount = await buttons.count();
    console.log(`\nFound ${bCount} buttons:`);
    for (let i = 0; i < bCount; i++) {
      const text = await buttons.nth(i).textContent();
      const disabled = await buttons.nth(i).isDisabled();
      console.log(`  [${i}] "${text?.trim()}" (disabled: ${disabled})`);
    }
  }

  await browser.close();
}

main().catch(console.error);
