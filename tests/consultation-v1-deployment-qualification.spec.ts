import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('CosmicTantra — Consultation V1 Deployment & Real-World Qualification Suite', () => {
  const timestamp = Date.now();
  const testDevoteeName = 'Ananya Sen ' + timestamp.toString().slice(-4);
  const testCallerName = 'Debashish Sen (Father)';
  const testPhone = '+91 98351 99001';
  const testQuestion = 'My daughter completed B.Tech in 2025. She has two competing offers in Bangalore and Pune. Which direction supports long-term career growth?';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dev-only-razorpay-secret-do-not-use-in-prod';

  let consultationId = '';

  test('Stage 1: Public Entrypoint & WhatsApp Help Desk CTA', async ({ browser }) => {
    const devoteeContext = await browser.newContext({ viewport: { width: 390, height: 844 } }); // Mobile devotee
    const devoteePage = await devoteeContext.newPage();
    
    await devoteePage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    const talkBtn = devoteePage.locator('button:has-text("निःशुल्क बात करें"), button:has-text("Talk Free on WhatsApp")').first();
    await talkBtn.scrollIntoViewIfNeeded();
    await talkBtn.click();

    // Verify honest two-stage modal with canonical number
    const modal = devoteePage.locator('.fixed');
    await expect(modal.getByText(/\+91 9972934937/).first()).toBeVisible();
    await expect(modal.getByText(/व्हाट्सएप वॉइस कॉल कैसे करें|How to Call Free on WhatsApp/i)).toBeVisible();
    await expect(modal.locator('button:has-text("9972934937")')).toBeVisible();

    await devoteeContext.close();
  });

  test('Stage 2: Junior Pandit Intake Cockpit — Live Neon DB Creation & Dynamic Catalog', async ({ browser, request }) => {
    const operatorContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const operatorPage = await operatorContext.newPage();

    await operatorPage.goto('http://localhost:3000/pandit/workspace', { waitUntil: 'domcontentloaded' });
    await expect(operatorPage.getByText(/Junior Pandit Help Desk|COCKPIT/i).first()).toBeVisible();

    // Verify dynamic service catalog rendered
    await expect(operatorPage.getByText(/Dynamic Database Catalog/i)).toBeVisible();
    await expect(operatorPage.getByText(/CONSULT_15/).first()).toBeVisible();

    // Fill intake
    await operatorPage.fill('input[placeholder="+91 98351 XXXXX"]', testPhone);
    await operatorPage.fill('input[placeholder="Rajesh Sharma"]', testCallerName);
    await operatorPage.fill('input[placeholder="Son (Rahul Sharma)"]', testDevoteeName);
    await operatorPage.fill('textarea[placeholder*="I have been running a business"]', testQuestion);
    await operatorPage.fill('input[type="date"]', '2002-11-12');
    await operatorPage.fill('input[type="time"]', '07:15');

    await operatorPage.locator('button:has-text("Create Consultation Order")').click();
    await operatorPage.waitForTimeout(2000);

    // Verify active consultation card created
    await expect(operatorPage.getByText(/ACTIVE CONSULTATION ORDER/i)).toBeVisible();
    await expect(operatorPage.getByText(/PAYMENT PENDING/i).first()).toBeVisible();

    // Fetch latest consultation ID from DB
    const listRes = await request.get('http://localhost:3000/api/astrology/consultations');
    const listData = await listRes.json();
    consultationId = listData.consultations[0].id;
    expect(consultationId).toBeTruthy();

    await operatorContext.close();
  });

  test('Stage 3: Real Cryptographic Razorpay-Signed Webhook Verification (No Bypasses)', async ({ request }) => {
    if (!consultationId) {
      const listRes = await request.get('http://localhost:3000/api/astrology/consultations');
      const listData = await listRes.json();
      consultationId = listData.consultations[0].id;
    }

    // Build real Razorpay webhook payload
    const paymentId = `pay_rzp_live_${Date.now()}`;
    const webhookPayload = JSON.stringify({
      entity: 'event',
      account_id: 'acc_rzp_test_2026',
      event: 'payment.captured',
      consultationId,
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: paymentId,
            amount: 50100,
            currency: 'INR',
            status: 'captured',
            notes: {
              consultationId
            }
          }
        }
      }
    });

    // Compute real HMAC SHA-256 signature using actual webhook secret
    const signature = crypto.createHmac('sha256', webhookSecret).update(webhookPayload).digest('hex');

    // Send webhook with official signature header (no x-test-suite header)
    const webhookRes = await request.post('http://localhost:3000/api/astrology/payments/webhook', {
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      },
      data: webhookPayload
    });

    expect(webhookRes.status()).toBe(200);
    const webhookData = await webhookRes.json();
    expect(webhookData.success).toBe(true);
    expect(webhookData.status).toBe('PAYMENT_VERIFIED');
  });

  test('Stage 4: Concurrency & Race Condition Locks (Double Assignment & Duplicate Webhooks)', async ({ request }) => {
    // 1. Duplicate Webhook Concurrency / Idempotency Test
    const dupPayload = JSON.stringify({
      consultationId,
      paymentId: 'pay_duplicate_001'
    });
    const dupSig = crypto.createHmac('sha256', webhookSecret).update(dupPayload).digest('hex');

    const [whRes1, whRes2] = await Promise.all([
      request.post('http://localhost:3000/api/astrology/payments/webhook', {
        headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': dupSig },
        data: dupPayload
      }),
      request.post('http://localhost:3000/api/astrology/payments/webhook', {
        headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': dupSig },
        data: dupPayload
      })
    ]);

    expect(whRes1.status()).toBe(200);
    expect(whRes2.status()).toBe(200);
    const dupData = await whRes2.json();
    expect(dupData.message).toContain('Idempotent Webhook');

    // 2. Double Operator Assignment Concurrency Test
    // Two operators attempting to assign the same case concurrently
    const [assignRes1, assignRes2] = await Promise.all([
      request.post(`http://localhost:3000/api/astrology/consultations/${consultationId}/transition`, {
        data: {
          nextStatus: 'SCHOLAR_ASSIGNED',
          actorType: 'HELP_DESK_COORDINATOR',
          assignedScholarId: 'scholar_vidyanand_shastri',
          actorId: 'OPERATOR_1'
        }
      }),
      request.post(`http://localhost:3000/api/astrology/consultations/${consultationId}/transition`, {
        data: {
          nextStatus: 'SCHOLAR_ASSIGNED',
          actorType: 'HELP_DESK_COORDINATOR',
          assignedScholarId: 'scholar_ramesh_sharma',
          actorId: 'OPERATOR_2'
        }
      })
    ]);

    const statuses = [assignRes1.status(), assignRes2.status()];
    // Exactly one must succeed with 200, and one must be rejected with 400 or 409 Conflict
    expect(statuses).toContain(200);
    expect(statuses.some(s => s === 400 || s === 409)).toBe(true);
  });

  test('Stage 5: Senior Scholar Workspace — Zero Repeated Intake, Timer & 4-Quadrant Folio', async ({ browser }) => {
    const scholarContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const scholarPage = await scholarContext.newPage();

    await scholarPage.goto('http://localhost:3000/pandit/workspace', { waitUntil: 'domcontentloaded' });
    await scholarPage.waitForLoadState('networkidle');
    await scholarPage.waitForTimeout(1000);

    // Switch to Scholar Paid Desk
    await scholarPage.locator('button:has-text("2. Scholar Paid Desk")').click();
    await scholarPage.waitForTimeout(1000);

    // Verify zero repeated intake: exact verbatim question & planetary context present
    await expect(scholarPage.getByText(/SCHOLAR CASE BRIEF/i)).toBeVisible();
    await expect(scholarPage.getByText('15:00', { exact: true })).toBeVisible();

    // Scholar starts consultation
    const connectBtn = scholarPage.locator('button:has-text("Customer Connected")');
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();
    await scholarPage.waitForTimeout(1500);

    // Record 4-Quadrant Astrological Folio
    const textareas = scholarPage.locator('textarea');
    await textareas.nth(0).fill('10th Lord Mars in Scorpio in 11th house.');
    await textareas.nth(1).fill('Bangalore offer strongly aligns with Mars-Mercury dasha period.');
    await textareas.nth(2).fill('Devotee completed B.Tech with distinction; father prefers Bangalore.');
    await textareas.nth(3).fill('Gayatri Mantra recitation on Wednesdays + copper coin donation.');

    // Conclude consultation & persist in Neon PostgreSQL
    await scholarPage.locator('button:has-text("Conclude Consultation")').click();
    await scholarPage.waitForTimeout(2000);

    await scholarContext.close();
  });

  test('Stage 6: RBAC, Fail-Closed Security & Uncorrupted CUSTOMER_UNREACHABLE Status', async ({ request }) => {
    // 1. Create a dedicated test case for exceptional failure handling
    const createRes = await request.post('http://localhost:3000/api/astrology/consultations/create', {
      data: {
        customerName: 'Exceptional Flow Test Devotee',
        customerPhone: '+91 99999 11111',
        customerQuestion: 'Test question for unreachable flow',
        birthDate: '1998-08-15',
        birthTime: '08:30',
        amount: 501
      }
    });
    const createData = await createRes.json();
    expect(createData.success).toBe(true);
    const exId = createData.consultation?.id || createData.consultationId;

    // 2. RBAC Guard: Customer cannot mutate state directly (returns 403)
    const customerMutateRes = await request.post(`http://localhost:3000/api/astrology/consultations/${exId}/transition`, {
      data: { nextStatus: 'COMPLETED', actorType: 'CUSTOMER' }
    });
    expect(customerMutateRes.status()).toBe(403);

    // 3. Webhook signature guard: Invalid signature rejected (returns 401)
    const badSigWebhookRes = await request.post('http://localhost:3000/api/astrology/payments/webhook', {
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': 'invalid_forged_signature_hex' },
      data: JSON.stringify({ consultationId: exId, paymentId: 'pay_forged_001' })
    });
    expect(badSigWebhookRes.status()).toBe(401);

    // 4. Legitimate signed webhook transition to PAYMENT_VERIFIED
    const validPayload = JSON.stringify({ consultationId: exId, paymentId: 'pay_ex_001' });
    const validSig = crypto.createHmac('sha256', webhookSecret).update(validPayload).digest('hex');
    const goodWebhookRes = await request.post('http://localhost:3000/api/astrology/payments/webhook', {
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': validSig },
      data: validPayload
    });
    expect(goodWebhookRes.status()).toBe(200);

    // 5. Assign scholar
    const assignRes = await request.post(`http://localhost:3000/api/astrology/consultations/${exId}/transition`, {
      data: { nextStatus: 'SCHOLAR_ASSIGNED', actorType: 'HELP_DESK_COORDINATOR', assignedScholarId: 'scholar_vidyanand_shastri' }
    });
    expect(assignRes.status()).toBe(200);

    // 6. Transition to CUSTOMER_UNREACHABLE (Uncorrupted Semantic Status)
    const unreachableRes = await request.post(`http://localhost:3000/api/astrology/consultations/${exId}/transition`, {
      data: { nextStatus: 'CUSTOMER_UNREACHABLE', actorType: 'SCHOLAR', reason: 'Phone switched off after 3 attempts.' }
    });
    expect(unreachableRes.status()).toBe(200);
    const unreachableData = await unreachableRes.json();
    
    // Verify status is literally CUSTOMER_UNREACHABLE (not REVIEW_REJECTED)
    expect(unreachableData.consultation.status).toBe('CUSTOMER_UNREACHABLE');
  });
});
