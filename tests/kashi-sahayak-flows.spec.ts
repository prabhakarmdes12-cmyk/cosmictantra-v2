/**
 * KASHI SAHAYAK FLOWS — main menu, granth recitation, pulse handoff.
 *
 * The always-on half of this spec is a contract on the catalogue and on the
 * component's source: eight scriptures with real, sourced mūla text; a
 * persistent main menu; the two doors out of the pulse card; and a concierge
 * modal whose phone and WhatsApp links are the published hotline. The
 * browser half drives the actual conversation where a browser exists, and
 * skips cleanly where Chromium cannot be installed.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  GRANTH_RECITALS, recitalById, loadRecitalUnits, loadRecitalPassages, recitalSpeech,
} from '../src/lib/kashi/granthRecitals';
import { browserAvailable, BROWSER_SKIP_REASON } from './support/browserAvailable';

const COMPONENT = path.join(process.cwd(), 'src/components/consultation/FloatingAIGuruAvatar.tsx');
const componentSource = fs.readFileSync(COMPONENT, 'utf8');

test.describe('KS — the eight-scripture recitation catalogue', () => {
  test('all eight scriptures are offered, with unique ids and a structure a seeker recognises', () => {
    expect(GRANTH_RECITALS).toHaveLength(8);
    const ids = GRANTH_RECITALS.map((r) => r.id);
    expect(new Set(ids).size).toBe(8);
    expect(ids).toEqual([
      'bhagavad-gita', 'ramcharitmanas', 'shiva-mahapuran', 'devi-bhagavata',
      'hanuman-chalisa', 'shiva-tandava', 'maha-mrityunjaya', 'shri-suktam-kanakadhara',
    ]);
    for (const r of GRANTH_RECITALS) {
      expect(r.titleHi.trim().length, r.id).toBeGreaterThan(0);
      expect(r.structureHi.trim().length, r.id).toBeGreaterThan(0);
    }
    expect(recitalById('bhagavad-gita')?.structureHi).toContain('१८ अध्याय');
    expect(recitalById('ramcharitmanas')?.structureHi).toContain('७ काण्ड');
    expect(recitalById('does-not-exist')).toBeNull();
  });

  test('embedded mūla is real scripture, copied from its edition — not a placeholder', async () => {
    const mrityunjaya = await loadRecitalPassages('maha-mrityunjaya', 'mantra');
    expect(mrityunjaya.length).toBeGreaterThan(0);
    expect(mrityunjaya[0].sanskrit).toContain('त्र्यम्बकं यजामहे');
    expect(mrityunjaya[0].sanskrit).toContain('मृत्योर्मुक्षीय');

    const suktam = await loadRecitalPassages('shri-suktam-kanakadhara', 'shri-suktam');
    expect(suktam[0].sanskrit).toContain('हिरण्यवर्णां');
    const kanakadhara = await loadRecitalPassages('shri-suktam-kanakadhara', 'kanakadhara');
    expect(kanakadhara[0].sanskrit).toContain('अङ्गं हरेः पुलकभूषणम्');
    expect(kanakadhara.map((p) => p.sanskrit).join(' ')).toContain('सुवर्णधारास्तोत्रं');

    // Every embedded passage carries mūla AND a sense; speech is mūla first.
    for (const p of [...mrityunjaya, ...suktam, ...kanakadhara]) {
      expect(p.sanskrit.trim().length).toBeGreaterThan(10);
      expect(p.hindi.trim().length).toBeGreaterThan(10);
      expect(recitalSpeech(p)).toContain(p.sanskrit.split('\n')[0]);
    }
  });

  test('library-backed recitals resolve their units and verses from the granth library', async () => {
    const gitaUnits = await loadRecitalUnits('bhagavad-gita');
    expect(gitaUnits.length).toBeGreaterThanOrEqual(18);
    expect(gitaUnits.map((u) => u.labelHi).join(' ')).toContain('साङ्ख्य');
    const gitaCh1 = await loadRecitalPassages('bhagavad-gita', 'gita-ch-1');
    expect(gitaCh1.length).toBeGreaterThan(0);
    expect(gitaCh1[0].sanskrit.trim().length).toBeGreaterThan(10);

    const rcmUnits = await loadRecitalUnits('ramcharitmanas');
    expect(rcmUnits).toHaveLength(7);
    expect(rcmUnits.map((u) => u.labelHi).join(' ')).toContain('सुन्दर');

    const chalisaUnits = await loadRecitalUnits('hanuman-chalisa');
    expect(chalisaUnits.length).toBeGreaterThanOrEqual(3);
    const chalisa = await loadRecitalPassages('hanuman-chalisa', chalisaUnits[0].id);
    expect(chalisa[0].sanskrit).toContain('श्रीगुरु चरन सरोज');

    const tandav = await loadRecitalUnits('shiva-tandava');
    expect(tandav.length).toBeGreaterThanOrEqual(1);
    const tandavPassages = await loadRecitalPassages('shiva-tandava', tandav[0].id);
    expect(tandavPassages[0].sanskrit).toContain('जटा');

    const mahapuran = await loadRecitalUnits('shiva-mahapuran');
    expect(mahapuran.length).toBeGreaterThanOrEqual(4);
    const devi = await loadRecitalUnits('devi-bhagavata');
    expect(devi.length).toBeGreaterThanOrEqual(3);
  });

  test('an unresolvable text says so instead of speaking silence', async () => {
    expect(await loadRecitalUnits('no-such-granth')).toEqual([]);
    expect(await loadRecitalPassages('bhagavad-gita', 'no-such-chapter')).toEqual([]);
  });
});

test.describe('KS — component contract: menu, pulse doors, concierge', () => {
  test('the main menu is persistent, not a message that scrolls away', () => {
    expect(componentSource).toContain('मुख्य मेन्यू');
    // Rendered in the header cluster, wired to the same handler as the chip.
    expect(componentSource).toContain('postMainMenu');
    expect(componentSource).toMatch(/title="मुख्य मेन्यू/);
  });

  test('the granth flow is reachable from the menu and dispatches per unit', () => {
    expect(componentSource).toContain("action: 'GRANTH_MENU'");
    expect(componentSource).toContain('GRANTH_PICK_');
    expect(componentSource).toContain('GRANTH_UNIT_');
    expect(componentSource).toContain('recitalCard');
    // Playback controls exist on the card.
    for (const control of ['▶ पाठ आरम्भ', '⏭ अगला पद', '⏹ रोकें']) {
      expect(componentSource).toContain(control);
    }
  });

  test('the pulse card ends in exactly two doors: full kundli, or a human', () => {
    expect(componentSource).toContain('पूर्ण कुण्डली देखें');
    expect(componentSource).toContain('ज्योतिषी से बात करें');
    expect(componentSource).toContain('reportHrefForSeeker');
  });

  test('the VIP concierge modal carries the published hotline, a pre-filled WhatsApp link and the five-step roadmap', () => {
    expect(componentSource).toContain('tel:+919972934937');
    expect(componentSource).toContain('https://wa.me/919972934937');
    expect(componentSource).toContain('+91 99729 34937');
    expect(componentSource).toContain('${VIP_CONCIERGE_WA}?text=${encodeURIComponent(text)}');
    expect(componentSource).toContain('परामर्श की पाँच चरण यात्रा');
    const roadmap = componentSource.match(/VIP_CONCIERGE_ROADMAP_HI = \[([\s\S]*?)\];/);
    expect(roadmap, 'roadmap array present').toBeTruthy();
    const steps = roadmap![1].match(/'/g)?.length ?? 0;
    expect(steps / 2, 'five roadmap steps').toBe(5);
    // The ₹501 payment step and the Drive-audio step are part of the promise.
    expect(roadmap![1]).toContain('₹501');
    expect(roadmap![1]).toContain('Google Drive');
  });
});

test.describe('KS — browser flows', () => {
  test.skip(!browserAvailable(), BROWSER_SKIP_REASON);

  test('main menu → granth hall → Hanuman Chalisa recital card with playback', async ({ page }) => {
    await page.goto('/');
    await page.getByTitle(/काशी सहायक/).first().click();
    const menu = page.getByRole('button', { name: /मुख्य मेन्यू/ });
    await expect(menu).toBeVisible();
    await menu.click();
    await page.getByRole('button', { name: /ग्रंथ पाठ व स्वर-वाचन/ }).first().click();
    await page.getByRole('button', { name: /श्री हनुमान चालीसा/ }).first().click();
    await expect(page.getByText('श्री हनुमान चालीसा', { exact: false }).last()).toBeVisible();
    await expect(page.getByRole('button', { name: /पाठ आरम्भ/ })).toBeVisible();
    await expect(page.getByText('श्रीगुरु चरन सरोज', { exact: false })).toBeVisible();
  });

  test('kundli intake pulse card opens the concierge modal with live tel and WhatsApp links', async ({ page }) => {
    await page.goto('/');
    await page.getByTitle(/काशी सहायक/).first().click();
    await page.getByRole('button', { name: /पंडित जी से सीधी बात/ }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const tel = dialog.locator('a[href^="tel:+919972934937"]');
    await expect(tel).toBeVisible();
    const wa = dialog.locator('a[href^="https://wa.me/919972934937?text="]');
    await expect(wa).toBeVisible();
    expect(await wa.getAttribute('href')).toContain('%'); // pre-populated message, encoded
    await expect(dialog.getByText('परामर्श की पाँच चरण यात्रा')).toBeVisible();
  });
});
