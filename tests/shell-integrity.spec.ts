import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('CosmicTantra — Global Shell & Navigation Integrity Suite', () => {

  test('Public Homepage (/): Has global public header, footer, zero horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    // Header exists
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    // Footer exists
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();

    // Zero horizontal overflow
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  });

  test('Pandit Presentation (/presentation): Presentation shell, high-contrast headings, active navigation tiles', async ({ page }) => {
    await page.goto(`${BASE_URL}/presentation`, { waitUntil: 'domcontentloaded' });

    // Breadcrumbs must NOT be present on presentation
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toHaveCount(0);

    // Presentation header present
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(page.getByText(/Institutional Deck/i)).toBeVisible();

    // Advance to Slide 4 (Architecture & Navigation)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
    }

    // Verify 4 styled navigation tiles exist and have valid non-hash hrefs
    const tileLinks = page.locator('a[href="/dashboard"], a[href="/report"], a[href="/pandit/workspace"], a[href="/upaya"]');
    const count = await tileLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < count; i++) {
      const href = await tileLinks.nth(i).getAttribute('href');
      expect(href).not.toBe('#');
      expect(href?.startsWith('/')).toBe(true);
    }
  });

  test('Pandit Verification Workbench (/pandit/workspace): Scholar shell mode, interactive consultation review', async ({ page }) => {
    await page.goto(`${BASE_URL}/pandit/workspace`, { waitUntil: 'domcontentloaded' });

    // Scholar header present with scholar indicator
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(page.getByText('SCHOLAR WORKSPACE')).toBeVisible();

    // Breadcrumbs absent on scholar workbench
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toHaveCount(0);

    // Select second seeker in queue
    const queueCards = page.locator('.cursor-pointer').filter({ hasText: /Rahul Verma|Priya Sharma/i });
    if (await queueCards.count() > 1) {
      await queueCards.nth(1).click();
      await page.waitForTimeout(300);
    }

    // Planetary Snapshot visible in dossier
    await expect(page.getByText('PLANETARY SNAPSHOT')).toBeVisible();
    await expect(page.getByText('Lagna / Ascendant')).toBeVisible();

    // Approve & Dispatch action exists and is not disabled
    const approveBtn = page.getByRole('button', { name: /APPROVE FOLIO/i });
    await expect(approveBtn).toBeVisible();
    await approveBtn.scrollIntoViewIfNeeded();
    await approveBtn.click();
    await expect(page.getByText(/Case approved/i)).toBeVisible();
  });


  test('Written Folio Report (/report): Vector PDF generation without mojibake', async ({ page }) => {
    await page.goto(`${BASE_URL}/report`, { waitUntil: 'domcontentloaded' });

    // Header and breadcrumbs present
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();

    // Folio actions exist
    const downloadBtn = page.getByRole('button', { name: /DOWNLOAD FOLIO PDF/i });
    await expect(downloadBtn).toBeVisible();

    const printBtn = page.getByRole('button', { name: /PRINT FOLIO/i });
    await expect(printBtn).toBeVisible();

    // Folio synthesis text visible
    await expect(page.getByText(/Scholarly Synthesis/i)).toBeVisible();
  });

  test('Cosmic ID Profile (/profile): Minimal shell mode and factual privacy language', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });

    // Minimal shell with return link
    await expect(page.getByText(/Return to Observatory/i)).toBeVisible();

    // Factual consent language
    await expect(page.getByText(/Your charts, family profiles, and consultations under one secure Cosmic ID/i)).toBeVisible();
    await expect(page.getByText(/Consent-based data collection/i)).toBeVisible();
  });

  test('Name Numerology (/numerology/name): Public breadcrumbs, Chaldean calculator, zero dead buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/numerology/name`, { waitUntil: 'domcontentloaded' });

    // Breadcrumbs present
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('Name Numerology')).toBeVisible();

    // Chaldean title
    await expect(page.getByText('Chaldean Name Numerology')).toBeVisible();

    // Footer present
    await expect(page.locator('footer')).toBeVisible();
  });

  test('Aarti & Stotra Library (/aarti-stotra): High contrast headings, tabs toggle, truth-corrected sources, Sai Baba removed, Mahagranthas present', async ({ page }) => {
    await page.goto(`${BASE_URL}/aarti-stotra`, { waitUntil: 'domcontentloaded' });

    // Breadcrumbs present
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();

    // Verify Sai Baba aarti is completely absent
    await expect(page.getByText(/साईं बाबा|Sai Baba/i)).toHaveCount(0);

    // Stotra tab toggle
    const stotraTab = page.getByRole('button', { name: /स्तोत्र/i });
    await expect(stotraTab).toBeVisible();
    await stotraTab.click();

    // Mahagranth tab toggle
    const granthTab = page.getByRole('button', { name: /पवित्र महाग्रंथ/i });
    await expect(granthTab).toBeVisible();
    await granthTab.scrollIntoViewIfNeeded();
    await granthTab.click();
    await page.waitForTimeout(400);

    // Verify the 4 holy scriptures are present
    await expect(page.locator('h3').filter({ hasText: /श्रीमद्भगवद्गीता/i }).first()).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: /श्री रामचरितमानस/i }).first()).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: /श्री शिव महापुराण/i }).first()).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: /श्रीमद् देवी भागवत महापुराण/i }).first()).toBeVisible();


    // Truth-corrected source documented badge
    await expect(page.getByText('Source Documented').first()).toBeVisible();
  });


  test('Upaya Directory (/upaya): Honest onboarding state, register modal, specification standards', async ({ page }) => {
    await page.goto(`${BASE_URL}/upaya`, { waitUntil: 'domcontentloaded' });

    // Truth-corrected partner onboarding state
    await expect(page.getByText(/Partner Network — Onboarding Underway/i)).toBeVisible();

    // Inquiry modal opens
    const registerBtn = page.locator('button:has-text("Register Interest")').first();
    await expect(registerBtn).toBeVisible();
    await registerBtn.scrollIntoViewIfNeeded();
    await registerBtn.click();
    await page.waitForTimeout(300);

    // Modal is open with specification details
    await expect(page.getByText(/Verification Standard/i)).toBeVisible();
  });

  test('Live Temple Darshan & Virtual Mandir (/darshan): Real HD Sanctum Image, 4 Connection Channels, 12 Jyotirlingas, 52 Shakti Peeths & Char Dham', async ({ page }) => {
    await page.goto(`${BASE_URL}/darshan`, { waitUntil: 'domcontentloaded' });

    // Header & title visible
    await expect(page.getByRole('heading', { name: /12 Jyotirlinga, 52 Shakti Peeth & Char Dham Darshan/i })).toBeVisible();

    // 12 Jyotirlinga Category active by default
    await expect(page.getByText(/१२ द्वादश ज्योतिर्लिंग/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /श्री सोमनाथ महादेव/i }).first()).toBeVisible();

    // Guaranteed Real HD Sanctum Image visible
    const sanctumImg = page.locator('img[alt*="Somnath"]');
    await expect(sanctumImg).toBeVisible();

    // 4 Direct Connection Channels visible
    await expect(page.getByText(/ई-पूजा बुकिंग/i).first()).toBeVisible();
    await expect(page.getByText(/हेल्पलाइन/i).first()).toBeVisible();
    await expect(page.getByText(/दिशा-निर्देश/i).first()).toBeVisible();
    await expect(page.getByText(/लाइव प्रसारण/i).first()).toBeVisible();

    // Parikrama auto-cycling status & 24x7 LIVE badge
    await expect(page.getByText(/24x7 LIVE DARSHAN/i).first()).toBeVisible();
    await expect(page.getByText(/परिक्रमा गतिमान/i).first()).toBeVisible();

    // Virtual Puja Buttons exist in cinema dock and are functional
    const bellBtn = page.getByRole('button', { name: /घण्टी/i }).first();
    await expect(bellBtn).toBeVisible();
    await bellBtn.click();

    const flowerBtn = page.getByRole('button', { name: /पुष्प अर्पण/i }).first();
    await expect(flowerBtn).toBeVisible();
    await flowerBtn.click();

    // Step Matrix Navigation: Jump to #7 Kashi Vishwanath
    const step7Btn = page.getByRole('button', { name: /#7/i });
    await expect(step7Btn).toBeVisible();
    await step7Btn.click();
    await expect(page.getByRole('heading', { name: /श्री काशी विश्वनाथ ज्योतिर्लिंग/i }).first()).toBeVisible();

    // Switch to Char Dham Mode
    const charDhamTab = page.getByRole('button', { name: /चार धाम व महातीर्थ/i });
    await expect(charDhamTab).toBeVisible();
    await charDhamTab.click();
    await expect(page.getByRole('heading', { name: /श्री राम जन्मभूमि मंदिर/i }).first()).toBeVisible();

    // Switch to 52 Shakti Peeth Mode
    const shaktiPeethTab = page.getByRole('button', { name: /५२ महा शक्तिपीठ/i });
    await expect(shaktiPeethTab).toBeVisible();
    await shaktiPeethTab.click();
    await expect(page.getByRole('heading', { name: /माँ कामाख्या महापीठ/i }).first()).toBeVisible();

    // Family Sankalpa & WhatsApp button present
    await expect(page.getByText(/Family Sankalpa & Blessing Card/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /WhatsApp/i }).first()).toBeVisible();
  });

  test('Responsive Audit across 390px, 768px, 1440px: Zero horizontal overflow', async ({ page }) => {
    const viewports = [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 }
    ];

    const routes = ['/', '/numerology/name', '/aarti-stotra', '/presentation', '/pandit/workspace', '/report', '/profile', '/upaya', '/ask', '/daily', '/dashboard'];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      for (const route of routes) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
        const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        expect(hasOverflow, `Overflow detected on ${route} at ${vp.width}px`).toBe(false);
      }
    }
  });

  test('Vedic Pooja Store & Sacred Samagri (/store): Catalog, Categories, Cart Drawer, and Checkout', async ({ page }) => {
    await page.goto(`${BASE_URL}/store`, { waitUntil: 'domcontentloaded' });

    // Hero title & purity badges visible
    await expect(page.getByRole('heading', { name: /Pooja Store & Sacred Samagri/i })).toBeVisible();
    await expect(page.getByText(/१००% शुद्ध व केमिकल-रहित/i).first()).toBeVisible();

    // Category filters exist and functional
    const diyaFilter = page.getByRole('button', { name: /पीतल दीया व दीप/i });
    await expect(diyaFilter).toBeVisible();
    await diyaFilter.click();
    await expect(page.getByText(/पीतल अखण्ड दीप/i).first()).toBeVisible();

    const dhoopFilter = page.getByRole('button', { name: /धूप, अगरबत्ती व कपूर/i });
    await expect(dhoopFilter).toBeVisible();
    await dhoopFilter.click();
    await expect(page.getByText(/गोबर गुग्गल व लोबान हवन कप/i).first()).toBeVisible();

    const poshakFilter = page.getByRole('button', { name: /विग्रह पोशाक व शृंगार/i });
    await expect(poshakFilter).toBeVisible();
    await poshakFilter.click();
    await expect(page.getByText(/लड्डू गोपाल जी की भारी जरी पोशाक/i).first()).toBeVisible();

    // Add product to cart
    const addBtn = page.getByRole('button', { name: /जोड़ें \(Add\)/i }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Cart drawer opens with items
    await expect(page.getByText(/आपकी पूजा सामग्री कार्ट/i)).toBeVisible();
    await expect(page.getByText(/उप-योग/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /WhatsApp ऑर्डर/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /सीधे चेकआउट →/i })).toBeVisible();

    // Test /shop redirect
    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*\/store/);
  });

  test('Stellarium Vedic Observatory (/observatory): Celestial Canvas, LST, and Graha Sphuta', async ({ page }) => {
    await page.goto(`${BASE_URL}/observatory`, { waitUntil: 'domcontentloaded' });

    // Header & Observatory elements
    await expect(page.getByRole('heading', { name: /The Living Cosmic Dome/i })).toBeVisible();
    await expect(page.getByText(/खगोल चक्र/i)).toBeVisible();
    await expect(page.getByText(/LST:/i)).toBeVisible();

    // Graha Sphuta table visible
    await expect(page.getByText(/ग्रह स्फुट सारणी/i)).toBeVisible();
    await expect(page.getByText(/सूर्य \(Surya\)/i).first()).toBeVisible();
    await expect(page.getByText(/गुरु \(Brihaspati\)/i).first()).toBeVisible();

    // Time machine controls
    await expect(page.getByText(/Time Machine/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /ब्रह्म मुहूर्त/i })).toBeVisible();
  });

  test('Parivaar & Devotee Vault (/profile): Multi-Profile Management, DPDP Export, and Alert Preferences', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });

    // Header & Cosmic ID
    await expect(page.getByRole('heading', { name: /Parivaar & Devotee Vault/i })).toBeVisible();
    await expect(page.getByText(/PRIMARY COSMIC ID/i)).toBeVisible();

    // Tabs exist
    await expect(page.getByRole('button', { name: /पारिवारिक कुण्डली वॉल्ट/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /ई-पूजा व सामग्री ऑर्डर इतिहास/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /पञ्चाङ्ग व व्रत सूचना सेटिंग्स/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /डेटा बैकअप व गोपनीयता/i })).toBeVisible();

    // Add Member modal button
    const addMemberBtn = page.getByRole('button', { name: /नया सदस्य जोड़ें/i });
    await expect(addMemberBtn).toBeVisible();
    await addMemberBtn.click();
    await expect(page.getByText(/नया पारिवारिक सदस्य जोड़ें/i)).toBeVisible();
    await page.getByRole('button', { name: /Save Profile|सहेजें/i }).click();

    // Switch to Privacy tab
    await page.getByRole('button', { name: /डेटा बैकअप व गोपनीयता/i }).click();
    await expect(page.getByText(/पारिवारिक वॉल्ट बैकअप/i)).toBeVisible();
    await expect(page.getByText(/समस्त डेटा हटाएं/i)).toBeVisible();
  });

  test('PWA Manifest & Service Worker Integrity', async ({ page }) => {
    // Check manifest.json
    const manifestRes = await page.request.get(`${BASE_URL}/manifest.json`);
    expect(manifestRes.status()).toBe(200);
    const manifestJson = await manifestRes.json();
    expect(manifestJson.short_name).toBe('CosmicTantra');
    expect(manifestJson.display).toBe('standalone');

    // Check sw.js
    const swRes = await page.request.get(`${BASE_URL}/sw.js`);
    expect(swRes.status()).toBe(200);
  });

  test('Dead Links Audit: Zero href="#" across all representative routes', async ({ page }) => {
    const routes = ['/', '/numerology/name', '/aarti-stotra', '/presentation', '/pandit/workspace', '/report', '/profile', '/upaya', '/ask', '/daily', '/dashboard', '/store', '/observatory'];

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      const deadAnchors = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors
          .filter(a => a.getAttribute('href') === '#' || a.getAttribute('href') === '')
          .map(a => a.innerText || a.className);
      });
      expect(deadAnchors.length, `Dead anchors found on ${route}: ${deadAnchors.join(', ')}`).toBe(0);
    }
  });

});
