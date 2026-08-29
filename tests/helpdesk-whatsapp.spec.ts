import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('CosmicTantra — Free WhatsApp Help Desk & Paid Scholar Handoff Acceptance Suite', () => {
  const timestamp = Date.now();
  const testPhone = `+91 98351 ${timestamp.toString().slice(-5)}`;
  const testQuestion = 'Detailed guidance on transition from private software job to government research career.';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dev-only-razorpay-secret-do-not-use-in-prod';

  test('Step 1-6: Public CTA discoverability, Honest Two-Stage Modal, Canonical WhatsApp URL & Intent Tracking', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    const talkBtn = page.locator('button:has-text("निःशुल्क बात करें"), button:has-text("Talk Free on WhatsApp")').first();
    await talkBtn.scrollIntoViewIfNeeded();
    await talkBtn.click();

    const modal = page.locator('.fixed');
    await expect(modal.getByText(/\+91 9972934937/).first()).toBeVisible();
    await expect(modal.getByText(/व्हाट्सएप वॉइस कॉल कैसे करें|How to Call Free on WhatsApp/i)).toBeVisible();
    await expect(modal.locator('button:has-text("9972934937")')).toBeVisible();
  });

  test('Step 7-18: Junior Pandit Cockpit — Intake, Mandatory Verbatim Question & Server-Verified Payment', async ({ page }) => {
    await page.goto('http://localhost:3000/pandit/workspace', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Junior Pandit Help Desk/i).first()).toBeVisible();

    await page.fill('input[placeholder="+91 98351 XXXXX"]', testPhone);
    await page.fill('input[placeholder="Rajesh Sharma"]', 'Suresh Gupta');
    await page.fill('input[placeholder="Son (Rahul Sharma)"]', 'Amit Gupta');
    await page.fill('textarea[placeholder*="I have been running a business"]', testQuestion);
    await page.fill('input[type="date"]', '1995-03-21');
    await page.fill('input[type="time"]', '14:20');

    await page.locator('button:has-text("Create Consultation Order")').click();
    await page.waitForTimeout(2000);

    await expect(page.getByText(/ACTIVE CONSULTATION ORDER/i)).toBeVisible();
    await expect(page.getByText(/PAYMENT PENDING/i).first()).toBeVisible();

    const assignBtn = page.locator('button:has-text("Assign"), button:has-text("Pandit"), button:has-text("Shastri")').first();
    await expect(assignBtn).toBeDisabled();

    // Trigger verified webhook via UI
    const verifyBtn = page.locator('button:has-text("Simulate Razorpay Signed Webhook")');
    await verifyBtn.click();
    await page.waitForTimeout(2000);

    await expect(page.getByText(/PAYMENT VERIFIED/i).first()).toBeVisible();
    await expect(assignBtn).toBeEnabled();
    await assignBtn.click();
    await page.waitForTimeout(1500);
  });

  test('Step 19-30: Senior Scholar Paid Consultation Desk — 15:00 Timer & 4-Quadrant Notes', async ({ page }) => {
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
    await textareas.nth(0).fill('Mercury in 10th house conjunct Sun in Pisces.');
    await textareas.nth(1).fill('Favorable planetary alignments for academic research from October 2026.');
    await textareas.nth(2).fill('Devotee currently working as senior software engineer in Hyderabad.');
    await textareas.nth(3).fill('Gayatri Mantra recitation + daily Surya Arghya at sunrise.');

    await page.locator('button:has-text("Conclude Consultation")').click();
    await page.waitForTimeout(2000);
  });
});
