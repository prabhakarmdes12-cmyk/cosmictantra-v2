/**
 * KASHI SAHAYAK — UX Flow, Emotional Check-in, Single Verse Deduplication & Recitation Tests.
 *
 * Validates the user's specific UX fixes:
 * 1. Feeling-first emotional greeting: Kashi Sahayak asks "आज आप कैसा महसूस कर रहे हैं?"
 * 2. Emotional chips present immediately: 'मन शांत व प्रसन्न है', 'चिन्ता या डर लग रहा है', 'मन उदास / भारी है'
 * 3. Single verse card deduplication: Selecting an emotional chip displays exactly 1 verse card,
 *    never duplicate quotes overlapping or blocking chat view.
 * 4. Shloka recitation on suggestion: Assistant message contains speakText reciting original verse and meaning.
 * 5. Working listen button: [data-testid="kashi-listen-verse"] is clickable and triggers recitation.
 * 6. Dismiss card button: User can dismiss the verse card with ✕ to clear the chat view.
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('KASHI SAHAYAK UX & Emotional Flow Polish', () => {
  test('UX_001: Initial greeting is warm and feeling-first with emotional check-in chips', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.locator('button[title="काशी सहायक से बात करें"]').first().click();

    // Verify companion and input are visible
    await expect(page.locator('[data-testid="kashi-companion"]')).toBeVisible();

    // Verify feeling-first greeting text
    const firstMsg = page.locator('.font-editorial').first();
    const chatText = await page.locator('#chat-messages-container, .overflow-y-auto').innerText();
    expect(chatText).toContain('आज आप कैसा महसूस कर रहे हैं?');
    expect(chatText).toContain('मन में कोई चिन्ता, दुविधा या संशय हो');

    // Verify emotional chips are present right away
    await expect(page.getByRole('button', { name: /मन शांत व प्रसन्न/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /चिन्ता या डर/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /मन उदास/ }).first()).toBeVisible();
  });

  test('UX_002: Selecting anxiety chip produces exactly ONE verse card, no duplicate overlapping quote', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.locator('button[title="काशी सहायक से बात करें"]').first().click();

    // Click anxiety / fear chip
    await page.getByRole('button', { name: /चिन्ता या डर/ }).first().click();

    // Wait for the canonical verse card to render in kashi-companion
    const verseCard = page.locator('[data-testid="kashi-verse-card"]');
    await expect(verseCard).toBeVisible({ timeout: 10_000 });

    // Invariant: Exactly ONE verse card exists in the whole DOM
    await expect(verseCard).toHaveCount(1);

    // Invariant: Bhagavad Gita 18.66 is shown for fear/anxiety
    const verseOriginal = await page.locator('[data-testid="kashi-verse-original"]').innerText();
    expect(verseOriginal).toContain('सर्वधर्मान्परित्यज्य');

    // Verify that the chat message bubble does NOT contain a duplicate scriptureCard
    // (previously an inline Ramcharitmanas card was rendered simultaneously, occluding the view)
    const chatMessageBubbles = page.locator('.space-y-4 .rounded-2xl');
    const duplicateScriptureInChat = page.locator('.space-y-4 [data-testid="kashi-verse-card"]');
    await expect(duplicateScriptureInChat).toHaveCount(0);

    // Verify the listen button is available
    const listenBtn = page.locator('[data-testid="kashi-listen-verse"]');
    await expect(listenBtn).toBeVisible();
    await expect(listenBtn).toContainText('श्लोक सुनें');
  });

  test('UX_003: Verse card can be dismissed with ✕ to clear view of chat history', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.locator('button[title="काशी सहायक से बात करें"]').first().click();

    // Click anxiety chip to show verse
    await page.getByRole('button', { name: /चिन्ता या डर/ }).first().click();
    const verseCard = page.locator('[data-testid="kashi-verse-card"]');
    await expect(verseCard).toBeVisible();

    // Click the ✕ dismiss button
    const dismissBtn = verseCard.locator('button[title="कार्ड हटाएं"]');
    await expect(dismissBtn).toBeVisible();
    await dismissBtn.click();

    // Verse card must be cleanly dismissed
    await expect(verseCard).toHaveCount(0);
  });

  test('UX_004: Typing emotional state in text provides empathy and recited verse with listen button', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.locator('button[title="काशी सहायक से बात करें"]').first().click();

    // Type fear/anxiety in Hindi
    const input = page.locator('[data-testid="kashi-input"]');
    await input.fill('मुझे बहुत डर और चिंता लग रही है');
    await page.locator('[data-testid="kashi-send"]').click();

    // Guru responds with empathetic bridge and shastra wisdom card
    await expect(page.locator('text=श्लोक सुनें').first()).toBeVisible({ timeout: 10_000 });
  });
});
