import { test, expect } from '@playwright/test';

test.describe('Unified Single-Flow Kundli Generation & Master Workspace', () => {

  test('Hero section renders 2-step micro-drawer and generates Kundli directly to /report', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // 1. Verify Hero & Micro-Drawer presence
    const heroSection = page.locator('#hero-section');
    await expect(heroSection).toBeVisible();

    const nameInput = heroSection.locator('input[placeholder*="Priya Sharma"], input[placeholder*="शर्मा"]').first();
    await expect(nameInput).toBeVisible();

    // 2. Focus/expand micro-drawer
    await nameInput.click();
    await nameInput.fill('Aditya K. Sharma');

    // 3. Fill Birth Date
    const dateInput = heroSection.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible();
    await dateInput.fill('1992-08-15');

    // 4. Fill Birth Time in expanded drawer
    const timeInput = heroSection.locator('input[type="time"]').first();
    await expect(timeInput).toBeVisible();
    await timeInput.fill('14:45');

    // 5. Submit "GENERATE MASTER KUNDLI"
    const generateBtn = heroSection.locator('button:has-text("GENERATE MASTER KUNDLI"), button:has-text("सम्पूर्ण जन्म कुण्डली बनाएं")').first();
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // 6. Verify URL transition to /report
    await expect(page).toHaveURL(/.*\/report.*/);

    // 7. Verify subject information on /report
    await expect(page.locator('body')).toContainText('Aditya K. Sharma');
    await expect(page.locator('body')).toContainText('1992-08-15');
  });

  test('Unified Master Workspace (/report) supports 17-Volume Folio and Interactive Workbench', async ({ page }) => {
    await page.goto('http://localhost:3000/report');

    // 1. Check Overview renders first (default)
    await expect(page.locator('#report-tab-overview')).toBeVisible();

    // 2. Switch to Folio tab
    const folioTab = page.locator('#report-tab-folio');
    await expect(folioTab).toBeVisible();
    await folioTab.click();
    await expect(page.locator('body')).toContainText('17-Volume Kundli');

    // 3. Switch to Interactive Workbench
    const workbenchBtn = page.locator('#report-tab-workbench');
    await expect(workbenchBtn).toBeVisible();
    await workbenchBtn.click();

    // 4. Verify Divisional Charts
    await expect(page.locator('body')).toContainText('Divisional Shodashavarga Chart');
    await expect(page.locator('body')).toContainText('Graha Balas & Dignities');

    // 5. Switch division to D9 Navamsha
    const d9Btn = page.locator('button:has-text("D9 Navamsha")').first();
    await expect(d9Btn).toBeVisible();
    await d9Btn.click();
    await expect(page.locator('body')).toContainText('North Indian style — D9');

    // 6. Check the two clean actions: Save Profile & Download PDF. The Print
    // button was retired with the decluttered toolbar — the qualified PDF the
    // visitor downloads carries its own Print command.
    const saveProfileBtn = page.locator('[data-testid="report-save-profile"]').first();
    const downloadPdfBtn = page.locator('[data-testid="report-download-pdf"]').first();
    await expect(saveProfileBtn).toBeVisible();
    await expect(downloadPdfBtn).toBeVisible();
    await expect(page.locator('button:has-text("PRINT / SAVE PDF")')).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Qualified PDF edition' })).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Qualified PDF language' })).toHaveCount(0);
  });

  test('Sample Golden Reference Kundli loading on /report works seamlessly with query parameters', async ({ page }) => {
    // Navigate directly with historical reference parameters
    await page.goto('http://localhost:3000/report?name=Mahatma%20Gandhi&dob=1869-10-02&tob=07:12:00&city=Porbandar');

    // Verify arrival on /report with Gandhi's birth data
    await expect(page).toHaveURL(/.*\/report.*/);
    await expect(page.locator('body')).toContainText('Mahatma Gandhi');
    await expect(page.locator('body')).toContainText('1869-10-02');
    await expect(page.locator('body')).toContainText('Porbandar');
  });

});
