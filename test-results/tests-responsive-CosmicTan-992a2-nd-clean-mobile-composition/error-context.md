# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\responsive.spec.ts >> CosmicTantra Mobile Responsiveness & Hardening Suite >> Viewport 360px (360_android): No horizontal overflow and clean mobile composition
- Location: tests\responsive.spec.ts:20:9

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Expected: <= 361
Received:    372
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
      - generic:
        - strong: Chiti
        - text: Cut Agent
    - button "Export video ↗" [ref=e11] [cursor=pointer]
  - region "Video editor" [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: Processed on this device
        - generic [ref=e17]: 1280 × 720 · Cinematic_K_ultra_realistic_v.mp4
      - generic [ref=e21]:
        - button "|◀" [ref=e22] [cursor=pointer]
        - button "▶" [ref=e23] [cursor=pointer]
        - generic [ref=e24]: 00:00.000
        - slider "Video position" [ref=e25] [cursor=pointer]: "0"
        - button "MUTE" [ref=e26] [cursor=pointer]
    - complementary [ref=e27]:
      - generic [ref=e28]:
        - generic [ref=e29]: EDIT
        - generic [ref=e30]: ● ON DEVICE
      - generic [ref=e31]:
        - heading "Crop & frame" [level=2] [ref=e32]
        - generic [ref=e33]:
          - button "Original" [ref=e34]
          - button "16:9" [ref=e35]
          - button "9:16" [ref=e36]
          - button "1:1" [ref=e37]
          - button "4:5" [ref=e38]
        - generic [ref=e39]:
          - generic [ref=e40]:
            - text: Selected clip zoom
            - generic [ref=e41]: 1.00×
          - slider "Selected clip zoom" [ref=e42]: "1"
        - generic [ref=e43]: Zoom above 1× to drag and reposition.
        - generic [ref=e44]:
          - generic [ref=e45]:
            - text: Horizontal
            - slider "Crop horizontal position" [ref=e46]: "50"
          - generic [ref=e47]:
            - text: Vertical
            - slider "Crop vertical position" [ref=e48]: "50"
      - generic [ref=e49]:
        - heading "Resize & rotate" [level=2] [ref=e50]
        - generic [ref=e51]:
          - generic [ref=e52]: Canvas
          - combobox [ref=e53]:
            - option "Source"
            - option "1920×1080" [selected]
            - option "1080×1920"
            - option "1080×1080"
            - option "1280×720"
        - generic [ref=e54]:
          - generic [ref=e55]: Rotation
          - button "0° ↻" [ref=e56]
      - generic [ref=e57]:
        - heading "Selected clip" [level=2] [ref=e58]
        - generic [ref=e59]:
          - generic [ref=e60]:
            - text: Start
            - spinbutton "Start" [ref=e61]: "0"
          - generic [ref=e62]:
            - text: End
            - spinbutton "End" [ref=e63]: "10.005"
        - generic [ref=e64]:
          - generic [ref=e65]: Speed
          - combobox [ref=e66]:
            - option "0.5×"
            - option "0.75×"
            - option "1×" [selected]
            - option "1.25×"
            - option "1.5×"
            - option "2×"
        - generic [ref=e67]:
          - generic [ref=e68]:
            - text: Clip volume
            - generic [ref=e69]: 100%
          - slider "Clip volume 100%" [ref=e70]: "100"
        - generic [ref=e71]:
          - generic [ref=e72]:
            - text: Fade in
            - generic [ref=e73]: 0.5s
            - slider "Clip fade in" [ref=e74]: "0.5"
          - generic [ref=e75]:
            - text: Fade out
            - generic [ref=e76]: 0.5s
            - slider "Clip fade out" [ref=e77]: "0.5"
      - generic [ref=e78]:
        - heading "Title overlay" [level=2] [ref=e79]
        - generic [ref=e80]:
          - generic [ref=e81]: Text shown on the final video
          - textbox "Text shown on the final video" [ref=e82]:
            - /placeholder: Add a title or call to action
      - generic [ref=e83]:
        - heading "Music" [level=2] [ref=e84]
        - button "＋ Add music" [ref=e85] [cursor=pointer]
  - generic [ref=e86]:
    - generic [ref=e87]:
      - generic [ref=e88]:
        - button "✂ Split" [ref=e89]
        - button "⌫ Ripple delete" [ref=e90]
        - button "＋ Add clip" [ref=e91]
      - generic [ref=e92]: STITCHED TIMELINE · 00:00.000 / 00:30.015
      - generic [ref=e93]: Space play · S split · ← → frame step
    - generic [ref=e94]:
      - generic [ref=e95]: 00:00
      - generic [ref=e96]: 00:06
      - generic [ref=e97]: 00:12
      - generic [ref=e98]: 00:18
      - generic [ref=e99]: 00:24
      - generic [ref=e100]: 00:30
    - generic [ref=e101]:
      - slider "Timeline playhead" [ref=e102]: "0"
      - generic [ref=e105]:
        - generic [ref=e106]:
          - slider "Trim start of Cinematic_K_ultra_realistic_v.mp4" [ref=e107]
          - button "01 · 1× Cinematic_K_ultra_realistic_v.mp4 00:00.00 — 00:10.00" [ref=e108] [cursor=pointer]:
            - generic [ref=e109]: 01 · 1×
            - strong [ref=e110]: Cinematic_K_ultra_realistic_v.mp4
            - generic [ref=e111]: 00:00.00 — 00:10.00
          - generic [ref=e112]:
            - button "Move clip left" [ref=e113] [cursor=pointer]: ←
            - button "Move clip right" [ref=e114] [cursor=pointer]: →
          - slider "Trim end of Cinematic_K_ultra_realistic_v.mp4" [ref=e115]
        - generic [ref=e116]:
          - slider "Trim start of Cinematic_close_up_in_a_warm_.mp4" [ref=e117]
          - button "02 · 1× Cinematic_close_up_in_a_warm_.mp4 00:00.00 — 00:10.00" [ref=e118] [cursor=pointer]:
            - generic [ref=e119]: 02 · 1×
            - strong [ref=e120]: Cinematic_close_up_in_a_warm_.mp4
            - generic [ref=e121]: 00:00.00 — 00:10.00
          - generic [ref=e122]:
            - button "Move clip left" [ref=e123] [cursor=pointer]: ←
            - button "Move clip right" [ref=e124] [cursor=pointer]: →
          - slider "Trim end of Cinematic_close_up_in_a_warm_.mp4" [ref=e125]
        - generic [ref=e126]:
          - slider "Trim start of Cinematic_slow_motion_D_camer.mp4" [ref=e127]
          - button "03 · 1× Cinematic_slow_motion_D_camer.mp4 00:00.00 — 00:10.00" [ref=e128] [cursor=pointer]:
            - generic [ref=e129]: 03 · 1×
            - strong [ref=e130]: Cinematic_slow_motion_D_camer.mp4
            - generic [ref=e131]: 00:00.00 — 00:10.00
          - generic [ref=e132]:
            - button "Move clip left" [ref=e133] [cursor=pointer]: ←
            - button "Move clip right" [ref=e134] [cursor=pointer]: →
          - slider "Trim end of Cinematic_slow_motion_D_camer.mp4" [ref=e135]
  - status [ref=e136]:
    - generic [ref=e137]: ✦ Kashi Hero Sequence Loaded · 3 Clips Placed on Timeline · Ready for Human Verification.
    - button "×" [ref=e138] [cursor=pointer]
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
  22 |       await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
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
> 46 |       expect(docScrollWidth).toBeLessThanOrEqual(windowInnerWidth + 1);
     |                              ^ Error: expect(received).toBeLessThanOrEqual(expected)
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