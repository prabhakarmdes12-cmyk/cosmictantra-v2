import { test, expect } from '@playwright/test';

test('consultation mood intake prioritizes crisis support', async ({ page }) => {
  await page.goto('/ask');
  await page.getByRole('button', { name: /AI गुरु वार्तालाप प्रारम्भ करें/ }).click();
  const input = page.getByPlaceholder(/अपनी भावना लिखें|Describe how you feel/);
  await input.fill('जान दे दूँगी');
  await input.press('Enter');
  await expect(page.getByText(/14416/).first()).toBeVisible();
  await expect(page.getByText(/Let us begin — please share|चलिए शुरुआत करते हैं — कृपया/)).toHaveCount(0);
});

test('new avatar, feminine greeting and crisis routing work in the floating chat', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Kashi Sahayak Avatar' }).click();
  await expect(page.getByText(/आपकी वैदिक सहायिका/).first()).toBeVisible();
  const avatar = page.getByAltText('Kashi Sahayak').first();
  await expect(avatar).toHaveAttribute('src', /kashi_sahayak_apsara\.jpg/);
  const input = page.getByPlaceholder(/मन की बात या प्रश्न लिखें/);
  await input.fill('I want to kill myself');
  await input.press('Enter');
  await expect(page.getByText(/14416/).first()).toBeVisible();
  await expect(page.getByText(/कृपया अपना पूरा शुभ नाम/)).toHaveCount(0);
});

test('birth-time chip advances without prematurely saving a profile', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Kashi Sahayak Avatar' }).click();
  await page.getByRole('button', { name: /सीधे विषय पर चलें/ }).click();
  await page.getByRole('button', { name: /मेरी कुण्डली व दशा/ }).click();
  await page.getByRole('button', { name: /करियर, व्यापार व धन लाभ/ }).click();
  const input = page.getByPlaceholder(/मन की बात या प्रश्न लिखें/);
  await expect(page.getByText(/कृपया अपना पूरा शुभ नाम/).first()).toBeVisible();
  await input.fill('Test Seeker');
  await input.press('Enter');
  await page.getByRole('button', { name: '1995-06-15', exact: true }).click();
  await page.getByRole('button', { name: '06:00 (प्रातः)', exact: true }).click();
  await expect(page.getByText(/अब आपका जन्म स्थान बताइए/).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('cosmictantra_profiles_v1'))).toBeNull();
  await page.getByRole('button', { name: 'Bilaspur (CG)', exact: true }).click();
  await expect(page.getByText(/जन्म स्थान Bilaspur, Chhattisgarh दर्ज हो गया/).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('cosmictantra_profiles_v1'))).toBeNull();
});
