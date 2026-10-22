import { chromium } from '@playwright/test';
import path from 'path';

async function testLiveUntunedUpload() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Paths to test documents
  const formPath = path.resolve(process.cwd(), 'tests/fixtures/scans/scan_01_clean_form.png');
  const untunedMarksheetPath = path.resolve(process.cwd(), 'tests/fixtures/unseen/state_board_marksheet.jpg');
  const incomePath = path.resolve(process.cwd(), 'tests/fixtures/scans/scan_03_clean_income_cert.png');

  console.log('Uploading 3 documents (including fictional State Board marksheet)...');
  await page.setInputFiles('[data-testid="upload-input-application_form"]', formPath);
  await page.waitForTimeout(500);

  await page.setInputFiles('[data-testid="upload-input-marksheet"]', untunedMarksheetPath);
  await page.waitForTimeout(500);

  await page.setInputFiles('[data-testid="upload-input-income_certificate"]', incomePath);
  await page.waitForTimeout(500);

  console.log('Clicking "Run check" for live verification...');
  const runCheckBtn = page.getByRole('button', { name: /Run check/i });
  await runCheckBtn.click();

  console.log('Waiting for live Gemini Multimodal extraction response (up to 45s)...');
  // Wait for either the counter cards to update or results to appear
  await page.waitForSelector('[data-testid="counter-conflicts"]', { timeout: 45000 });
  await page.waitForTimeout(1000);

  const conflicts = await page.locator('[data-testid="counter-conflicts"] .text-3xl').innerText();
  const consistent = await page.locator('[data-testid="counter-consistent"] .text-3xl').innerText();
  const needsReview = await page.locator('[data-testid="counter-needs-review"] .text-3xl').innerText();

  console.log(`\n=== LIVE CHECK RESULTS ON STATE BOARD MARKSHEET PACKET ===`);
  console.log(`Conflicts:    ${conflicts}`);
  console.log(`Consistent:   ${consistent}`);
  console.log(`Needs Review: ${needsReview}`);

  // Take screenshot of overview
  const screenshotPath = path.resolve(
    'C:/Users/u/.gemini/antigravity-ide/brain/18d02ada-3bd8-4c42-9274-8d1ab7044b09/untuned_live_result.png'
  );
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved live overview screenshot to:', screenshotPath);

  // Now click on "Marks Percentage" to open the Evidence Drawer and inspect
  const marksRow = page.locator('text=Marks Percentage').first();
  await marksRow.click();
  await page.waitForSelector('aside', { state: 'visible' });
  await page.waitForTimeout(500);

  const drawerScreenshotPath = path.resolve(
    'C:/Users/u/.gemini/antigravity-ide/brain/18d02ada-3bd8-4c42-9274-8d1ab7044b09/untuned_live_drawer.png'
  );
  await page.screenshot({ path: drawerScreenshotPath });
  console.log('Saved live Evidence Drawer screenshot to:', drawerScreenshotPath);

  await browser.close();
  console.log('✓ Live untuned test completed successfully.');
}

testLiveUntunedUpload().catch(console.error);
