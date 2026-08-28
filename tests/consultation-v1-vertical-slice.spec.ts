import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('CosmicTantra — Consultation V1 Vertical Slice Qualification Suite', () => {
  let consultationId = '';
  const testPhone = '+91 98351 22334';
  const testQuestion = 'Should I pursue Civil Services examination or expand family export business in Varanasi?';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dev-only-razorpay-secret-do-not-use-in-prod';

  test('Stage 1-5: Public Entrypoint, Honest Two-Stage WhatsApp Modal & Canonical URL', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    const talkBtn = page.locator('button:has-text("निःशुल्क बात करें"), button:has-text("Talk Free on WhatsApp")').first();
    await talkBtn.scrollIntoViewIfNeeded();
    await talkBtn.click();

    const modal = page.locator('.fixed');
    await expect(modal.getByText(/\+91 9972934937/).first()).toBeVisible();
    await expect(modal.getByText(/व्हाट्सएप वॉइस कॉल कैसे करें|How to Call Free on WhatsApp/i)).toBeVisible();
    await expect(modal.locator('button:has-text("9972934937")')).toBeVisible();
  });

  test('Stage 6-12: Junior Pandit Intake Cockpit — Live DB Creation, Payment Lock & Webhook Verification', async ({ page }) => {
    await page.goto('http://localhost:3000/pandit/workspace', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Junior Pandit Help Desk/i).first()).toBeVisible();

    await page.fill('input[placeholder="+91 98351 XXXXX"]', testPhone);
    await page.fill('input[placeholder="Rajesh Sharma"]', 'Devashish Sen');
    await page.fill('input[placeholder="Son (Rahul Sharma)"]', 'Ananya Sen');
    await page.fill('textarea[placeholder*="I have been running a business"]', testQuestion);
    await page.fill('input[type="date"]', '1996-05-15');
    await page.fill('input[type="time"]', '10:30');

    await page.locator('button:has-text("Create Consultation Order")').click();
    await page.waitForTimeout(1500);

    await expect(page.getByText(/ACTIVE CONSULTATION ORDER/i)).toBeVisible();
    await expect(page.getByText(/PAYMENT PENDING/i).first()).toBeVisible();

    // Verify Assign Scholar is initially disabled (INV_PAY_001)
    const assignBtn = page.locator('button:has-text("Assign"), button:has-text("Pandit"), button:has-text("Shastri")').first();
    await expect(assignBtn).toBeDisabled();

    // Trigger verified webhook via UI
    const verifyBtn = page.locator('button:has-text("Simulate Razorpay Signed Webhook")');
    await verifyBtn.click();
    await page.waitForTimeout(2000);

    // State becomes PAYMENT_VERIFIED and Assign Scholar enables
    await expect(page.getByText(/PAYMENT VERIFIED/i).first()).toBeVisible();
    await expect(assignBtn).toBeEnabled();
    await assignBtn.click();
    await page.waitForTimeout(1500);
  });

  test('Stage 13-18: Senior Scholar Paid Workspace — Zero Repeated Intake, Timer & 4-Quadrant Folio', async ({ page }) => {
    await page.goto('http://localhost:3000/pandit/workspace', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.locator('button:has-text("2. Scholar Paid Desk")').click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(/SCHOLAR CASE BRIEF/i)).toBeVisible();
    await expect(page.getByText('15:00', { exact: true })).toBeVisible();

    const connectBtn = page.locator('button:has-text("Customer Connected")');
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();
    await page.waitForTimeout(1500);

    const textareas = page.locator('textarea');
    await textareas.nth(0).fill('Jupiter in 9th house indicates high spiritual and administrative aptitude.');
    await textareas.nth(1).fill('Civil services attempt recommended in 2027 dasha transit.');
    await textareas.nth(2).fill('Devotee expressed personal hesitation with family export trade.');
    await textareas.nth(3).fill('Saraswati Stotram recitation + Yellow Sapphire recommendation.');

    await page.locator('button:has-text("Conclude Consultation")').click();
    await page.waitForTimeout(2000);
  });

  test('Stage 19-24: Failure Modes — Invalid Transitions, Duplicate Webhook Idempotency & Customer Unreachable', async ({ request }) => {
    // 1. Create a dedicated case for testing failure modes
    const cRes = await request.post('http://localhost:3000/api/astrology/consultations/create', {
      data: {
        customerName: 'Failure Mode Devotee',
        customerPhone: '+91 98888 77777',
        customerQuestion: 'Test question for failure modes',
        birthDate: '1995-05-15',
        birthTime: '10:30',
        amount: 501
      }
    });
    const cData = await cRes.json();
    const cId = cData.consultation?.id || cData.consultationId;

    // 2. Invalid transition (cannot move from PAYMENT_PENDING directly to COMPLETED)
    const invalidRes = await request.post(`http://localhost:3000/api/astrology/consultations/${cId}/transition`, {
      data: { nextStatus: 'COMPLETED', actorType: 'SCHOLAR' }
    });
    expect(invalidRes.status()).toBe(400);

    // 3. Duplicate webhook idempotency with valid HMAC signature
    const payload = JSON.stringify({ consultationId: cId, paymentId: 'pay_idemp_001' });
    const sig = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

    const firstWebhookRes = await request.post('http://localhost:3000/api/astrology/payments/webhook', {
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': sig },
      data: payload
    });
    expect(firstWebhookRes.status()).toBe(200);

    const dupWebhookRes = await request.post('http://localhost:3000/api/astrology/payments/webhook', {
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': sig },
      data: payload
    });
    expect(dupWebhookRes.status()).toBe(200);
    const dupData = await dupWebhookRes.json();
    expect(dupData.message).toContain('Idempotent Webhook');

    // 4. Assign Scholar
    const assignRes = await request.post(`http://localhost:3000/api/astrology/consultations/${cId}/transition`, {
      data: { nextStatus: 'SCHOLAR_ASSIGNED', actorType: 'HELP_DESK_COORDINATOR' }
    });
    expect(assignRes.status()).toBe(200);

    // 5. Customer unreachable (valid transition from SCHOLAR_ASSIGNED)
    const unreachableRes = await request.post(`http://localhost:3000/api/astrology/consultations/${cId}/transition`, {
      data: { nextStatus: 'CUSTOMER_UNREACHABLE', actorType: 'SCHOLAR', reason: 'Phone unreachable after 3 attempts' }
    });
    expect(unreachableRes.status()).toBe(200);
  });
});
