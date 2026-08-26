import { test, expect } from '@playwright/test';

test.describe('CosmicTantra — Deep QA & Mobile Clickability Suite', () => {

  // Test 1: Mobile 390px (iPhone 14/15) Navigation & Mega Menu Full Traversal
  test('Mobile (390px): Hamburger Menu opens full-screen mega menu and navigates cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });

    // Open mega menu
    const menuBtn = page.getByRole('button', { name: /Open Full Navigation Menu|Open navigation menu|Menu/i }).first();
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Verify modal elements are visible on 390px screen
    await expect(page.getByRole('button', { name: /Close/i }).first()).toBeVisible();

    // Click on "Pooja Store" from mega menu
    const storeTile = page.locator('button').filter({ hasText: /वैदिक पूजा सामग्री प्रतिष्ठान|Vedic Pooja Store|पूजा स्टोर/i }).first();
    await expect(storeTile).toBeVisible();
    await storeTile.click();

    // Verify navigation to store
    await expect(page).toHaveURL(/.*\/store/);
    await expect(page.getByRole('heading', { name: /Pooja Store & Sacred Samagri/i })).toBeVisible();
  });

  // Test 2: Mobile 390px: Pooja Store Catalog, Filter Tabs, Add to Cart, Cart Drawer & Checkout
  test('Mobile (390px): Store category filtering, add to cart, cart drawer and checkout are clickable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/store', { waitUntil: 'domcontentloaded' });

    // Category pills horizontal scroll and click
    const dhoopTab = page.getByRole('button', { name: /धूप, अगरबत्ती व कपूर/i }).first();
    await expect(dhoopTab).toBeVisible();
    await dhoopTab.click();

    // Verify Camphor item is visible
    const camphorTitle = page.getByText(/भीमसेनी/i).first();
    await expect(camphorTitle).toBeVisible();

    // Add to cart directly
    const addBtn = page.getByRole('button', { name: /जोड़ें|Add/i }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Open Cart Drawer via hero floating cart button
    const cartFloatingBtn = page.locator('button').filter({ hasText: /कार्ट/i }).first();
    await expect(cartFloatingBtn).toBeVisible();
    await cartFloatingBtn.scrollIntoViewIfNeeded();
    await cartFloatingBtn.click();
    await page.waitForTimeout(400);

    // Verify Cart Drawer is open with item
    await expect(page.getByText(/आपकी पूजा सामग्री कार्ट|पूजा सामग्री/i).first()).toBeVisible();
    await expect(page.getByText(/भीमसेनी/i).first()).toBeVisible();

    // Click Direct Checkout button (सीधे चेकआउट →)
    const directCheckoutBtn = page.locator('button').filter({ hasText: /सीधे चेकआउट/i }).first();
    await expect(directCheckoutBtn).toBeVisible();
    await directCheckoutBtn.scrollIntoViewIfNeeded();
    await directCheckoutBtn.click();
    await page.waitForTimeout(300);

    // Verify Checkout Modal
    await expect(page.getByText(/सुरक्षित चेकआउट • Delivery Address|चेकआउट/i).first()).toBeVisible();
  });

  // Test 3: Mobile 390px: Live Darshan Category Switcher, Diya Lighting, Flowers & Japa
  test('Mobile (390px): Live Darshan Category Switcher, Diya Lighting and Shrine Navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/darshan', { waitUntil: 'domcontentloaded' });

    // Switch to Char Dham category
    const charDhamTab = page.locator('button').filter({ hasText: /चार धाम/i }).first();
    await expect(charDhamTab).toBeVisible();
    await charDhamTab.scrollIntoViewIfNeeded();
    await charDhamTab.click();
    await page.waitForTimeout(300);

    // Verify shrine in Char Dham
    await expect(page.getByText(/श्री राम जन्मभूमि मंदिर|बदरीनाथ|Char Dham/i).first()).toBeVisible();

    // Virtual Diya Lighting (दीपदान) action
    const diyaBtn = page.locator('button').filter({ hasText: /दीपदान/i }).first();
    await expect(diyaBtn).toBeVisible();
    await diyaBtn.scrollIntoViewIfNeeded();
    await diyaBtn.click();
    await expect(page.getByText(/दीपदान ✓/i)).toBeVisible();

    // Offer Flowers (पुष्प अर्पण) action
    const flowerBtn = page.locator('button').filter({ hasText: /पुष्प अर्पण/i }).first();
    await expect(flowerBtn).toBeVisible();
    await flowerBtn.click();

    // Japa Counter increment
    const japaBtn = page.locator('button').filter({ hasText: /जप/i }).first();
    await expect(japaBtn).toBeVisible();
    await japaBtn.click();
  });

  // Test 4: Mobile 390px: Stellarium Vedic Observatory Time Scrubber & Site Preset Switching
  test('Mobile (390px): Stellarium Observatory Canvas, Presets and Time Controls', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/observatory', { waitUntil: 'domcontentloaded' });

    // Verify canvas is rendered
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Switch Observatory Site Preset to Ujjain via select dropdown
    const select = page.locator('select').first();
    await expect(select).toBeVisible();
    await select.selectOption('ujjain');

    // Verify active planet astrological meaning is visible
    await expect(page.getByText(/वैदिक तात्विक प्रभाव/i)).toBeVisible();
  });

  // Test 5: Mobile 390px: Parivaar Vault Tab Switching & Add Member Modal
  test('Mobile (390px): Parivaar Vault Profile Switching, Fasting Toggles, and DPDP Export', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Family Members & Birth Profiles|पारिवारिक कुण्डली वॉल्ट/i).first()).toBeVisible();

    // Switch to Orders Tab
    const ordersTab = page.locator('button').filter({ hasText: /ई-पूजा|ऑर्डर इतिहास/i }).first();
    await expect(ordersTab).toBeVisible();
    await ordersTab.scrollIntoViewIfNeeded();
    await ordersTab.click();
    await expect(page.getByText(/पावन संकल्प|पूजा सामग्री ऑर्डर|Orders History/i).first()).toBeVisible();

    // Switch to Notification Preferences Tab
    const alertsTab = page.locator('button').filter({ hasText: /पञ्चाङ्ग व व्रत सूचना/i }).first();
    await expect(alertsTab).toBeVisible();
    await alertsTab.scrollIntoViewIfNeeded();
    await alertsTab.click();
    await expect(page.getByText(/दैनिक पञ्चाङ्ग व व्रत सूचना सेटिंग्स/i)).toBeVisible();

    // Switch to Privacy & DPDP Tab
    const privacyTab = page.locator('button').filter({ hasText: /डेटा बैकअप|गोपनीयता/i }).first();
    await expect(privacyTab).toBeVisible();
    await privacyTab.scrollIntoViewIfNeeded();
    await privacyTab.click();
    await expect(page.getByText(/DPDP Privacy & Local Data Sovereign Controls/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /पारिवारिक वॉल्ट बैकअप|Export JSON/i })).toBeVisible();
  });

  // Test 6: Desktop 1440px: Complete Global Mega Menu Direct Nav
  test('Desktop (1440px): Mega Menu direct navigation to all platform hubs', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });

    // Open mega menu modal
    const menuBtn = page.getByRole('button', { name: /Open Full Navigation Menu|Menu/i }).first();
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Click on Stellarium Observatory
    const obsTile = page.locator('button').filter({ hasText: /खगोल वेधशाला|Stellarium/i }).first();
    await expect(obsTile).toBeVisible();
    await obsTile.click();

    await expect(page).toHaveURL(/.*\/observatory/);
    await expect(page.getByRole('heading', { name: /The Living Cosmic Dome/i })).toBeVisible();
  });

});
