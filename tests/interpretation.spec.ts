import { test, expect } from '@playwright/test';
import { 
  getDaily3DayInterpretation, 
  getWeeklyInterpretation, 
  getMonthlyInterpretation, 
  getYearlyInterpretation, 
  getFamilyCollectiveForecast 
} from '../src/lib/interpretationEngine';

const PATNA = { lat: 25.5941, lng: 85.1376, tz: 5.5, name: 'Patna' };
const DEMO_PROFILE = {
  id: 'pf_test',
  name: 'Priya Sharma',
  relation: 'Self',
  birthDate: '1995-06-15',
  birthTime: '10:30',
  birthCity: 'Patna',
  lat: 25.5941,
  lng: 85.1376,
  tz: 5.5
};

const FAMILY_PROFILES = [
  DEMO_PROFILE,
  {
    id: 'pf_spouse',
    name: 'Amit Sharma',
    relation: 'Spouse',
    birthDate: '1992-11-20',
    birthTime: '08:15',
    birthCity: 'Patna',
    lat: 25.5941,
    lng: 85.1376,
    tz: 5.5
  },
  {
    id: 'pf_child',
    name: 'Aarav Sharma',
    relation: 'Son',
    birthDate: '2020-04-10',
    birthTime: '15:45',
    birthCity: 'Patna',
    lat: 25.5941,
    lng: 85.1376,
    tz: 5.5
  }
];

test.describe('Vedic Multi-Horizon Interpretation & Parivaar Intelligence Suite', () => {

  test('Daily 3-Day Engine: Computes deterministic Today, Tomorrow, and Day After Tomorrow forecasts', () => {
    const d = getDaily3DayInterpretation(DEMO_PROFILE, new Date('2026-08-26T10:00:00Z'), PATNA);
    expect(d.length).toBe(3);

    // Today (Day 0)
    expect(d[0].dayLabel).toBe('Today');
    expect(d[0].score).toBeGreaterThanOrEqual(30);
    expect(d[0].score).toBeLessThanOrEqual(95);
    expect(d[0].theme).toBeDefined();
    expect(d[0].career.length).toBeGreaterThan(10);
    expect(d[0].wealth.length).toBeGreaterThan(10);
    expect(d[0].relationships.length).toBeGreaterThan(10);
    expect(d[0].vitality.length).toBeGreaterThan(10);
    expect(d[0].powerWindow.time).toBeDefined();
    expect(d[0].cautionWindow.time).toBeDefined();
    expect(d[0].sankalpa.mantra).toContain('ॐ');

    // Tomorrow (Day 1)
    expect(d[1].dayLabel).toBe('Tomorrow');
    expect(d[1].career.length).toBeGreaterThan(10);

    // Day After Tomorrow (Day 2)
    expect(d[2].dayLabel).toBe('Day After Tomorrow');
    expect(d[2].vitality.length).toBeGreaterThan(10);
  });

  test('Weekly 7-Day Engine: Computes 7 days trajectory, Peak Execution Day, and Caution Day', () => {
    const w = getWeeklyInterpretation(DEMO_PROFILE, new Date('2026-08-26T10:00:00Z'), PATNA);
    expect(w.days.length).toBe(7);
    expect(w.weekTheme).toBeDefined();
    expect(w.peakExecutionDay.day).toBeDefined();
    expect(w.cautionRestDay.day).toBeDefined();
    expect(w.overallScore).toBeGreaterThanOrEqual(30);
    expect(w.overallScore).toBeLessThanOrEqual(95);
  });

  test('Monthly Ingress Engine: Computes Solar Sankranti, Activated Bhava, and Artha window', () => {
    const m = getMonthlyInterpretation(DEMO_PROFILE, new Date('2026-08-26T10:00:00Z'), PATNA);
    expect(m.monthName).toBeDefined();
    expect(m.sunSankranti.house).toBeGreaterThanOrEqual(1);
    expect(m.sunSankranti.house).toBeLessThanOrEqual(12);
    expect(m.activatedBhava.interpretation.length).toBeGreaterThan(15);
    expect(m.arthaWindow.period).toBeDefined();
    expect(m.monthlyUpaya).toBeDefined();
  });

  test('Yearly Varshaphal Engine: Computes Jupiter, Saturn, Rahu-Ketu, Tajika Muntha, and 4 Quarters', () => {
    const y = getYearlyInterpretation(DEMO_PROFILE, new Date('2026-08-26T10:00:00Z'), PATNA);
    expect(y.year).toBe(2026);
    expect(y.munthaHouse).toBeGreaterThanOrEqual(1);
    expect(y.munthaHouse).toBeLessThanOrEqual(12);
    expect(y.jupiterTransit.effect.length).toBeGreaterThan(15);
    expect(y.saturnTransit.mitigation.length).toBeGreaterThan(15);
    expect(y.quarters.length).toBe(4);
    expect(y.quarters[0].quarter).toBe('Q1 (Jan–Mar)');
  });

  test('Parivaar Intelligence Engine: Evaluates whole family collective score and generates protective alerts', () => {
    const fam = getFamilyCollectiveForecast(FAMILY_PROFILES, new Date('2026-08-26T10:00:00Z'), PATNA);
    expect(fam.membersDaily.length).toBe(3);
    expect(fam.collectiveScore).toBeGreaterThanOrEqual(30);
    expect(fam.status).toBeDefined();
    expect(fam.summary.length).toBeGreaterThan(20);
  });

  test('UI Verification (/daily): Interactive switching across Daily, Weekly, Monthly, Yearly, and Whole Parivaar', async ({ page }) => {
    await page.goto('http://localhost:3000/daily', { waitUntil: 'domcontentloaded' });

    // Header and title visible
    await expect(page.getByText(/PARIVAAR INTELLIGENCE & FORECAST/i)).toBeVisible();

    // 1. Daily 3-Day Forecast cards visible
    await expect(page.getByText('Career & Karma (कर्म व व्यवसाय)').first()).toBeVisible();
    await expect(page.getByText('Artha & Finance (वित्त व निर्णय)').first()).toBeVisible();

    // 2. Switch to Weekly Tab
    await page.getByRole('button', { name: /Weekly \(7 Days\)/i }).click();
    await expect(page.getByText(/साप्ताहिक सारांश/i)).toBeVisible();
    await expect(page.getByText(/PEAK EXECUTION DAY/i)).toBeVisible();

    // 3. Switch to Monthly Tab
    await page.getByRole('button', { name: /Monthly \(30 Days\)/i }).click();
    await expect(page.getByText(/मासिक संक्रान्ति व गोचर/i)).toBeVisible();
    await expect(page.getByText(/BEST ARTHA \(FINANCIAL\) WINDOW/i)).toBeVisible();

    // 4. Switch to Yearly Tab
    await page.getByRole('button', { name: /Yearly \(Varshaphal\)/i }).click();
    await expect(page.getByText(/वार्षिक वर्षफल/i)).toBeVisible();
    await expect(page.getByText(/4-QUARTER LIFE CHAPTER ROADMAP/i)).toBeVisible();

    // 5. Switch to Whole Parivaar View
    await page.getByRole('button', { name: /Whole Parivaar View/i }).click();
    await expect(page.getByText(/Whole Parivaar Daily Synthesis/i)).toBeVisible();
    await expect(page.getByText(/COLLECTIVE FAMILY HARMONY/i)).toBeVisible();
  });

  test('UI Verification (/family-panchang): Synchronized family transits and protection alerts', async ({ page }) => {
    await page.goto('http://localhost:3000/family-panchang', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText(/PARIVAAR INTELLIGENCE/i)).toBeVisible();
    await expect(page.getByText(/COLLECTIVE HARMONY/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Share Parivaar Panchang Digest/i })).toBeVisible();
  });

  test('Homepage Click Test: Lime 72h Marquee Ticker navigates to /daily when clicked', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });

    const ticker = page.locator('[data-testid="lime-72h-ticker"]');
    await expect(ticker).toBeVisible();
    await expect(ticker.getByText(/72H GLIMPSE/i)).toBeVisible();

    // Click the ticker and verify navigation
    await ticker.click();
    await page.waitForURL('**/daily');
    await expect(page).toHaveURL(/.*\/daily/);

    await expect(page.getByText(/PARIVAAR INTELLIGENCE & FORECAST/i)).toBeVisible();
    await expect(page.getByText(/Career & Karma/i).first()).toBeVisible();
  });

  test('Homepage Click Test: Full-Screen Mega Menu "72h Forecast" navigates reliably', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });

    // Open mega menu
    const menuBtn = page.getByRole('button', { name: /Open Full Navigation Menu|Open navigation menu|Menu/i }).first();
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Click 72h Forecast in mega menu
    const forecastTile = page.locator('button').filter({ hasText: /७२ घण्टे|राशिफल|72h/i }).first();
    await expect(forecastTile).toBeVisible();
    await forecastTile.click();

    await expect(page).toHaveURL(/.*\/daily/);
    await expect(page.getByText(/PARIVAAR INTELLIGENCE & FORECAST/i)).toBeVisible();
  });

  test('Full-Screen Mega Menu: Monthly Vedic Calendar navigates cleanly', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    const menuBtn = page.getByRole('button', { name: /Open Full Navigation Menu|Menu/i }).first();
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await page.waitForTimeout(300);
    const calBtn = page.locator('button').filter({ hasText: /मासिक वैदिक पञ्चाङ्ग|Monthly Vedic Calendar|कैलेंडर/i }).first();
    await expect(calBtn).toBeVisible();
    await calBtn.click();
    await expect(page).toHaveURL(/.*\/calendar/);
    await expect(page.getByRole('heading', { name: /Monthly Vedic Calendar/i })).toBeVisible();
  });

  test('Full-Screen Mega Menu: Aarti & Stotra Library navigates cleanly', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    const menuBtn = page.getByRole('button', { name: /Open Full Navigation Menu|Open navigation menu|Menu/i }).first();
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    const aartiBtn = page.locator('button').filter({ hasText: /आरती|स्तोत्र|Aarti & Stotra/i }).first();
    await expect(aartiBtn).toBeVisible();
    await aartiBtn.click();
    await expect(page).toHaveURL(/.*\/aarti-stotra/);
    await expect(page.getByRole('heading', { name: /Aarti & Stotra Library/i })).toBeVisible();
  });

  test('Full-Screen Mega Menu: Upaya Studio navigates cleanly', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    const menuBtn = page.getByRole('button', { name: /Open Full Navigation Menu|Menu/i }).first();
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    const upayaBtn = page.locator('button').filter({ hasText: /ग्रह शान्ति|उपचार|Upaya/i }).first();
    await expect(upayaBtn).toBeVisible();
    await upayaBtn.click();
    await expect(page).toHaveURL(/.*\/upaya/);
    await expect(page.getByRole('heading', { name: /Authentic Remedies & Upaya Directory/i })).toBeVisible();
  });

  test('Full-Screen Mega Menu: Kundali Milan navigates cleanly', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    const menuBtn = page.getByRole('button', { name: /Open Full Navigation Menu|Menu/i }).first();
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    const matchBtn = page.locator('button').filter({ hasText: /३६-गुण|कुण्डली मिलान|Kundali Milan/i }).first();
    await expect(matchBtn).toBeVisible();
    await matchBtn.click();
    await expect(page).toHaveURL(/.*\/kundali-milan/);
    await expect(page.getByRole('heading', { name: /Kundali Milan/i })).toBeVisible();
  });

  test('Full-Screen Mega Menu: Stellarium Vedic Observatory navigates cleanly', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    const menuBtn = page.getByRole('button', { name: /Open Full Navigation Menu|Menu/i }).first();
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    const obsBtn = page.getByRole('button', { name: /खगोल वेधशाला|Stellarium/i }).first();
    await expect(obsBtn).toBeVisible();
    await obsBtn.click();
    await expect(page).toHaveURL(/.*\/observatory/);
    await expect(page.getByRole('heading', { name: /The Living Cosmic Dome/i })).toBeVisible();
  });

  test('Aura Monthly Vedic Calendar (/calendar): Full Month Grid, Power/Caution Days, and Day Inspector Drawer', async ({ page }) => {
    await page.goto('http://localhost:3000/calendar', { waitUntil: 'domcontentloaded' });

    // Verify Header and Month View
    await expect(page.getByRole('heading', { name: /Monthly Vedic Calendar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Power Days/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Caution Days/i })).toBeVisible();

    // Verify 7-Day matrix headers
    await expect(page.getByText('SUN', { exact: true })).toBeVisible();
    await expect(page.getByText('MON', { exact: true })).toBeVisible();
    await expect(page.getByText('FRI', { exact: true })).toBeVisible();

    // Click on a day card (e.g. day 15) to open the Day Inspector Drawer
    const dayCell = page.locator('.cursor-pointer').filter({ hasText: '15' }).first();
    await expect(dayCell).toBeVisible();
    await dayCell.click();

    // Verify Inspector Drawer contents
    await expect(page.getByText(/दैनिक प[ंञ्च]+ांग व ऊर्जा विश्लेषण|Daily Panchang/i).first()).toBeVisible();
    await expect(page.getByText(/प[ंञ्च]+ांग के पाँच अंग|5 Astronomical Limbs/i).first()).toBeVisible();
    await expect(page.getByText(/(1|१)\.\s*तिथि|Tithi/i).first()).toBeVisible();
    await expect(page.getByText(/(2|२)\.\s*नक्षत्र|Nakshatra/i).first()).toBeVisible();
    await expect(page.getByText(/शुभ मुहूर्त|Auspicious/i).first()).toBeVisible();
    await expect(page.getByText(/राहुकाल|Rahu Kaal/i).first()).toBeVisible();

    // Close Inspector
    const closeBtn = page.getByRole('button', { name: /बन्द करें|Close/i });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Test Power Days filter toggle
    const powerFilterBtn = page.getByRole('button', { name: /Power Days|शुभ ऊर्जा दिवस/i });
    await powerFilterBtn.click();

    // Test Festivals filter toggle
    const festivalsFilterBtn = page.getByRole('button', { name: /Festivals/i });
    await festivalsFilterBtn.click();
  });

});
