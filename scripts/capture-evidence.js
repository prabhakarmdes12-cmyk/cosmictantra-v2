const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Desktop 1440
  const pageDesktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pageDesktop.goto('http://localhost:3000/report?sample=1', { waitUntil: 'networkidle' });
  await pageDesktop.waitForTimeout(1000);
  await pageDesktop.screenshot({ path: 'public/report-cockpit-desktop.png', fullPage: false });

  // Open download modal screenshot
  const dlBtn = pageDesktop.locator('[data-testid="hero-download-pdf"]');
  if (await dlBtn.isVisible()) {
    await dlBtn.click();
    await pageDesktop.waitForTimeout(500);
    await pageDesktop.screenshot({ path: 'public/download-choice-modal.png', fullPage: false });
    await pageDesktop.keyboard.press('Escape');
    await pageDesktop.waitForTimeout(500);
  }

  // Mobile 390
  const pageMobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await pageMobile.goto('http://localhost:3000/report?sample=1', { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(1000);
  await pageMobile.screenshot({ path: 'public/report-cockpit-mobile.png', fullPage: false });

  await browser.close();
  console.log('Screenshots captured successfully!');
})();
