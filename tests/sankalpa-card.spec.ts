import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('CosmicTantra — 9:16 Vedic Sankalpa & Daily Panchang Card Suite', () => {
  
  test('9:16 Sankalpa Card Modal opens, renders all 12 date/sankalpa aspects, and toggles Sanskrit mantra', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    
    // Find and click the Share / Daily Card button in Panchang section
    const shareBtn = page.locator('#panchang-section button:has-text("दैनिक पञ्चाङ्ग साझा करें"), #panchang-section button:has-text("Share Daily Card")');
    await expect(shareBtn).toBeVisible({ timeout: 10000 });
    await shareBtn.click();

    // Verify 9:16 Card Modal is visible
    const modalHeader = page.locator('text=9:16 वैदिक पञ्चाङ्ग व सङ्कल्प');
    await expect(modalHeader).toBeVisible();

    // Verify Invocations & Date Aspects
    await expect(page.locator('text=श्री काशी विश्वनाथो विजयतेतराम')).toBeVisible();
    await expect(page.locator('text=सङ्कल्प काल गणना')).toBeVisible();
    await expect(page.locator('text=विक्रम संवत्').first()).toBeVisible();
    await expect(page.locator('text=अयन:').first()).toBeVisible();
    await expect(page.locator('text=ऋतु:').first()).toBeVisible();
    await expect(page.locator('text=मास:').first()).toBeVisible();
    await expect(page.locator('text=योग').first()).toBeVisible();
    await expect(page.locator('text=करण').first()).toBeVisible();
    await expect(page.locator('text=शुभ वेला').first()).toBeVisible();
    await expect(page.locator('text=वर्जित काल').first()).toBeVisible();
    await expect(page.locator('text=पञ्चाङ्गस्य फलं श्रुत्वा गङ्गास्नानफलं लभेत्')).toBeVisible();

    // Verify WhatsApp Share Button
    const whatsappBtn = page.locator('button:has-text("व्हाट्सएप पर शेयर करें")');
    await expect(whatsappBtn).toBeVisible();

    // Switch to Sanskrit Sankalpa Mantra Tab
    const sankalpaTabBtn = page.locator('button:has-text("सङ्कल्प मन्त्र")');
    await expect(sankalpaTabBtn).toBeVisible();
    await sankalpaTabBtn.click();

    // Verify Sanskrit Mantra Content
    await expect(page.locator('text=ॐ विष्णुर्विष्णुर्विष्णुः श्रीमद्भगवतो महापुरुषस्य')).toBeVisible();
    await expect(page.locator('text=श्रीश्वेतवाराहकल्पे')).toBeVisible();
    await expect(page.locator('text=सङ्कल्प विधि')).toBeVisible();

    // Verify Copy Button
    const copyBtn = page.locator('button:has-text("सङ्कल्प कॉपी")');
    await expect(copyBtn).toBeVisible();
  });

});
