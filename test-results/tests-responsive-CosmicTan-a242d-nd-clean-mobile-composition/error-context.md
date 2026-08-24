# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\responsive.spec.ts >> CosmicTantra Mobile Responsiveness & Hardening Suite >> Viewport 1024px (1024_ipad_landscape): No horizontal overflow and clean mobile composition
- Location: tests\responsive.spec.ts:20:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=COSMICTANTRA').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=COSMICTANTRA').first()

```

```yaml
- main:
  - button "Choose primary video clips"
  - button "Add video clips to timeline"
  - button "Choose background music"
  - button "Choose brand logo"
  - button "चि Chiti Cut Agent":
    - text: चि
    - strong: Chiti
    - text: Cut Agent
  - button "Undo" [disabled]: ↶
  - button "Redo" [disabled]: ↷
  - button "＋ Add clip"
  - button "Export video ↗"
  - region "Video editor":
    - text: Processed on this device 1280 × 720 · Cinematic_K_ultra_realistic_v.mp4
    - button "|◀"
    - button "▶"
    - text: 00:00.000
    - slider "Video position": "0"
    - text: 00:10.005
    - button "MUTE"
    - complementary:
      - text: EDIT ● ON DEVICE
      - heading "Crop & frame" [level=2]
      - button "Original"
      - button "16:9"
      - button "9:16"
      - button "1:1"
      - button "4:5"
      - text: Selected clip zoom 1.00×
      - slider "Selected clip zoom": "1"
      - text: Zoom above 1× to drag and reposition. Horizontal
      - slider "Crop horizontal position": "50"
      - text: Vertical
      - slider "Crop vertical position": "50"
      - heading "Resize & rotate" [level=2]
      - text: Canvas
      - combobox:
        - option "Source"
        - option "1920×1080" [selected]
        - option "1080×1920"
        - option "1080×1080"
        - option "1280×720"
      - text: Rotation
      - button "0° ↻"
      - heading "Selected clip" [level=2]
      - text: Start
      - spinbutton "Start": "0"
      - text: End
      - spinbutton "End": "10.005"
      - text: Speed
      - combobox:
        - option "0.5×"
        - option "0.75×"
        - option "1×" [selected]
        - option "1.25×"
        - option "1.5×"
        - option "2×"
      - text: Clip volume 100%
      - slider "Clip volume 100%": "100"
      - text: Fade in 0.5s
      - slider "Clip fade in": "0.5"
      - text: Fade out 0.5s
      - slider "Clip fade out": "0.5"
      - heading "Title overlay" [level=2]
      - text: Text shown on the final video
      - textbox "Text shown on the final video":
        - /placeholder: Add a title or call to action
      - heading "Music" [level=2]
      - button "＋ Add music"
  - button "✂ Split"
  - button "⌫ Ripple delete"
  - button "＋ Add clip"
  - text: STITCHED TIMELINE · 00:00.000 / 00:30.015 Space play · S split · ← → frame step 00:00 00:06 00:12 00:18 00:24 00:30
  - slider "Timeline playhead": "0"
  - slider "Trim start of Cinematic_K_ultra_realistic_v.mp4"
  - button "01 · 1× Cinematic_K_ultra_realistic_v.mp4 00:00.00 — 00:10.00":
    - text: 01 · 1×
    - strong: Cinematic_K_ultra_realistic_v.mp4
    - text: 00:00.00 — 00:10.00
  - button "Move clip left": ←
  - button "Move clip right": →
  - slider "Trim end of Cinematic_K_ultra_realistic_v.mp4"
  - slider "Trim start of Cinematic_close_up_in_a_warm_.mp4"
  - button "02 · 1× Cinematic_close_up_in_a_warm_.mp4 00:00.00 — 00:10.00":
    - text: 02 · 1×
    - strong: Cinematic_close_up_in_a_warm_.mp4
    - text: 00:00.00 — 00:10.00
  - button "Move clip left": ←
  - button "Move clip right": →
  - slider "Trim end of Cinematic_close_up_in_a_warm_.mp4"
  - slider "Trim start of Cinematic_slow_motion_D_camer.mp4"
  - button "03 · 1× Cinematic_slow_motion_D_camer.mp4 00:00.00 — 00:10.00":
    - text: 03 · 1×
    - strong: Cinematic_slow_motion_D_camer.mp4
    - text: 00:00.00 — 00:10.00
  - button "Move clip left": ←
  - button "Move clip right": →
  - slider "Trim end of Cinematic_slow_motion_D_camer.mp4"
  - status:
    - text: ✦ Kashi Hero Sequence Loaded · 3 Clips Placed on Timeline · Ready for Human Verification.
    - button "×"
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
  46 |       expect(docScrollWidth).toBeLessThanOrEqual(windowInnerWidth + 1);
  47 | 
  48 |       // 2. Brand Logo / Wordmark Visibility
  49 |       const logoText = page.locator('text=COSMICTANTRA').first();
> 50 |       await expect(logoText).toBeVisible();
     |                              ^ Error: expect(locator).toBeVisible() failed
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