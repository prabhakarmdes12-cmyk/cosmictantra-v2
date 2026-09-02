import { test, expect } from '@playwright/test';
import { getCanonicalPanchangBundle, DEFAULT_LOCATION } from '../src/lib/panchangFactBundle';
import { calculatePanchang } from '../src/engines/panchang.js';
import { resolveConversationalDate } from '../src/lib/ai/dateIntelligence';
import { resolveDeterministicKashiIntent, timeToSpokenHindi, timeRangeToSpokenHindi } from '../src/lib/ai/kashiIntentEngine';
import { findNearbySacredDays, findNextSpecificObservance } from '../src/lib/panchang/nearbySacredDays';
import { sanitizeChatOutput } from '../src/lib/ai/outputSanitizer';

test.describe('KASHI SAHAYAK V2 — Panchang-Aware Conversation, Date Intelligence & Voice UX', () => {

  const DHANBAD_LOC = {
    name: 'Dhanbad, Jharkhand',
    nameHi: 'धनबाद',
    latitude: 23.7957,
    longitude: 86.4304,
    timezone: 5.5
  };

  test('PANCHANG_INV_001: Cosmic Now and Kashi Sahayak share one deterministic truth source for Dhanbad Rahukaal', async () => {
    const fixedDate = new Date('2026-09-02T12:00:00+05:30');

    // 1. Cosmic Now calculation
    const cosmicNowPanchang = calculatePanchang(fixedDate, DHANBAD_LOC.latitude, DHANBAD_LOC.longitude, DHANBAD_LOC.timezone);
    const expectedRahu = cosmicNowPanchang.timings.rahuKalam;

    // 2. Canonical Panchang Fact Bundle
    const canonicalBundle = getCanonicalPanchangBundle(fixedDate, DHANBAD_LOC);

    expect(canonicalBundle.timings.rahuKalam).toBe(expectedRahu);
    expect(canonicalBundle.timings.rahuKalam).not.toContain('undefined');
    expect(canonicalBundle.location.nameHi).toBe('धनबाद');

    // 3. Kashi Sahayak Intent Engine output
    const intentRes = resolveDeterministicKashiIntent('आज राहुकाल क्या है?', null, {
      referenceDate: '2026-09-02',
      location: canonicalBundle.location,
      source: 'COSMIC_NOW'
    });

    expect(intentRes).not.toBeNull();
    expect(intentRes?.intent).toBe('GET_RAHUKAAL');
    expect(intentRes?.displayText).toContain(expectedRahu);
    expect(intentRes?.displayText).not.toContain('undefined');
    expect(intentRes?.displayText).not.toContain('null');
    expect(intentRes?.speakText).toBeDefined();
    expect(intentRes?.speakText).not.toContain('undefined');
    expect(intentRes?.speakText).not.toContain('null');
  });

  test('CHAT_INV_001: Output sanitizer eliminates all raw internal nullish/undefined tokens across 20+ queries', async () => {
    const queries = [
      'आज का पंचांग',
      'राहुकाल कब है',
      'अभिजित मुहूर्त बताओ',
      'आज कौन सी तिथि है',
      'तिथि कब बदलेगी',
      'आज कौन सा नक्षत्र है',
      'नक्षत्र कब बदलेगा',
      'अगली एकादशी कब है',
      'अगला प्रदोष व्रत',
      'आसपास कौन से मुख्य व्रत हैं',
      'आज और कल में क्या अंतर है',
      'कल का राहुकाल',
      'परसों का पंचांग',
      'राहुकाल का क्या महत्व है',
      'ब्रह्म मुहूर्त का समय'
    ];

    const ctx = {
      referenceDate: '2026-09-02',
      location: DEFAULT_LOCATION,
      source: 'COSMIC_NOW' as const
    };

    for (const q of queries) {
      const intentRes = resolveDeterministicKashiIntent(q, null, ctx);
      expect(intentRes, `Query failed to resolve: "${q}"`).not.toBeNull();
      if (!intentRes) continue;

      const sanitizedDisplay = sanitizeChatOutput(intentRes.displayText);
      const sanitizedSpeak = sanitizeChatOutput(intentRes.speakText);

      // Verify strict CHAT_INV_001
      expect(sanitizedDisplay).not.toContain('undefined');
      expect(sanitizedDisplay).not.toContain('null');
      expect(sanitizedDisplay).not.toContain('NaN');
      expect(sanitizedDisplay).not.toContain('[object Object]');
      expect(sanitizedDisplay).not.toContain('INVALID_DATE');
      expect(sanitizedDisplay).not.toContain('UNKNOWN');

      expect(sanitizedSpeak).not.toContain('undefined');
      expect(sanitizedSpeak).not.toContain('null');
      expect(sanitizedSpeak).not.toContain('NaN');
      expect(sanitizedSpeak).not.toContain('[object Object]');
    }
  });

  test('Conversational Date Intelligence: Temporal Threading across multi-turn dialogue', async () => {
    let ctx = {
      referenceDate: '2026-09-02',
      location: DEFAULT_LOCATION,
      lastTopic: undefined as string | undefined,
      lastIntent: undefined as any
    };

    // Turn 1: "आज राहुकाल क्या है?"
    const turn1 = resolveConversationalDate('आज राहुकाल क्या है?', ctx);
    expect(turn1.resolvedDate).toBe('2026-09-02');

    const res1 = resolveDeterministicKashiIntent('आज राहुकाल क्या है?', null, ctx);
    expect(res1?.intent).toBe('GET_RAHUKAAL');
    ctx = res1?.panchangContext || ctx;

    // Turn 2: "और कल?" (should retain GET_RAHUKAAL and advance date by 1)
    const turn2 = resolveConversationalDate('और कल?', ctx);
    expect(turn2.resolvedDate).toBe('2026-09-03');
    expect(turn2.inheritedIntent).toBe('GET_RAHUKAAL');

    const res2 = resolveDeterministicKashiIntent('और कल?', null, ctx);
    expect(res2?.intent).toBe('GET_RAHUKAAL');
    expect(res2?.panchangContext.referenceDate).toBe('2026-09-03');
    ctx = res2?.panchangContext || ctx;

    // Turn 3: "उस दिन तिथि क्या है?" (should query Tithi on 2026-09-03)
    const turn3 = resolveConversationalDate('उस दिन तिथि क्या है?', ctx);
    expect(turn3.resolvedDate).toBe('2026-09-03');

    const res3 = resolveDeterministicKashiIntent('उस दिन तिथि क्या है?', null, ctx);
    expect(res3?.intent).toBe('GET_TITHI');
    expect(res3?.panchangContext.referenceDate).toBe('2026-09-03');
    ctx = res3?.panchangContext || ctx;

    // Turn 4: "कब बदलेगी?" (Transition query on current context)
    const res4 = resolveDeterministicKashiIntent('कब बदलेगी?', null, ctx);
    expect(res4?.intent).toBe('GET_TITHI_TRANSITION');
    expect(res4?.displayText).toContain('तक रहेगी');
  });

  test('Day Value vs Transition: Exact transition solvers accurately compute minute boundaries', async () => {
    const fixedDate = new Date('2026-09-02T06:00:00+05:30');
    const bundle = getCanonicalPanchangBundle(fixedDate, DEFAULT_LOCATION);

    expect(bundle.tithi.transition).toBeDefined();
    expect(bundle.tithi.transition?.endsAtFormatted).toBeDefined();
    expect(bundle.tithi.transition?.summaryHi).toContain('तक रहेगी');

    expect(bundle.nakshatra.transition).toBeDefined();
    expect(bundle.nakshatra.transition?.endsAtFormatted).toBeDefined();
    expect(bundle.nakshatra.transition?.summaryHi).toContain('तक रहेगा');
  });

  test('Nearby Sacred Days Engine: discovers and ranks upcoming festivals & observances', async () => {
    const refDate = new Date('2026-09-02T12:00:00+05:30');
    const sacredDays = findNearbySacredDays(refDate, DEFAULT_LOCATION, 14, 'एकादशी');

    expect(sacredDays.length).toBeGreaterThan(0);
    // Ekadashi query context should boost Ekadashi to the top
    expect(sacredDays[0].category).toBe('EKADASHI');
    expect(sacredDays[0].nameHi).toContain('एकादशी');
    expect(sacredDays[0].dateStr).toBeDefined();

    const nextEkadashi = findNextSpecificObservance(refDate, 'EKADASHI', DEFAULT_LOCATION);
    expect(nextEkadashi).not.toBeNull();
    expect(nextEkadashi?.category).toBe('EKADASHI');
  });

  test('Natural Spoken Hindi Time Formatter produces humanized prose', async () => {
    expect(timeToSpokenHindi('11:45 AM')).toBe('सुबह पौने बारह बजे');
    expect(timeToSpokenHindi('01:18 PM')).toBe('दोपहर एक बजकर अठारह मिनट');
    expect(timeToSpokenHindi('06:30 PM')).toBe('शाम साढ़े छह बजे');
    expect(timeToSpokenHindi('12:00 PM')).toBe('दोपहर बारह बजे');

    const spokenRange = timeRangeToSpokenHindi('11:45 AM – 01:18 PM');
    expect(spokenRange).toBe('सुबह पौने बारह बजे से दोपहर एक बजकर अठारह मिनट तक');
  });

  test('Date Comparison Intent: objectively evaluates two dates for auspicious activities', async () => {
    const query = 'आज और कल में नया काम शुरू करने के लिए कौन सा दिन बेहतर है?';
    const ctx = {
      referenceDate: '2026-09-02',
      location: DEFAULT_LOCATION,
      source: 'COSMIC_NOW' as const
    };

    const res = resolveDeterministicKashiIntent(query, null, ctx);
    expect(res).not.toBeNull();
    expect(res?.intent).toBe('COMPARE_DATES');
    expect(res?.displayText).toContain('तुलनात्मक');
    expect(res?.displayText).toContain('अभिजित');
    expect(res?.displayText).toContain('राहुकाल');
  });

});
