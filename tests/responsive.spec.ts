import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: '320_small_phone', width: 320, height: 680 },
  { name: '360_android', width: 360, height: 740 },
  { name: '375_iphone_se', width: 375, height: 667 },
  { name: '390_iphone_13_14', width: 390, height: 844 },
  { name: '412_pixel_samsung', width: 412, height: 915 },
  { name: '430_iphone_pro_max', width: 430, height: 932 },
  { name: '768_ipad_portrait', width: 768, height: 1024 },
  { name: '1024_ipad_landscape', width: 1024, height: 768 },
  { name: '1440_desktop', width: 1440, height: 900 }
];

test.describe('CosmicTantra Mobile Responsiveness & Hardening Suite', () => {

  VIEWPORTS.forEach(({ name, width, height }) => {
    test(`Viewport ${width}px (${name}): No horizontal overflow and clean mobile composition`, async ({ page }) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

      // Scroll through page to trigger all rendered sections
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 800;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              resolve(true);
            }
          }, 15);
        });
      });

      // 1. Global Responsive Invariant Assert: document.documentElement.scrollWidth <= window.innerWidth + 1
      const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const windowInnerWidth = await page.evaluate(() => window.innerWidth);
      
      expect(docScrollWidth).toBeLessThanOrEqual(windowInnerWidth + 1);

      // 2. Brand Logo / Wordmark Visibility
      const logoText = page.locator('text=COSMICTANTRA').first();
      await expect(logoText).toBeVisible();
      
      const logoRect = await logoText.boundingBox();
      if (logoRect) {
        expect(logoRect.x).toBeGreaterThanOrEqual(0);
        expect(logoRect.x + logoRect.width).toBeLessThanOrEqual(width + 2);
      }

      // 3. Hero Video Background Visibility
      const videoBg = page.locator('video');
      await expect(videoBg).toBeVisible();

      // 4. Hero Headline & CTAs Reachable
      const panchangBtn = page.locator('button:has-text("SEE TODAY\'S PANCHANG")').first();
      const createKundaliBtn = page.locator('button:has-text("CREATE MY KUNDALI")').first();
      const askScholarBtn = page.locator('button:has-text("JYOTISHI")').first();

      await expect(panchangBtn).toBeVisible();
      await expect(createKundaliBtn).toBeVisible();
      await expect(askScholarBtn).toBeVisible();

      // Take screenshot for visual regression verification
      const screenshotDir = path.join(process.cwd(), 'scratch', 'screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      await page.screenshot({ path: path.join(screenshotDir, `viewport_${width}px_${name}.png`), fullPage: false });
    });
  });

  test('Mobile Drawer opens and navigates cleanly at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 680 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    const menuToggleBtn = page.locator('button[aria-label="Open navigation menu"]');
    await expect(menuToggleBtn).toBeVisible();
    await menuToggleBtn.click();

    // Verify Mobile Drawer content
    const todayNavBtn = page.locator('button:has-text("PANCHANG")').first();
    await expect(todayNavBtn).toBeVisible();
  });
});
