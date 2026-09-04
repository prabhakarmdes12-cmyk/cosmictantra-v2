const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const routes = [
    '/',
    '/dashboard',
    '/report',
    '/report?sample=1',
    '/kundli',
    '/milan',
    '/daily',
    '/calendar',
    '/granth',
    '/observatory',
    '/darshan',
    '/store',
    '/profile'
  ];

  let totalErrors = 0;

  for (const route of routes) {
    const page = await browser.newPage();
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => {
      errors.push(err.stack || err.message);
    });

    try {
      const response = await page.goto('http://localhost:3000' + route, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(1000);
      console.log(`Route ${route}: status ${response ? response.status() : 'null'}, url: ${page.url()}`);
      if (errors.length > 0) {
        console.error(`Route ${route} ERRORS:`, errors);
        totalErrors += errors.length;
      }
    } catch (e) {
      console.error(`Route ${route} FAILED:`, e.message);
      totalErrors++;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`Finished checking routes. Total errors found: ${totalErrors}`);
  process.exit(totalErrors > 0 ? 1 : 0);
})();
