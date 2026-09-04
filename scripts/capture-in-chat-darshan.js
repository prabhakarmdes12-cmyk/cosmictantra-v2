const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\prabh\\.gemini\\antigravity-ide\\brain\\0ffc49dd-9353-491e-a310-ce554feed863';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:3000/darshan', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click chatbot avatar
  const avatarBtn = page.locator('button:has(img[alt="Kashi Sahayak"])').last();
  await avatarBtn.click();
  await page.waitForTimeout(1000);

  // Find input and send "दर्शन"
  const chatInput = page.locator('textarea[placeholder*="पूछें"], input[placeholder*="पूछें"]').first();
  if (await chatInput.isVisible()) {
    await chatInput.fill('श्री काशी विश्वनाथ दर्शन');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);
  }

  const chatPic = path.join(ARTIFACT_DIR, 'darshan-in-chat-card.png');
  await page.screenshot({ path: chatPic });
  console.log('Saved in-chat darshan card screenshot:', chatPic);

  await browser.close();
})();
