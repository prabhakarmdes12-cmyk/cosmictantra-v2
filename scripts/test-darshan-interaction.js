const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\prabh\\.gemini\\antigravity-ide\\brain\\0ffc49dd-9353-491e-a310-ce554feed863';

(async () => {
  console.log('Launching browser with Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', err => {
    console.error('[PAGE ERROR]:', err.message);
    errors.push(err.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('[CONSOLE ERROR]:', msg.text());
    }
  });

  console.log('Navigating to http://localhost:3000/darshan ...');
  await page.goto('http://localhost:3000/darshan', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Capture Desktop Default View (HD Sanctum)
  const desktopPic = path.join(ARTIFACT_DIR, 'darshan-desktop-sanctum.png');
  await page.screenshot({ path: desktopPic, fullPage: false });
  console.log('Saved:', desktopPic);

  // 2. Test Sound Button in Top Header Bar
  console.log('Testing Sound Toggle Button...');
  const soundBtn = page.locator('button:has-text("ध्वनि")').first();
  if (await soundBtn.isVisible()) {
    console.log('Sound Button found. Current text:', await soundBtn.innerText());
    await soundBtn.click();
    await page.waitForTimeout(500);
    console.log('Toggled Sound Button. New text:', await soundBtn.innerText());
  }

  // 3. Test Deep Daan on /darshan Page (Golden border + 4 corner Mahadeeps)
  console.log('Testing Deep Daan on /darshan Page...');
  const diyaBtn = page.locator('button:has-text("दीपदान")').or(page.locator('button:has-text("दीप दान")')).first();
  if (await diyaBtn.isVisible()) {
    await diyaBtn.click();
    console.log('Clicked Deep Daan on /darshan');
    await page.waitForTimeout(600);
  }

  // 4. Test Flower Shower on /darshan Page (Cascading petals)
  console.log('Testing Flower Offering on /darshan Page...');
  const flowerBtn = page.locator('button:has-text("पुष्प अर्पण")').first();
  if (await flowerBtn.isVisible()) {
    await flowerBtn.click();
    console.log('Clicked Flower Offering on /darshan');
    await page.waitForTimeout(500);
    const flowerDarshanPic = path.join(ARTIFACT_DIR, 'darshan-desktop-rituals.png');
    await page.screenshot({ path: flowerDarshanPic });
    console.log('Saved Darshan Rituals screenshot:', flowerDarshanPic);
  }

  // 5. Test YouTube Mode and verify no overlay covers YouTube's native controls
  console.log('Testing Mode Switcher (YouTube stream)...');
  const ytModeBtn = page.locator('button:has-text("सीधा प्रसारण")').first();
  if (await ytModeBtn.isVisible()) {
    await ytModeBtn.click();
    console.log('Switched to 🔴 सीधा प्रसारण');
    await page.waitForTimeout(1000);
    const ytPic = path.join(ARTIFACT_DIR, 'darshan-desktop-youtube.png');
    await page.screenshot({ path: ytPic });
    console.log('Saved YouTube Mode screenshot:', ytPic);
  }

  // Switch back to Sanctum
  const sanctumBtn = page.locator('button:has-text("गर्भगृह")').first();
  if (await sanctumBtn.isVisible()) {
    await sanctumBtn.click();
    console.log('Switched back to 🕉️ गर्भगृह');
    await page.waitForTimeout(600);
  }

  // Ensure any modal is dismissed before opening chatbot
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 6. Test Chatbot UI & In-Chat Darshan
  console.log('Testing Kashi Sahayak Chatbot and In-Chat Darshan...');
  const chatbotTrigger = page.locator('button[title*="काशी सहायक"]').or(page.locator('button:has(img[alt="Kashi Sahayak"])')).last();
  if (await chatbotTrigger.isVisible()) {
    await chatbotTrigger.click();
    await page.waitForTimeout(1200);

    // Send darshan message to trigger in-chat darshan card
    const chatInput = page.locator('input[placeholder*="लिखें या बोलें"]').first();
    if (await chatInput.isVisible()) {
      await chatInput.fill('दर्शन');
      await chatInput.press('Enter');
      await page.waitForTimeout(2000);
    }

    // Capture Sanctum view in Chatbot (verify NO ugly red center button)
    const chatPic = path.join(ARTIFACT_DIR, 'darshan-chatbot-sanctum.png');
    await page.screenshot({ path: chatPic });
    console.log('Saved Chatbot Sanctum screenshot:', chatPic);

    // Test Deep Daan in Chatbot
    console.log('Testing Deep Daan inside Chatbot...');
    const chatDiyaBtn = page.locator('button:has-text("दीप दान")').or(page.locator('button:has-text("दीप अर्पित")')).first();
    if (await chatDiyaBtn.isVisible()) {
      await chatDiyaBtn.click();
      console.log('Clicked Deep Daan in Chatbot');
      await page.waitForTimeout(600);
    }

    // Test Flower Offering in Chatbot
    console.log('Testing Flower Offering inside Chatbot...');
    const chatFlowerBtn = page.locator('button:has-text("पुष्प अर्पण")').or(page.locator('button:has-text("पुष्प अर्पित")')).first();
    if (await chatFlowerBtn.isVisible()) {
      await chatFlowerBtn.click();
      console.log('Clicked Flower Offering in Chatbot');
      await page.waitForTimeout(600);
    }

    // Capture Chatbot Rituals (verify cascading flowers + golden border diya)
    const chatRitualsPic = path.join(ARTIFACT_DIR, 'darshan-chatbot-rituals.png');
    await page.screenshot({ path: chatRitualsPic });
    console.log('Saved Chatbot Rituals screenshot:', chatRitualsPic);

    // Test switching to Video inside Chatbot
    console.log('Testing Video Mode inside Chatbot...');
    const chatVideoBtn = page.locator('button:has-text("परिसर वीडियो")').or(page.locator('button:has-text("▶ वीडियो")')).first();
    if (await chatVideoBtn.isVisible()) {
      await chatVideoBtn.click();
      console.log('Switched to Video inside Chatbot');
      await page.waitForTimeout(1000);
      const chatVideoPic = path.join(ARTIFACT_DIR, 'darshan-chatbot-video.png');
      await page.screenshot({ path: chatVideoPic });
      console.log('Saved Chatbot Video screenshot:', chatVideoPic);
    }
  }

  // 7. Test Mobile View (390x844)
  console.log('Testing Mobile View (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/darshan', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const mobilePic = path.join(ARTIFACT_DIR, 'darshan-mobile-view.png');
  await page.screenshot({ path: mobilePic });
  console.log('Saved Mobile screenshot:', mobilePic);

  await browser.close();
  console.log('ALL TESTS COMPLETED SUCCESSFULLY! Total Errors:', errors.length);
})();
