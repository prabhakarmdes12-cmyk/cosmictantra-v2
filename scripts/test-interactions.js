const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.message, err.stack);
    errors.push(err);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[CONSOLE ERROR]', msg.text());
  });

  await page.goto('http://localhost:3000/report?sample=1');
  await page.waitForTimeout(2000);

  console.log('Testing Tab Clicks...');
  const tabs = ['report-tab-folio', 'report-tab-workbench', 'report-tab-dasha', 'report-tab-overview'];
  for (const id of tabs) {
    const el = page.locator('#' + id);
    if (await el.isVisible()) {
      console.log('Clicking tab:', id);
      await el.click();
      await page.waitForTimeout(500);
    }
  }

  console.log('Testing Download button...');
  const dlBtn = page.locator('[data-testid="report-download-pdf"]');
  if (await dlBtn.isVisible()) {
    await dlBtn.click();
    await page.waitForTimeout(500);
    // Press Escape to dismiss the modal cleanly
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  console.log('Testing Historical Benchmarks toggle...');
  const benchBtn = page.locator('text=Historical Benchmarks');
  if (await benchBtn.isVisible()) {
    await benchBtn.click();
    await page.waitForTimeout(500);
  }

  console.log('Testing first-time visitor form submission at /report ...');
  await page.goto('http://localhost:3000/report');
  await page.waitForTimeout(1000);
  await page.fill('input[type="text"]', 'Arjun');
  await page.fill('input[type="date"]', '1995-05-15');
  await page.fill('input[type="time"]', '14:30');
  const cityInput = page.locator('input[placeholder*="Varanasi"]');
  if (await cityInput.isVisible()) {
    await cityInput.fill('Varanasi');
    await page.waitForTimeout(500);
    const cityOpt = page.locator('button:has-text("Varanasi")').first();
    if (await cityOpt.isVisible()) await cityOpt.click();
  }
  const submitBtn = page.locator('button[type="submit"]');
  if (await submitBtn.isVisible()) {
    console.log('Submitting intake form...');
    await submitBtn.click();
    await page.waitForTimeout(2000);
  }

  await browser.close();
  console.log('Interaction test completed! Total errors caught:', errors.length);
})();
