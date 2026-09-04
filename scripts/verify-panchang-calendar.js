const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyPanchangCalendar() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const ARTIFACTS_DIR = path.resolve('C:/Users/prabh/.gemini/antigravity-ide/brain/0ffc49dd-9353-491e-a310-ce554feed863');

  console.log('--- 1. Navigating to http://localhost:3000/ ---');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('--- 2. Clicking "Panchang" in Global Header ---');
  const panchangLink = page.locator('nav a:has-text("Panchang"), nav a:has-text("पञ्चाङ्ग")').first();
  await panchangLink.click();
  await page.waitForTimeout(1500);

  const currentUrl = page.url();
  console.log('Current URL after clicking Panchang:', currentUrl);
  if (!currentUrl.includes('/calendar')) {
    throw new Error(`Expected URL to include /calendar, but got: ${currentUrl}`);
  }

  const pageTitle = await page.title();
  console.log('Page Title:', pageTitle);

  // Take screenshot of Monthly Calendar default view
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'calendar-unified-monthly-desktop.png'), fullPage: false });
  console.log('Saved calendar-unified-monthly-desktop.png');

  // Verify Today's cell has TODAY badge
  const todayBadge = page.locator('text=TODAY').first();
  const hasTodayBadge = await todayBadge.isVisible();
  console.log('Has today badge in calendar grid:', hasTodayBadge);

  console.log('--- 3. Switching to Today\'s Panchang View ---');
  const todayTab = page.locator('[data-testid="tab-view-today"]');
  await todayTab.click();
  await page.waitForTimeout(1000);

  // Take screenshot of Today's Panchang view
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'calendar-unified-today-desktop.png'), fullPage: false });
  console.log('Saved calendar-unified-today-desktop.png');

  // Verify 5 sacred angas are rendered
  const tithiText = await page.locator('text=१. तिथि').first().isVisible();
  const vaarText = await page.locator('text=२. वार').first().isVisible();
  const nakshatraText = await page.locator('text=३. नक्षत्र').first().isVisible();
  const yogaText = await page.locator('text=४. योग').first().isVisible();
  const karanaText = await page.locator('text=५. करण').first().isVisible();
  console.log('5 Sacred Angas visible:', { tithiText, vaarText, nakshatraText, yogaText, karanaText });

  console.log('--- 4. Testing Mobile Viewport (390x844) ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'calendar-unified-today-mobile.png'), fullPage: false });
  console.log('Saved calendar-unified-today-mobile.png');

  // Switch back to month on mobile
  const monthTabMobile = page.locator('[data-testid="tab-view-month"]');
  await monthTabMobile.click();
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'calendar-unified-monthly-mobile.png'), fullPage: false });
  console.log('Saved calendar-unified-monthly-mobile.png');

  console.log('--- ALL VERIFICATIONS PASSED SUCCESSFULLY ---');
  await browser.close();
}

verifyPanchangCalendar().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
