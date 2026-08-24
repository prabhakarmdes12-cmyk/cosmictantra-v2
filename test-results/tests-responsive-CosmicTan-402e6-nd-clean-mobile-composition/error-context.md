# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\responsive.spec.ts >> CosmicTantra Mobile Responsiveness & Hardening Suite >> Viewport 1440px (1440_desktop): No horizontal overflow and clean mobile composition
- Location: tests\responsive.spec.ts:20:9

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/", waiting until "networkidle"

```

# Page snapshot

```yaml
- main [ref=e2]:
  - button "Choose primary video clips" [ref=e3]
  - button "Add video clips to timeline" [ref=e4]
  - button "Choose background music" [ref=e5]
  - button "Choose brand logo" [ref=e6]
  - generic [ref=e7]:
    - button "चि Chiti Cut Agent" [ref=e8] [cursor=pointer]:
      - generic [ref=e9]: चि
      - generic [ref=e10]:
        - strong [ref=e11]: Chiti
        - text: Cut Agent
    - generic [ref=e12]:
      - textbox "Project name" [ref=e13]: CosmicTantra · Kashi Hero Video Sequence
      - generic [ref=e14]: 3 clips · edits saved locally
    - generic [ref=e16]:
      - button "Undo" [disabled] [ref=e17]: ↶
      - button "Redo" [disabled] [ref=e18]: ↷
      - button "✦ Finish with Agent" [ref=e19] [cursor=pointer]
      - button "＋ Add clip" [ref=e20] [cursor=pointer]
      - button "Export video ↗" [ref=e21] [cursor=pointer]
  - region "Video editor" [ref=e22]:
    - generic [ref=e23]:
      - generic [ref=e24]:
        - generic [ref=e25]: Processed on this device
        - generic [ref=e27]: 1280 × 720 · Cinematic_K_ultra_realistic_v.mp4
      - generic [ref=e31]:
        - button "|◀" [ref=e32] [cursor=pointer]
        - button "▶" [ref=e33] [cursor=pointer]
        - generic [ref=e34]: 00:00.000
        - slider "Video position" [ref=e35] [cursor=pointer]: "0"
        - generic [ref=e36]: 00:10.005
        - button "MUTE" [ref=e37] [cursor=pointer]
    - complementary [ref=e38]:
      - generic [ref=e39]:
        - generic [ref=e40]: EDIT
        - generic [ref=e41]: ● ON DEVICE
      - generic [ref=e42]:
        - heading "Crop & frame" [level=2] [ref=e43]
        - generic [ref=e44]:
          - button "Original" [ref=e45]
          - button "16:9" [ref=e46]
          - button "9:16" [ref=e47]
          - button "1:1" [ref=e48]
          - button "4:5" [ref=e49]
        - generic [ref=e50]:
          - generic [ref=e51]:
            - text: Selected clip zoom
            - generic [ref=e52]: 1.00×
          - slider "Selected clip zoom" [ref=e53]: "1"
        - generic [ref=e54]: Zoom above 1× to drag and reposition.
        - generic [ref=e55]:
          - generic [ref=e56]:
            - text: Horizontal
            - slider "Crop horizontal position" [ref=e57]: "50"
          - generic [ref=e58]:
            - text: Vertical
            - slider "Crop vertical position" [ref=e59]: "50"
      - generic [ref=e60]:
        - heading "Resize & rotate" [level=2] [ref=e61]
        - generic [ref=e62]:
          - generic [ref=e63]: Canvas
          - combobox [ref=e64]:
            - option "Source"
            - option "1920×1080" [selected]
            - option "1080×1920"
            - option "1080×1080"
            - option "1280×720"
        - generic [ref=e65]:
          - generic [ref=e66]: Rotation
          - button "0° ↻" [ref=e67]
      - generic [ref=e68]:
        - heading "Selected clip" [level=2] [ref=e69]
        - generic [ref=e70]:
          - generic [ref=e71]:
            - text: Start
            - spinbutton "Start" [ref=e72]: "0"
          - generic [ref=e73]:
            - text: End
            - spinbutton "End" [ref=e74]: "10.005"
        - generic [ref=e75]:
          - generic [ref=e76]: Speed
          - combobox [ref=e77]:
            - option "0.5×"
            - option "0.75×"
            - option "1×" [selected]
            - option "1.25×"
            - option "1.5×"
            - option "2×"
        - generic [ref=e78]:
          - generic [ref=e79]:
            - text: Clip volume
            - generic [ref=e80]: 100%
          - slider "Clip volume 100%" [ref=e81]: "100"
        - generic [ref=e82]:
          - generic [ref=e83]:
            - text: Fade in
            - generic [ref=e84]: 0.5s
            - slider "Clip fade in" [ref=e85]: "0.5"
          - generic [ref=e86]:
            - text: Fade out
            - generic [ref=e87]: 0.5s
            - slider "Clip fade out" [ref=e88]: "0.5"
      - generic [ref=e89]:
        - heading "Title overlay" [level=2] [ref=e90]
        - generic [ref=e91]:
          - generic [ref=e92]: Text shown on the final video
          - textbox "Text shown on the final video" [ref=e93]:
            - /placeholder: Add a title or call to action
      - generic [ref=e94]:
        - heading "Music" [level=2] [ref=e95]
        - button "＋ Add music" [ref=e96] [cursor=pointer]
  - generic [ref=e97]:
    - generic [ref=e98]:
      - generic [ref=e99]:
        - button "✂ Split" [ref=e100]
        - button "⌫ Ripple delete" [ref=e101]
        - button "＋ Add clip" [ref=e102]
      - generic [ref=e103]: STITCHED TIMELINE · 00:00.000 / 00:30.015
      - generic [ref=e104]: Space play · S split · ← → frame step
    - generic [ref=e105]:
      - generic [ref=e106]: 00:00
      - generic [ref=e107]: 00:06
      - generic [ref=e108]: 00:12
      - generic [ref=e109]: 00:18
      - generic [ref=e110]: 00:24
      - generic [ref=e111]: 00:30
    - generic [ref=e112]:
      - slider "Timeline playhead" [ref=e113]: "0"
      - generic [ref=e116]:
        - generic [ref=e117]:
          - slider "Trim start of Cinematic_K_ultra_realistic_v.mp4" [ref=e118]
          - button "01 · 1× Cinematic_K_ultra_realistic_v.mp4 00:00.00 — 00:10.00" [ref=e119] [cursor=pointer]:
            - generic [ref=e120]: 01 · 1×
            - strong [ref=e121]: Cinematic_K_ultra_realistic_v.mp4
            - generic [ref=e122]: 00:00.00 — 00:10.00
          - generic [ref=e123]:
            - button "Move clip left" [ref=e124] [cursor=pointer]: ←
            - button "Move clip right" [ref=e125] [cursor=pointer]: →
          - slider "Trim end of Cinematic_K_ultra_realistic_v.mp4" [ref=e126]
        - generic [ref=e127]:
          - slider "Trim start of Cinematic_close_up_in_a_warm_.mp4" [ref=e128]
          - button "02 · 1× Cinematic_close_up_in_a_warm_.mp4 00:00.00 — 00:10.00" [ref=e129] [cursor=pointer]:
            - generic [ref=e130]: 02 · 1×
            - strong [ref=e131]: Cinematic_close_up_in_a_warm_.mp4
            - generic [ref=e132]: 00:00.00 — 00:10.00
          - generic [ref=e133]:
            - button "Move clip left" [ref=e134] [cursor=pointer]: ←
            - button "Move clip right" [ref=e135] [cursor=pointer]: →
          - slider "Trim end of Cinematic_close_up_in_a_warm_.mp4" [ref=e136]
        - generic [ref=e137]:
          - slider "Trim start of Cinematic_slow_motion_D_camer.mp4" [ref=e138]
          - button "03 · 1× Cinematic_slow_motion_D_camer.mp4 00:00.00 — 00:10.00" [ref=e139] [cursor=pointer]:
            - generic [ref=e140]: 03 · 1×
            - strong [ref=e141]: Cinematic_slow_motion_D_camer.mp4
            - generic [ref=e142]: 00:00.00 — 00:10.00
          - generic [ref=e143]:
            - button "Move clip left" [ref=e144] [cursor=pointer]: ←
            - button "Move clip right" [ref=e145] [cursor=pointer]: →
          - slider "Trim end of Cinematic_slow_motion_D_camer.mp4" [ref=e146]
  - status [ref=e147]:
    - generic [ref=e148]: ✦ Kashi Hero Sequence Loaded · 3 Clips Placed on Timeline · Ready for Human Verification.
    - button "×" [ref=e149] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import fs from 'fs';
  3  | import path from 'path';
  4  | 
  5  | const VIEWPORTS = [
  6  |   { name: '320_small_phone', width: 320, height: 680 },
  7  |   { name: '360_android', width: 360, height: 740 },
  8  |   { name: '375_iphone_se', width: 375, height: 667 },
  9  |   { name: '390_iphone_13_14', width: 390, height: 844 },
  10 |   { name: '412_pixel_samsung', width: 412, height: 915 },
  11 |   { name: '430_iphone_pro_max', width: 430, height: 932 },
  12 |   { name: '768_ipad_portrait', width: 768, height: 1024 },
  13 |   { name: '1024_ipad_landscape', width: 1024, height: 768 },
  14 |   { name: '1440_desktop', width: 1440, height: 900 }
  15 | ];
  16 | 
  17 | test.describe('CosmicTantra Mobile Responsiveness & Hardening Suite', () => {
  18 | 
  19 |   VIEWPORTS.forEach(({ name, width, height }) => {
  20 |     test(`Viewport ${width}px (${name}): No horizontal overflow and clean mobile composition`, async ({ page }) => {
  21 |       await page.setViewportSize({ width, height });
> 22 |       await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
     |                  ^ Error: page.goto: Test timeout of 30000ms exceeded.
  23 | 
  24 |       // Scroll through page to trigger all rendered sections
  25 |       await page.evaluate(async () => {
  26 |         await new Promise((resolve) => {
  27 |           let totalHeight = 0;
  28 |           const distance = 350;
  29 |           const timer = setInterval(() => {
  30 |             const scrollHeight = document.body.scrollHeight;
  31 |             window.scrollBy(0, distance);
  32 |             totalHeight += distance;
  33 |             if (totalHeight >= scrollHeight) {
  34 |               clearInterval(timer);
  35 |               window.scrollTo(0, 0);
  36 |               resolve(true);
  37 |             }
  38 |           }, 40);
  39 |         });
  40 |       });
  41 | 
  42 |       // 1. Global Responsive Invariant Assert: document.documentElement.scrollWidth <= window.innerWidth + 1
  43 |       const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  44 |       const windowInnerWidth = await page.evaluate(() => window.innerWidth);
  45 |       
  46 |       expect(docScrollWidth).toBeLessThanOrEqual(windowInnerWidth + 1);
  47 | 
  48 |       // 2. Brand Logo / Wordmark Visibility
  49 |       const logoText = page.locator('text=COSMICTANTRA').first();
  50 |       await expect(logoText).toBeVisible();
  51 |       
  52 |       const logoRect = await logoText.boundingBox();
  53 |       if (logoRect) {
  54 |         expect(logoRect.x).toBeGreaterThanOrEqual(0);
  55 |         expect(logoRect.x + logoRect.width).toBeLessThanOrEqual(width + 2);
  56 |       }
  57 | 
  58 |       // 3. Hero Video Background Visibility
  59 |       const videoBg = page.locator('video');
  60 |       await expect(videoBg).toBeVisible();
  61 | 
  62 |       // 4. Hero Headline & CTAs Reachable
  63 |       const createKundaliBtn = page.locator('button:has-text("CREATE MY KUNDALI")').first();
  64 |       const panchangBtn = page.locator('button:has-text("SEE TODAY\'S PANCHANG")').first();
  65 |       const askScholarBtn = page.locator('button:has-text("ASK A SCHOLAR")').first();
  66 | 
  67 |       await expect(createKundaliBtn).toBeVisible();
  68 |       await expect(panchangBtn).toBeVisible();
  69 |       await expect(askScholarBtn).toBeVisible();
  70 | 
  71 |       // Take screenshot for visual regression verification
  72 |       const screenshotDir = path.join(process.cwd(), 'scratch', 'screenshots');
  73 |       if (!fs.existsSync(screenshotDir)) {
  74 |         fs.mkdirSync(screenshotDir, { recursive: true });
  75 |       }
  76 |       await page.screenshot({ path: path.join(screenshotDir, `viewport_${width}px_${name}.png`), fullPage: false });
  77 |     });
  78 |   });
  79 | 
  80 |   test('Mobile Drawer opens and navigates cleanly at 320px', async ({ page }) => {
  81 |     await page.setViewportSize({ width: 320, height: 680 });
  82 |     await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  83 | 
  84 |     const menuToggleBtn = page.locator('button[aria-label="Open navigation menu"]');
  85 |     await expect(menuToggleBtn).toBeVisible();
  86 |     await menuToggleBtn.click();
  87 | 
  88 |     // Verify Mobile Drawer content
  89 |     const todayNavBtn = page.locator('button:has-text("TODAY\'S PANCHANG")').first();
  90 |     await expect(todayNavBtn).toBeVisible();
  91 |   });
  92 | });
  93 | 
```