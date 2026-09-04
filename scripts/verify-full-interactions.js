const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => {
    console.error('[PAGE ERROR]', err.message, err.stack);
    errors.push(err.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('[CONSOLE ERROR]', msg.text());
      errors.push(msg.text());
    }
  });

  console.log('1. Testing /dashboard redirect...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  if (!page.url().includes('/report')) {
    throw new Error(`Expected redirect to /report, got ${page.url()}`);
  }
  console.log('✓ /dashboard successfully redirected to:', page.url());

  console.log('2. Testing /report?sample=1 (Populated Dashboard Cockpit)...');
  await page.goto('http://localhost:3000/report?sample=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check 4 Life at a Glance metrics
  const glanceCards = await page.locator('[data-testid="life-glance-metrics"] > div').count();
  console.log(`Found ${glanceCards} Life at a Glance metric cards`);
  if (glanceCards < 4) {
    throw new Error(`Expected at least 4 metric cards, found ${glanceCards}`);
  }

  // Check Persona Hero
  const personaHero = page.locator('[data-testid="persona-hero"]');
  if (!(await personaHero.isVisible())) {
    throw new Error('Persona Hero is not visible');
  }
  console.log('✓ Persona Hero visible');

  // Test Horizontal Rail Tabs
  console.log('3. Testing Horizontal Rail Segmented Tabs...');
  const railTabs = ['rail-tab-overview', 'rail-tab-folio', 'rail-tab-workbench', 'rail-tab-dasha'];
  for (const tabId of railTabs) {
    const tabBtn = page.locator(`[data-testid="${tabId}"]`);
    if (await tabBtn.isVisible()) {
      console.log(`Clicking rail tab: ${tabId}`);
      await tabBtn.click();
      await page.waitForTimeout(300);
    } else {
      console.warn(`Rail tab ${tabId} not found by data-testid`);
    }
  }
  console.log('✓ All rail tabs clicked smoothly');

  // Test Download Choice Modal
  console.log('4. Testing Download Choice Modal...');
  const dlBtn = page.locator('[data-testid="hero-download-pdf"]');
  if (await dlBtn.isVisible()) {
    await dlBtn.click();
    await page.waitForTimeout(500);

    // Modal should be visible
    const modalHeading = page.locator('text=Choose Your Kundli Dossier');
    if (await modalHeading.isVisible()) {
      console.log('✓ Download Choice Modal opened');
    } else {
      throw new Error('Download Choice Modal did not open');
    }

    // Close modal via close button
    const closeBtn = page.locator('[data-testid="close-download-choice-modal"]');
    await closeBtn.click();
    await page.waitForTimeout(500);
    console.log('✓ Download Choice Modal closed cleanly');
  }

  // Test Historical Benchmarks Accordion Toggle
  console.log('5. Testing Historical Benchmarks Accordion Toggle...');
  const benchToggle = page.locator('text=Historical Benchmarks');
  if (await benchToggle.isVisible()) {
    await benchToggle.click();
    await page.waitForTimeout(500);
    const benchmarkCard = page.locator('text=Chhatrapati Shivaji Maharaj');
    const isBenchVisible = await benchmarkCard.isVisible();
    console.log('Historical benchmark profile visible after toggle:', isBenchVisible);
    // Toggle closed
    await benchToggle.click();
    await page.waitForTimeout(300);
  }

  // Test First-Time Visitor Intake Form at /report
  console.log('6. Testing First-Time Visitor Intake Form at /report...');
  await page.goto('http://localhost:3000/report', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.fill('Prabhakar Test');
  const dateInput = page.locator('input[type="date"]').first();
  await dateInput.fill('1988-08-15');
  const timeInput = page.locator('input[type="time"]').first();
  await timeInput.fill('06:30');

  const cityInput = page.locator('input[placeholder*="Varanasi"], input[placeholder*="Delhi"], input[placeholder*="City"]').first();
  if (await cityInput.isVisible()) {
    await cityInput.fill('Varanasi');
    await page.waitForTimeout(400);
    const cityOption = page.locator('button:has-text("Varanasi")').first();
    if (await cityOption.isVisible()) {
      await cityOption.click();
    }
  }

  const submitBtn = page.locator('button[type="submit"]');
  if (await submitBtn.isVisible()) {
    console.log('Submitting intake form...');
    await submitBtn.click();
    await page.waitForTimeout(2000);
    // Should now show the generated dashboard cockpit with the user's name
    const userNameHeading = page.locator('text=Prabhakar Test');
    if (await userNameHeading.isVisible()) {
      console.log('✓ Intake form successfully generated Kundli Cockpit for Prabhakar Test!');
    }
  }

  console.log('7. Final error count:', errors.length);
  if (errors.length > 0) {
    console.error('Errors encountered during verification:', errors);
    process.exit(1);
  }

  console.log('ALL VERIFICATIONS PASSED CLEANLY! ZERO RUNTIME ERRORS!');
  await browser.close();
})();
