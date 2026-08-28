import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('CosmicTantra — Free WhatsApp Help Desk & Paid Scholar Handoff Acceptance Suite', () => {

  test('Step 1-6: Public CTA discoverability, Honest Two-Stage Modal, Canonical WhatsApp URL & Intent Tracking', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    // 1. Discover Free Help Desk CTA banner on Home
    const helpDeskBanner = page.getByText(/काशी सहायता केंद्र|Talk to Kashi Help Desk/i).first();
    await expect(helpDeskBanner).toBeVisible({ timeout: 10000 });

    // 2. Click "निःशुल्क बात करें" / "Talk Free on WhatsApp"
    const talkBtn = page.locator('button:has-text("निःशुल्क बात करें"), button:has-text("Talk Free on WhatsApp")').first();
    await expect(talkBtn).toBeVisible();
    await talkBtn.click();

    // 3. Verify Two-Stage Modal opens with Canonical Number & Honest Calling Instructions
    const modal = page.locator('.fixed');
    await expect(modal.getByText(/\+91 9972934937/).first()).toBeVisible();
    await expect(modal.getByText(/WhatsApp Help Desk|सहायता केंद्र/i).first()).toBeVisible();
    await expect(modal.getByText(/व्हाट्सएप वॉइस कॉल कैसे करें|How to Call Free on WhatsApp/i)).toBeVisible();
    await expect(modal.getByText(/ऊपर 📞 वॉइस कॉल आइकन दबाएं|Tap the 📞 Voice Call icon/i)).toBeVisible();

    // 4. Verify boundary disclaimer is present (Free intake triage, NOT free senior consultation)
    await expect(modal.getByText(/वरिष्ठ विद्वान ज्योतिषी जी का विस्तृत व्यक्तिगत परामर्श सशुल्क|Full detailed personal astrology readings/i)).toBeVisible();

    // 5. Intercept window.open to verify canonical WhatsApp click-to-chat URL format
    const openPromise = page.evaluate(() => {
      return new Promise<string>((resolve) => {
        const originalOpen = window.open;
        window.open = (url: any) => {
          resolve(url);
          return null;
        };
      });
    });

    // Click "Open WhatsApp (+91 9972934937)"
    const openWaBtn = modal.locator('button:has-text("9972934937")');
    await openWaBtn.click();

    const targetUrl = await openPromise;
    expect(targetUrl).toContain('https://wa.me/919972934937');
    expect(targetUrl).not.toContain('+');
    expect(targetUrl).not.toContain('-');

    // 6. Verify HelpDeskIntent was stored in localStorage
    const savedIntent = await page.evaluate(() => localStorage.getItem('cosmictantra_helpdesk_intent'));
    expect(savedIntent).toBeTruthy();
    const parsed = JSON.parse(savedIntent || '{}');
    expect(parsed.source).toBe('HOME');
    expect(parsed.sessionId).toContain('hd_intent_');
  });

  test('Step 7-18: Junior Pandit Cockpit — Intake, Mandatory Verbatim Question & Server-Verified Payment', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/pandit/workspace`, { waitUntil: 'domcontentloaded' });

    // Verify Junior Pandit Help Desk Tab is active
    await expect(page.getByText('COCKPIT • CANONICAL HELP DESK: +91 9972934937')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Role: HELP_DESK_COORDINATOR')).toBeVisible();

    // Fill intake form
    await page.locator('input[placeholder*="+91 98351"]').fill('+91 98765 43210');
    await page.locator('input[placeholder="Rajesh Sharma"]').fill('Amitabh Roy');
    await page.locator('input[placeholder*="Son"]').fill('Self');
    
    // Fill Mandatory Verbatim Question
    const verbatimQuestion = 'Started an EV startup 8 months ago. Burn rate is high. Should I raise angel capital now or bootstrap until Q1 2027?';
    await page.locator('textarea[placeholder*="running a business"]').fill(verbatimQuestion);

    // Select canonical product: 15-Minute Senior Consultation (₹501)
    const productCard = page.locator('text=CONSULT_15').first();
    await productCard.click();

    // Submit Intake Form
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    await page.locator('button:has-text("Create Consultation Order")').click();

    // Verify Active Consultation Order is created with PAYMENT_PENDING
    await expect(page.getByText('PAYMENT PENDING (₹501)').first()).toBeVisible();
    await expect(page.getByText(verbatimQuestion).first()).toBeVisible();

    // Verify Assign Scholar button is disabled when payment is pending
    const assignBtn = page.locator('button:has-text("Pt. Vidyanand Shastri")').first();
    await expect(assignBtn).toBeDisabled();

    // Simulate Razorpay Server Webhook Confirmation
    const simulatePayBtn = page.locator('button:has-text("[TEST RUNNER] Simulate Razorpay Signed Webhook")');
    await simulatePayBtn.click();

    // Verify state transition to PAYMENT_VERIFIED
    await expect(page.getByText(/PAYMENT VERIFIED/i).first()).toBeVisible({ timeout: 5000 });

    // Assign Senior Scholar (Pt. Vidyanand Shastri)
    await expect(assignBtn).toBeEnabled();
    await assignBtn.click();
  });

  test('Step 19-30: Senior Scholar Paid Consultation Desk — 15:00 Timer & 4-Quadrant Notes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/pandit/workspace`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Switch to Scholar Paid Desk Tab
    await page.locator('button:has-text("2. Scholar Paid Desk")').click();
    await page.waitForTimeout(1000);

    // Verify Scholar Case Brief with Zero Repeated Intake
    await expect(page.getByText('SCHOLAR CASE BRIEF • ZERO REPEATED INTAKE')).toBeVisible();
    await expect(page.getByText('Devotee\'s Exact Question (From Help Desk Intake):')).toBeVisible();

    // Verify Consultation Timer is at 15:00
    await expect(page.getByText('15:00', { exact: true })).toBeVisible();

    // Click "Customer Connected — Start Paid Session (15:00)"
    const connectBtn = page.locator('button:has-text("Customer Connected")');
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();
    await page.waitForTimeout(1500);

    // Verify 4-Quadrant Structured Astrological Folio
    await expect(page.getByText('1. CALCULATED_ASTROLOGY (Source Planetary Truth)')).toBeVisible();
    await expect(page.getByText('2. SCHOLAR_INTERPRETATION (Vedic Guidance)')).toBeVisible();
    await expect(page.getByText('3. USER_REPORTED_FACT (Seeker Context)')).toBeVisible();
    await expect(page.getByText('4. TRADITIONAL_REMEDY (Non-Extortive Upaya)')).toBeVisible();

    // Save and conclude consultation
    const saveFolioBtn = page.locator('button:has-text("Conclude Consultation & Record Verified Folio")');
    await saveFolioBtn.click();
  });

});
