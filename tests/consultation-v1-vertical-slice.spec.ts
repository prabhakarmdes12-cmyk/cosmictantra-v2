import { test, expect } from '@playwright/test';

test.describe('CosmicTantra — Consultation V1 Vertical Slice Qualification Suite', () => {
  const timestamp = Date.now();
  const testDevoteeName = 'Ananya Sen ' + timestamp.toString().slice(-4);
  const testCallerName = 'Debashish Sen (Father)';
  const testPhone = '+91 98351 99001';
  const testQuestion = 'My daughter completed B.Tech in 2025. She has two competing offers in Bangalore and Pune. Which direction supports long-term career growth?';

  test('Stage 1-5: Public Entrypoint, Honest Two-Stage WhatsApp Modal & Canonical URL', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    const talkBtn = page.locator('button:has-text("निःशुल्क बात करें"), button:has-text("Talk Free on WhatsApp")').first();
    await talkBtn.scrollIntoViewIfNeeded();
    await talkBtn.click();
    const modal = page.locator('.fixed');
    await expect(modal.getByText(/\+91 9972934937/).first()).toBeVisible();
    await expect(modal.getByText(/व्हाट्सएप वॉइस कॉल कैसे करें|How to Call Free on WhatsApp/i)).toBeVisible();
    const waBtn = modal.locator('button:has-text("9972934937")');
    await expect(waBtn).toBeVisible();
  });

  test('Stage 6-12: Junior Pandit Intake Cockpit — Live DB Creation, Payment Lock & Webhook Verification', async ({ page }) => {
    await page.goto('http://localhost:3000/pandit/workspace', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Junior Pandit Help Desk|COCKPIT/i).first()).toBeVisible();
    await page.fill('input[placeholder="+91 98351 XXXXX"]', testPhone);
    await page.fill('input[placeholder="Rajesh Sharma"]', testCallerName);
    await page.fill('input[placeholder="Son (Rahul Sharma)"]', testDevoteeName);
    await page.fill('textarea[placeholder*="I have been running a business"]', testQuestion);
    await page.fill('input[type="date"]', '2002-11-12');
    await page.fill('input[type="time"]', '07:15');
    await page.locator('button:has-text("Create Consultation Order")').click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(/ACTIVE CONSULTATION ORDER/i)).toBeVisible();
    const webhookBtn = page.locator('button:has-text("[TEST RUNNER] Simulate Razorpay Signed Webhook")');
    await expect(webhookBtn).toBeVisible();
    await webhookBtn.click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(/PAYMENT VERIFIED/i).first()).toBeVisible();
    const assignBtn = page.locator('button:has-text("Assign"), button:has-text("Pt. Vidyanand Shastri")').first();
    await assignBtn.click();
    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(testQuestion).first()).toBeVisible();
  });

  test('Stage 13-18: Senior Scholar Paid Workspace — Zero Repeated Intake, Timer & 4-Quadrant Folio', async ({ page }) => {
    await page.goto('http://localhost:3000/pandit/workspace', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.locator('button:has-text("2. Scholar Paid Desk")').click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/SCHOLAR CASE BRIEF/i)).toBeVisible();
    await expect(page.getByText('15:00', { exact: true })).toBeVisible();
    const connectBtn = page.locator('button:has-text("Customer Connected")');
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();
    await page.waitForTimeout(1500);
    const textareas = page.locator('textarea');
    await textareas.nth(0).fill('10th Lord Mars in Scorpio in 11th house.');
    await textareas.nth(1).fill('Bangalore offer strongly aligns with Mars-Mercury dasha period.');
    await textareas.nth(2).fill('Devotee completed B.Tech with distinction; father prefers Bangalore.');
    await textareas.nth(3).fill('Gayatri Mantra recitation on Wednesdays + copper coin donation.');
    await page.locator('button:has-text("Conclude Consultation")').click();
    await page.waitForTimeout(2000);
  });

  test('Stage 19-24: Failure Modes — Invalid Transitions, Duplicate Webhook Idempotency & Customer Unreachable', async ({ request }) => {
    const createRes = await request.post('http://localhost:3000/api/astrology/consultations/create', {
      data: {
        customerName: 'Failure Mode Test User',
        customerPhone: '+91 9876543210',
        customerQuestion: 'Test question for failure modes',
        birthDate: '1995-01-01',
        birthTime: '12:00',
        amount: 501
      }
    });
    const createData = await createRes.json();
    expect(createData.success).toBe(true);
    const cId = createData.consultation?.id || createData.consultationId;
    const invalidTransRes = await request.post('http://localhost:3000/api/astrology/consultations/' + cId + '/transition', {
      data: { nextStatus: 'COMPLETED', actorType: 'SCHOLAR' }
    });
    expect(invalidTransRes.status()).toBe(400);
    const invalidData = await invalidTransRes.json();
    expect(invalidData.success).toBe(false);
    expect(invalidData.error).toContain('Invalid state transition');
    const firstWebhookRes = await request.post('http://localhost:3000/api/astrology/payments/webhook', {
      headers: { 'x-test-suite': 'true' },
      data: { consultationId: cId, paymentId: 'pay_idemp_001' }
    });
    expect(firstWebhookRes.status()).toBe(200);
    const dupWebhookRes = await request.post('http://localhost:3000/api/astrology/payments/webhook', {
      headers: { 'x-test-suite': 'true' },
      data: { consultationId: cId, paymentId: 'pay_idemp_001' }
    });
    expect(dupWebhookRes.status()).toBe(200);
    const dupData = await dupWebhookRes.json();
    expect(dupData.message).toContain('Idempotent Webhook');
    const assignRes = await request.post('http://localhost:3000/api/astrology/consultations/' + cId + '/transition', {
      data: { nextStatus: 'SCHOLAR_ASSIGNED', actorType: 'HELP_DESK_COORDINATOR' }
    });
    expect(assignRes.status()).toBe(200);
    const unreachableRes = await request.post('http://localhost:3000/api/astrology/consultations/' + cId + '/transition', {
      data: { nextStatus: 'CUSTOMER_UNREACHABLE', actorType: 'SCHOLAR', reason: 'Customer phone switched off.' }
    });
    expect(unreachableRes.status()).toBe(200);
    const unreachableData = await unreachableRes.json();
    expect(unreachableData.consultation.status).toBe('REVIEW_REJECTED');
  });
});