import { chromium } from 'playwright';

async function testVisuals() {
  const browser = await chromium.launch();
  
  // 1. Light Mode Desktop
  const contextLight = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageLight = await contextLight.newPage();
  await pageLight.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await pageLight.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    localStorage.setItem('cosmictantra_theme', 'light');
  });
  await pageLight.waitForTimeout(300);
  await pageLight.screenshot({ path: 'scratch/screenshot_home_light.png', fullPage: false });

  // 2. Dark Mode Desktop
  const contextDark = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageDark = await contextDark.newPage();
  await pageDark.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await pageDark.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    localStorage.setItem('cosmictantra_theme', 'dark');
  });
  await pageDark.waitForTimeout(300);
  await pageDark.screenshot({ path: 'scratch/screenshot_home_dark.png', fullPage: false });

  // 3. Dark Mode Mobile
  const contextMobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await pageMobile.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    localStorage.setItem('cosmictantra_theme', 'dark');
  });
  await pageMobile.waitForTimeout(300);
  await pageMobile.screenshot({ path: 'scratch/screenshot_mobile_dark.png', fullPage: false });

  // Check Cosmic Now locator visibility
  const cosmicNowHeader = pageDark.locator('text=Cosmic Now').first();
  const isVisible = await cosmicNowHeader.isVisible();
  console.log(`Cosmic Now visible in dark mode: ${isVisible}`);

  await browser.close();
  console.log('Visual tests complete!');
}

testVisuals().catch(console.error);
