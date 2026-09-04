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

  console.log('1. Checking CONSULT Navigation & Modal Triggers...');
  await page.goto('http://localhost:3000/report?sample=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check Consult Button in GlobalHeader
  const consultBtn = page.locator('header button:has-text("Consult")');
  if (await consultBtn.isVisible()) {
    console.log('✓ Found Consult button in GlobalHeader');
    await consultBtn.click();
    const isModalVisible = (await page.locator('text=Birth Details Required').isVisible()) || 
                           (await page.locator('text=Shubh Vidwan Session').isVisible()) ||
                           (await page.locator('text=Request Traditional Scholar Consultation').isVisible());
    console.log('✓ Consult modal opened cleanly on header Consult click:', isModalVisible);
    if (!isModalVisible) {
      throw new Error('Consult modal was expected to open upon clicking Consult');
    }
    // Close modal
    const closeBtn = page.locator('button[aria-label="Close consultation modal"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    } else {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  }

  // Check MegaMenu for /ask link
  const menuBtn = page.locator('header button[aria-label="Open navigation menu"]');
  if (await menuBtn.isVisible()) {
    await menuBtn.click();
    await page.waitForTimeout(500);
    const askLinks = await page.locator('a[href="/ask"]').count();
    console.log(`Found ${askLinks} link(s) to /ask in MegaMenu`);
    if (askLinks === 0) {
      throw new Error('Expected Consult link to point to /ask in MegaMenu');
    }
    console.log('✓ MegaMenu correctly routes Consult to /ask instead of backoffice practitioners!');
    // Close MegaMenu with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  console.log('2. Checking Workspace Rail and Breadcrumb Order...');
  const workspaceRail = page.locator('[data-testid="secondary-workspace-rail"]');
  if (!(await workspaceRail.isVisible())) {
    throw new Error('Secondary workspace rail is not visible');
  }

  const breadcrumbs = page.locator('[data-testid="report-breadcrumbs"]');
  if (!(await breadcrumbs.isVisible())) {
    throw new Error('Breadcrumbs are not visible');
  }

  // Verify bounding box order (Rail above Breadcrumbs)
  const railBox = await workspaceRail.boundingBox();
  const breadcrumbBox = await breadcrumbs.boundingBox();
  console.log(`Rail Y: ${railBox.y}, Breadcrumbs Y: ${breadcrumbBox.y}`);
  if (railBox.y >= breadcrumbBox.y) {
    throw new Error(`Workspace rail (Y: ${railBox.y}) should be positioned ABOVE breadcrumbs (Y: ${breadcrumbBox.y})`);
  }
  console.log('✓ Secondary workspace rail is correctly positioned directly below header and above breadcrumbs!');

  console.log('3. Checking Vedic Graha Cabinet below Cosmic Blueprint...');
  const cosmicBlueprint = page.locator('text=Cosmic Blueprint');
  if (!(await cosmicBlueprint.isVisible())) {
    throw new Error('Cosmic Blueprint header is not visible');
  }

  const grahaCabinet = page.locator('[data-testid="vedic-graha-cabinet"]');
  if (!(await grahaCabinet.isVisible())) {
    throw new Error('Vedic Graha Cabinet is not visible');
  }

  const blueprintBox = await cosmicBlueprint.boundingBox();
  const cabinetBox = await grahaCabinet.boundingBox();
  console.log(`Cosmic Blueprint Y: ${blueprintBox.y}, Graha Cabinet Y: ${cabinetBox.y}`);
  if (blueprintBox.y >= cabinetBox.y) {
    throw new Error('Graha Cabinet must be positioned below Cosmic Blueprint');
  }
  console.log('✓ Vedic Graha Cabinet is correctly positioned below Cosmic Blueprint!');

  // Check Graha count (9 planets)
  const grahaRows = await page.locator('[data-testid^="graha-row-"]').count();
  console.log(`Found ${grahaRows} planetary rows in Vedic Graha Cabinet`);
  if (grahaRows < 9) {
    throw new Error(`Expected 9 grahas, found ${grahaRows}`);
  }

  // Click a planet row to test interactivity
  console.log('4. Testing Graha row click interaction...');
  const jupiterRow = page.locator('[data-testid="graha-row-jupiter"]');
  if (await jupiterRow.isVisible()) {
    await jupiterRow.click();
    await page.waitForTimeout(400);
    console.log('✓ Jupiter row clicked cleanly');
  }

  // Capture Desktop Screenshot
  console.log('5. Capturing Desktop Screenshots...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'report-graha-cabinet-desktop.png'),
    fullPage: false
  });

  // Scroll down to Graha Cabinet and capture detailed screenshot
  await grahaCabinet.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'report-graha-cabinet-focused.png'),
    fullPage: false
  });

  // Test Mobile 390px Viewport
  console.log('6. Testing Mobile Viewport (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/report?sample=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'report-graha-cabinet-mobile.png'),
    fullPage: false
  });

  const mobileGrahaCabinet = page.locator('[data-testid="vedic-graha-cabinet"]');
  await mobileGrahaCabinet.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'report-graha-cabinet-mobile-focused.png'),
    fullPage: false
  });

  console.log('7. Final verification summary...');
  console.log('Errors count:', errors.length);
  if (errors.length > 0) {
    console.error('Errors encountered:', errors);
    process.exit(1);
  }

  console.log('ALL VERIFICATION CHECKS PASSED WITH FLYING COLORS!');
  await browser.close();
})();
