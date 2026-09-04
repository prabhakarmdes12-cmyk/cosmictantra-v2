const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\prabh\\.gemini\\antigravity-ide\\brain\\0ffc49dd-9353-491e-a310-ce554feed863';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];

  page.on('pageerror', err => {
    console.error('[PAGE ERROR]', err.message);
    errors.push(err.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('[CONSOLE ERROR]', msg.text());
      errors.push(msg.text());
    }
  });

  console.log('--- Step 1: Testing /report Intake Breadcrumb (No Sample) ---');
  // Clear localStorage before visiting intake
  await page.goto('http://localhost:3000/report', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:3000/report', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const breadcrumbsIntake = page.locator('[data-testid="report-breadcrumbs"]');
  const breadcrumbText = await breadcrumbsIntake.textContent();
  console.log('Breadcrumbs text on fresh intake:', breadcrumbText);

  if (breadcrumbText.includes('Mahatma Gandhi')) {
    throw new Error('Breadcrumb on blank intake form should NOT show Mahatma Gandhi! It should show Enter Details.');
  }
  if (!breadcrumbText.includes('Enter Details') && !breadcrumbText.includes('विवरण भरें')) {
    throw new Error('Breadcrumb on blank intake form must show "Enter Details"');
  }
  console.log('✓ Breadcrumb on fresh intake correctly displays "Enter Details"!');

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'report-intake-breadcrumb-clean.png'),
    fullPage: false
  });

  console.log('--- Step 2: Selecting a Benchmark Profile ---');
  const vivekanandaBtn = page.locator('button:has-text("Swami Vivekananda")');
  if (await vivekanandaBtn.isVisible()) {
    await vivekanandaBtn.click();
    await page.waitForTimeout(1000);
    const updatedBreadcrumbs = await page.locator('[data-testid="report-breadcrumbs"]').textContent();
    console.log('Breadcrumb after selecting Swami Vivekananda:', updatedBreadcrumbs);
    if (!updatedBreadcrumbs.includes('Swami Vivekananda')) {
      throw new Error('Expected breadcrumb to display Swami Vivekananda');
    }
    console.log('✓ Profile switched to Swami Vivekananda cleanly!');
  }

  console.log('--- Step 3: Testing "My Day Panchang" Tab inside /report ---');
  const panchangRailTab = page.locator('[data-testid="rail-tab-panchang"]');
  if (!(await panchangRailTab.isVisible())) {
    throw new Error('Could not find [data-testid="rail-tab-panchang"] in workspace rail');
  }

  console.log('Clicking "My Day Panchang" tab...');
  await panchangRailTab.click();
  await page.waitForTimeout(1000);

  const currentUrl = page.url();
  console.log('Current URL after clicking My Day Panchang:', currentUrl);
  if (currentUrl.includes('/daily')) {
    throw new Error(`CRITICAL FAILURE: Clicking My Day Panchang navigated away to /daily (${currentUrl})! It must remain on /report.`);
  }
  console.log('✓ Remained inside /report workspace (no unwanted redirect to /daily)!');

  const panchangPanel = page.locator('[data-testid="report-panel-panchang"]');
  if (!(await panchangPanel.isVisible())) {
    throw new Error('Expected [data-testid="report-panel-panchang"] to be visible after clicking tab');
  }
  console.log('✓ Report Panchang panel is rendered!');

  // Check 3-day cards exist
  const forecastCards = await page.locator('[data-testid^="daily-cosmic-card-"]').count();
  console.log(`Found ${forecastCards} DailyCosmicCard(s) rendered in Panchang panel`);
  if (forecastCards < 3) {
    throw new Error(`Expected at least 3 daily forecast cards (आज, कल, परसों), found ${forecastCards}`);
  }
  console.log('✓ All 3 Vedic daily cards (आज, कल, परसों) are rendered!');

  // Check Panchang limbs
  const tithiCard = page.locator('text="1. Tithi"').first();
  const nakshatraCard = page.locator('text="2. Nakshatra"').first();
  console.log('Panchang limbs visible:', await tithiCard.isVisible(), await nakshatraCard.isVisible());

  // Check breadcrumb updated to My Day Panchang
  const panchangBreadcrumbs = await page.locator('[data-testid="report-breadcrumbs"]').textContent();
  console.log('Breadcrumbs on Panchang tab:', panchangBreadcrumbs);
  if (!panchangBreadcrumbs.includes('My Day Panchang') && !panchangBreadcrumbs.includes('दैनिक पंचांग')) {
    throw new Error('Expected breadcrumb to include "My Day Panchang"');
  }
  console.log('✓ Breadcrumb updated to indicate My Day Panchang tab!');

  // Screenshot desktop Panchang panel
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'report-panchang-tab-desktop.png'),
    fullPage: false
  });

  // Test Mobile 390px Viewport
  console.log('--- Step 4: Testing Mobile Viewport (390x844) for Panchang Tab ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'report-panchang-tab-mobile.png'),
    fullPage: false
  });
  console.log('✓ Captured mobile screenshot for Panchang tab');

  // Test Step 5: Direct navigation to /daily should NOT show empty profile state
  console.log('--- Step 5: Testing Direct Navigation to /daily with Active Profile ---');
  await page.goto('http://localhost:3000/daily', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const emptyStatePrompt = page.locator('text=Start with your own chart');
  const isEmptyPromptVisible = await emptyStatePrompt.isVisible();
  console.log('Empty state prompt visible on /daily:', isEmptyPromptVisible);

  if (isEmptyPromptVisible) {
    throw new Error('CRITICAL FAILURE: /daily showed "Start with your own chart" even though an active profile was set!');
  }
  console.log('✓ /daily recognized active profile from localStorage and loaded forecast directly!');

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'daily-page-hydrated-profile.png'),
    fullPage: false
  });

  console.log('\n========================================');
  console.log('ALL PANCHANG & PROFILE SYNC CHECKS PASSED!');
  console.log('========================================\n');

  await browser.close();
})().catch(err => {
  console.error('Test script failed:', err);
  process.exit(1);
});
