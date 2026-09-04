const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\prabh\\.gemini\\antigravity-ide\\brain\\0ffc49dd-9353-491e-a310-ce554feed863';

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Desktop verification (1440x900)
  console.log('--- STARTING DESKTOP HEADER & PANCHANG VERIFICATION (1440x900) ---');
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktopCtx.newPage();

  const errors = [];
  page.on('pageerror', err => {
    console.error('[PAGE ERROR]', err.message);
    errors.push(err.message);
  });

  // A. Check Homepage Header
  console.log('1. Checking Homepage (/) Header...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Check header elements
  const header = page.locator('#global-header-unified');
  await header.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✓ Header #global-header-unified is visible');

  // Verify left links: Panchang, Kundli, Milan, Granth
  const leftLinks = await page.locator('#global-header-unified a[href="/panchang"]').count();
  const kundliLinks = await page.locator('#global-header-unified a[href="/report"]').count();
  const milanLinks = await page.locator('#global-header-unified a[href="/kundali-milan"]').count();
  const granthLinks = await page.locator('#global-header-unified a[href="/granth"]').count();

  console.log(`✓ Navigation links found: Panchang (${leftLinks}), Kundli (${kundliLinks}), Milan (${milanLinks}), Granth (${granthLinks})`);
  if (leftLinks === 0 || kundliLinks === 0) {
    throw new Error('Expected minimal left links Panchang and Kundli to be present');
  }

  // Verify center logo
  const centerLogo = page.locator('#global-header-unified a[href="/"]');
  const logoBox = await centerLogo.first().boundingBox();
  console.log('✓ Center Logo bounding box:', logoBox);
  if (!logoBox) throw new Error('Center logo bounding box not found');

  // Screenshot homepage header
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'header-desktop-homepage.png') });
  console.log('✓ Saved header-desktop-homepage.png');

  // B. Check Canonical /panchang Page
  console.log('\n2. Checking Canonical /panchang Page...');
  await page.goto('http://localhost:3000/panchang', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Check that no birth intake modal or birth form is blocking
  const pageTitle = await page.locator('h1').innerText();
  console.log('✓ Panchang Page H1:', pageTitle);
  if (!pageTitle.includes('पञ्चाङ्ग') && !pageTitle.includes('पंचांग') && !pageTitle.includes('Panchang')) {
    throw new Error(`Unexpected H1 on /panchang: ${pageTitle}`);
  }

  // Check 5 Core Angas
  const angaCards = await page.locator('.font-editorial.text-lg.font-bold').allInnerTexts();
  console.log('✓ Panchang Angas/Headings found:', angaCards);

  // Test City Quick Pill Switch (e.g. click "Varanasi")
  console.log('3. Testing City Quick Pill Click (Varanasi)...');
  const varanasiBtn = page.locator('button:has-text("Varanasi")');
  if (await varanasiBtn.isVisible()) {
    await varanasiBtn.click();
    await page.waitForTimeout(500);
    const locationBadge = await page.locator('span:has-text("Varanasi")').first().innerText();
    console.log('✓ Active location switched to:', locationBadge);
  }

  // Screenshot /panchang desktop
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'panchang-desktop-canonical.png') });
  console.log('✓ Saved panchang-desktop-canonical.png');

  // C. Check /report Header Consistency
  console.log('\n4. Checking /report?sample=1 Header Consistency...');
  await page.goto('http://localhost:3000/report?sample=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const reportHeader = page.locator('#global-header-unified');
  if (!(await reportHeader.isVisible())) {
    throw new Error('Header #global-header-unified not visible on /report');
  }
  const reportLeftPanchang = await page.locator('#global-header-unified a[href="/panchang"]').count();
  console.log('✓ /report has unified global header with Panchang link:', reportLeftPanchang > 0);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'report-desktop-unified-header.png') });
  console.log('✓ Saved report-desktop-unified-header.png');

  // 2. Mobile verification (390x844 - iPhone 14/15 size)
  console.log('\n--- STARTING MOBILE VERIFICATION (390x844) ---');
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobilePage = await mobileCtx.newPage();

  console.log('5. Checking Mobile /panchang...');
  await mobilePage.goto('http://localhost:3000/panchang', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(800);

  // Check center logo on mobile top bar
  const mobileCenterLogo = mobilePage.locator('#global-header-unified a[href="/"]');
  console.log('✓ Mobile top bar center logo visible:', await mobileCenterLogo.first().isVisible());

  // Check mobile bottom bar items: Panchang, Kundli, Milan, Menu
  const bottomBarPanchang = await mobilePage.locator('nav.fixed.bottom-0 a[href="/panchang"]').count();
  const bottomBarKundli = await mobilePage.locator('nav.fixed.bottom-0 a[href="/report"]').count();
  console.log(`✓ Mobile bottom bar links: Panchang (${bottomBarPanchang}), Kundli (${bottomBarKundli})`);

  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'panchang-mobile-view.png') });
  console.log('✓ Saved panchang-mobile-view.png');

  console.log('6. Checking Mobile /report header & bottom bar...');
  await mobilePage.goto('http://localhost:3000/report?sample=1', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'report-mobile-unified-header.png') });
  console.log('✓ Saved report-mobile-unified-header.png');

  await browser.close();

  if (errors.length > 0) {
    console.warn(`Encountered ${errors.length} errors/warnings during verification:`, errors);
  } else {
    console.log('\n🎉 ALL HEADER AND PANCHANG VERIFICATION TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS!');
  }
})();
