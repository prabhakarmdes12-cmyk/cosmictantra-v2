/**
 * CosmicTantra — Daily Rashifal Engine
 * Deterministic content anchored to (a) today's Moon-sign transit computed
 * from the panchang engine and (b) per-sign evergreen text. No fake claims.
 */

import { calculatePanchang } from './panchang.js';

export const SIGNS = [
  { id: 'mesha', en: 'Aries', hi: 'मेष', sanskrit: 'Mesha', planet: 'Mars' },
  { id: 'vrishabha', en: 'Taurus', hi: 'वृषभ', sanskrit: 'Vrishabha', planet: 'Venus' },
  { id: 'mithuna', en: 'Gemini', hi: 'मिथुन', sanskrit: 'Mithuna', planet: 'Mercury' },
  { id: 'karka', en: 'Cancer', hi: 'कर्क', sanskrit: 'Karka', planet: 'Moon' },
  { id: 'simha', en: 'Leo', hi: 'सिंह', sanskrit: 'Simha', planet: 'Sun' },
  { id: 'kanya', en: 'Virgo', hi: 'कन्या', sanskrit: 'Kanya', planet: 'Mercury' },
  { id: 'tula', en: 'Libra', hi: 'तुला', sanskrit: 'Tula', planet: 'Venus' },
  { id: 'vrishchika', en: 'Scorpio', hi: 'वृश्चिक', sanskrit: 'Vrishchika', planet: 'Mars' },
  { id: 'dhanu', en: 'Sagittarius', hi: 'धनु', sanskrit: 'Dhanu', planet: 'Jupiter' },
  { id: 'makara', en: 'Capricorn', hi: 'मकर', sanskrit: 'Makara', planet: 'Saturn' },
  { id: 'kumbha', en: 'Aquarius', hi: 'कुंभ', sanskrit: 'Kumbha', planet: 'Saturn' },
  { id: 'meena', en: 'Pisces', hi: 'मीन', sanskrit: 'Meena', planet: 'Jupiter' },
];

const LUCKY = {
  Sun: { color: 'Saffron / Gold', number: 1, day: 'Sunday' },
  Moon: { color: 'White / Silver', number: 2, day: 'Monday' },
  Mars: { color: 'Red', number: 9, day: 'Tuesday' },
  Mercury: { color: 'Green', number: 5, day: 'Wednesday' },
  Jupiter: { color: 'Yellow', number: 3, day: 'Thursday' },
  Venus: { color: 'Pink / White', number: 6, day: 'Friday' },
  Saturn: { color: 'Blue / Black', number: 8, day: 'Saturday' },
};

const THEMES = {
  career: {
    mesha: 'take the first step — momentum rewards initiative',
    vrishabha: 'steady execution compounds; avoid rushed commitments',
    mithuna: 'communication opens doors — follow up on pending threads',
    karka: 'emotional clarity improves decisions; protect your boundaries',
    simha: 'visibility rises — lead one visible deliverable today',
    kanya: 'detail-work pays; reorganize priorities before reacting',
    tula: 'partnerships favor balance — negotiate gently',
    vrishchika: 'deep focus unlocks what others miss; avoid power struggles',
    dhanu: 'bigger vision wins; delegate busywork',
    makara: 'patience builds authority; long-game moves only',
    kumbha: 'innovate — unexpected allies appear',
    meena: 'intuition is sharp; act on creative signals',
  },
  love: {
    mesha: 'direct honesty deepens bonds',
    vrishabha: 'small tangible gestures speak louder than words',
    mithuna: 'a thoughtful message repairs distance',
    karka: 'home and heart need your presence today',
    simha: 'generosity attracts warmth; avoid pride',
    kanya: 'listen more than you fix',
    tula: 'harmony returns through compromise',
    vrishchika: 'intensity needs softness — choose warmth',
    dhanu: 'shared adventure rekindles connection',
    makara: 'consistency builds trust; show up reliably',
    kumbha: 'freedom and affection can coexist today',
    meena: 'romance flows; receive it gracefully',
  },
  health: {
    mesha: 'high energy — channel it into exercise',
    vrishabha: 'watch indulgence; move for 30 minutes',
    mithuna: 'rest the mind; screen breaks matter',
    karka: 'nourish the stomach and the heart',
    simha: 'protect the heart; avoid heat-stress',
    kanya: 'gut health responds to routine',
    tula: 'balance exertion and rest',
    vrishchika: 'release tension through breathwork',
    dhanu: 'liver and legs benefit from movement',
    makara: 'joints and bones need warmth and care',
    kumbha: 'circulation improves with walks',
    meena: 'sleep is your medicine tonight',
  },
};

/**
 * Daily rashifal for one sign, anchored to the real ephemeris of that day.
 */
export function dailyRashifal(signId, date = new Date(), city = { lat: 25.5941, lng: 85.1376, tz: 5.5 }) {
  const sign = SIGNS.find(s => s.id === signId) || SIGNS[0];
  const panchang = calculatePanchang(date, city);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const moonSignNow = panchang?.moon?.rashiName || sign.sanskrit;
  const tithi = panchang?.tithi?.name ?? panchang?.tithi;
  const nakshatra = panchang?.nakshatra?.name ?? panchang?.nakshatra;
  const lucky = LUCKY[sign.planet] || LUCKY.Sun;

  return {
    sign,
    weekday,
    dateStr: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    moonSignNow,
    tithi,
    nakshatra,
    lucky,
    career: THEMES.career[signId],
    love: THEMES.love[signId],
    health: THEMES.health[signId],
    snippetEn: `Today the Moon transits ${moonSignNow} with ${tithi} tithi in ${nakshatra} nakshatra. For ${sign.en}: ${THEMES.career[signId]}.`,
    snippetHi: `आज चन्द्रमा ${moonSignNow} राशि में हैं, ${tithi} तिथि एवं ${nakshatra} नक्षत्र। ${sign.hi} राशि: ${THEMES.career[signId]}.`,
  };
}
