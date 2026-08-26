import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('CosmicTantra — AI Guru, CallMe4 E2EE & Pandit Onboarding Suite', () => {

  test('Ask / Consultation Hub (/ask): Displays AI Guru banner, 4 Service Tiers, and triggers AI Guru modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/ask`, { waitUntil: 'domcontentloaded' });

    // Header and TrustBar
    await expect(page.getByText(/विद्वान् ज्योतिषी परामर्श|VEDIC SCHOLAR BENCH/i).first()).toBeVisible();

    // 4 Service Tiers
    await expect(page.getByText(/लिखित विद्वत्-परामर्श पत्र/i)).toBeVisible();
    await expect(page.getByText(/गोपनीय प्रत्यक्ष वॉयस कॉल/i)).toBeVisible();
    await expect(page.getByText(/साक्षात् वीडियो दर्शन/i)).toBeVisible();
    await expect(page.getByText(/पारिवारिक कुण्डली महा-सत्र/i)).toBeVisible();

    // AI Guru Chatbot CTA button
    const aiGuruBtn = page.getByRole('button', { name: /AI गुरु वार्तालाप प्रारम्भ करें/i }).first();
    await expect(aiGuruBtn).toBeVisible();
    await aiGuruBtn.click();
    await page.waitForTimeout(300);

    // AI Guru Chatbot Modal is open
    await expect(page.getByText(/गुरु ज्योतिषदेव \(AI वैदिक मार्गदर्शक\)/i)).toBeVisible();
    await expect(page.getByText(/ONLINE/i).first()).toBeVisible();
  });

  test('CallMe4 Encrypted Chamber (/consultation/room/CT-2026-0825-001): Zero Phone Leak, E2EE status, audio waveform, and synchronized Kundali', async ({ page }) => {
    await page.goto(`${BASE_URL}/consultation/room/CT-2026-0825-001?mode=voice&role=devotee`, { waitUntil: 'domcontentloaded' });

    // Encryption badge and number masking
    await expect(page.getByText(/256-BIT E2EE \(CALLME4 MASKED\)/i)).toBeVisible();
    await expect(page.getByText(/पंडित विद्यानंद शास्त्री/i).first()).toBeVisible();

    // Synchronized Kundali Drawer
    await expect(page.getByText(/लाइव कुण्डली व पूर्व-विवेचना/i)).toBeVisible();
    await expect(page.getByText(/वृषभ \(Taurus\)/i)).toBeVisible();

    // Mode Toggle to Video Darshan
    const videoTab = page.getByRole('button', { name: /Video Darshan/i }).first();
    await expect(videoTab).toBeVisible();
    await videoTab.click();
    await expect(page.getByText(/HD Video Darshan Stream Active/i)).toBeVisible();

    // End call action
    const endCallBtn = page.getByRole('button', { name: /कॉल समाप्त \(End\)/i });
    await expect(endCallBtn).toBeVisible();
  });

  test('Pandit Onboarding Portal (/pandit/onboard): Full registration form, earnings calculator (80% split), and submission', async ({ page }) => {
    await page.goto(`${BASE_URL}/pandit/onboard`, { waitUntil: 'domcontentloaded' });

    // Header
    await expect(page.getByText(/विद्वान् ज्योतिषी ऑनबोर्डिंग पोर्टल/i)).toBeVisible();
    await expect(page.getByText(/८०% सम्मानजनक आय/i)).toBeVisible();

    // Form inputs
    await page.locator('input[placeholder="उदा. विद्यानंद शास्त्री"]').fill('आचार्य कृष्णमुरारी शास्त्री');
    await page.locator('input[placeholder="+91 98765 43210"]').fill('+91 98765 12345');
    await page.locator('input[placeholder="vidyanand@upi या 9876543210@paytm"]').fill('krishna@upi');

    // Submit registration
    const submitBtn = page.getByRole('button', { name: /विद्वान् पंजीकरण पूर्ण करें/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();
    await page.waitForTimeout(400);

    // Confirmation screen
    await expect(page.getByText(/पंडित ऑनबोर्डिंग आवेदन स्वीकृत हुआ!/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /विद्वान् कार्यस्थल खोलें/i })).toBeVisible();
  });

  test('Pandit Workspace (/pandit/workspace): Pre-context dossier view, CallMe4 launch links, and sacred samagri prescription', async ({ page }) => {
    await page.goto(`${BASE_URL}/pandit/workspace`, { waitUntil: 'domcontentloaded' });

    // Header
    await expect(page.getByText(/Pandit Verification & Live Consultation Workbench/i)).toBeVisible();

    // CallMe4 actions
    await expect(page.getByRole('link', { name: /Start Voice Call/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Video Darshan/i })).toBeVisible();

    // Samagri Prescription tags
    await expect(page.getByText(/जातक हेतु अनुशंसित वैदिक सामग्री/i)).toBeVisible();
    const gheeBtn = page.getByRole('button', { name: /Pure A2 Cow Ghee/i }).first();
    await expect(gheeBtn).toBeVisible();
    await gheeBtn.click();
  });

  test('Floating AI Guru Avatar: Visible on homepage, opens concierge drawer, displays quick action chips and triggers navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    // Floating Avatar Button is rendered
    const avatarBtn = page.locator('button[title="गुरु ज्योतिषदेव AI से बात करें"]');
    await expect(avatarBtn).toBeVisible();
    await avatarBtn.click();
    await page.waitForTimeout(300);

    // Concierge drawer opens with Guru Jyotishdev title
    await expect(page.getByText(/गुरु ज्योतिषदेव/i).first()).toBeVisible();
    await expect(page.getByText(/AI वैदिक मार्गदर्शक/i).first()).toBeVisible();

    // Fast Action Chips present
    await expect(page.getByRole('button', { name: /आज का 72h राशिफल व गोचर/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /26 महातीर्थ लाइव दर्शन व आरती/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /कुण्डली व जीवन प्रश्न/i })).toBeVisible();

    // Click on 72h Forecast Chip
    const forecastChip = page.getByRole('button', { name: /आज का 72h राशिफल व गोचर/i });
    await forecastChip.click();
    await page.waitForTimeout(600);

    // Navigation action card appears inside chat
    await expect(page.getByText(/72h Multi-Horizon Forecast Hub/i)).toBeVisible();
  });

  test('Floating AI Guru In-Chat Intake Flow: Guides through Domain, Name, DOB, Time, City, and Question to render Kundali snapshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    // Open Guru Avatar
    const avatarBtn = page.locator('button[title="गुरु ज्योतिषदेव AI से बात करें"]');
    await avatarBtn.click();
    await page.waitForTimeout(300);

    // Click "🔮 कुण्डली व जीवन प्रश्न"
    const intakeChip = page.getByRole('button', { name: /कुण्डली व जीवन प्रश्न/i }).first();
    await intakeChip.click();
    await page.waitForTimeout(400);

    // Select Domain (e.g. Career)
    const careerChip = page.getByRole('button', { name: /करियर, व्यापार व धन लाभ/i });
    await careerChip.click();
    await page.waitForTimeout(400);

    // Enter Name
    const chatInput = page.locator('input[placeholder="पूछें: आज का दिन, विवाह, व्यापार, या मन्त्र..."]');
    await chatInput.fill('आदित्य शर्मा');
    const sendBtn = page.locator('form:has(input[placeholder*="पूछें"]) button[type="submit"]');
    await sendBtn.click();
    await page.waitForTimeout(500);

    // Select Date chip
    const dateChip = page.getByRole('button', { name: /1995-06-15/i }).first();
    await dateChip.click();
    await page.waitForTimeout(500);

    // Select Time chip
    const timeChip = page.getByRole('button', { name: /10:30 \(सुबह\)/i }).first();
    await timeChip.click();
    await page.waitForTimeout(500);

    // Select City chip
    const cityChip = page.getByRole('button', { name: /Varanasi/i }).first();
    await cityChip.click();
    await page.waitForTimeout(500);

    // Enter Question
    await chatInput.fill('व्यापार में नए निवेश हेतु क्या शुभ मुहूर्त है?');
    await sendBtn.click();
    await page.waitForTimeout(1000);

    // Verify Kundali Snapshot & Transit Status
    await expect(page.getByText(/लग्न \(Ascendant\)|Janma Kundali Snapshot/i).first()).toBeVisible();
    await expect(page.getByText(/₹501 लिखित विद्वत्-परामर्श पत्र/i)).toBeVisible();
  });

});
