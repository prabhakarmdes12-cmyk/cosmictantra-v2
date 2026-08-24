/**
 * CosmicTantra — Ank Jyotish (Vedic Numerology) Engine
 * Chaldean + Pythagorean letter tables, Mulank / Bhagyank / Namank,
 * mobile-number analysis, ruling planets and meanings.
 * All computations are deterministic (pure functions).
 */

// Chaldean (Vedic) — sound vibration mapping, 1-8 (9 is sacred, unassigned)
export const CHALDEAN = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1, J: 1, K: 2, L: 3, M: 4,
  N: 5, O: 7, P: 8, Q: 1, R: 2, S: 3, T: 4, U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7,
};

// Pythagorean (Western) — sequential alphabet mapping
export const PYTHAGOREAN = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 1, K: 2, L: 3, M: 4,
  N: 5, O: 6, P: 7, Q: 8, R: 9, S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

export const PLANET_OF_NUMBER = {
  1: 'Sun (Surya)',
  2: 'Moon (Chandra)',
  3: 'Jupiter (Guru)',
  4: 'Rahu',
  5: 'Mercury (Budha)',
  6: 'Venus (Shukra)',
  7: 'Ketu',
  8: 'Saturn (Shani)',
  9: 'Mars (Mangal)',
  11: 'Sun (Master Number)',
  22: 'Moon (Master Number)',
  33: 'Jupiter (Master Number)',
};

export const NUMBER_MEANINGS = {
  1: {
    traits: 'Leader, pioneer, independent, ambitious, authoritative.',
    advice: 'Take initiative; avoid stubbornness. Best days: Sunday. Color: Gold, Red. Lucky number: 1, 10, 19, 28.',
    business: 'Brands that lead, innovate and command premium pricing. Best for founders with strong Sun placement.',
  },
  2: {
    traits: 'Diplomatic, intuitive, patient, cooperative, emotionally intelligent.',
    advice: 'Partnerships flourish; avoid indecision. Best days: Monday. Color: White, Silver. Lucky number: 2, 11, 20, 29.',
    business: 'Service, consulting, hospitality and partnership-driven brands. Steady, relationship-led growth.',
  },
  3: {
    traits: 'Creative, expressive, optimistic, communicative, fortunate.',
    advice: 'Express ideas boldly; avoid scattering energy. Best days: Thursday. Color: Yellow. Lucky number: 3, 12, 21, 30.',
    business: 'Media, creative, education and entertainment brands with strong Jupiter energy.',
  },
  4: {
    traits: 'Disciplined, systematic, loyal, builder of foundations.',
    advice: 'Structure creates security; avoid rigidity. Best days: Wednesday/Saturday. Color: Grey, Blue. Lucky number: 4, 13, 22, 31.',
    business: 'Real estate, engineering, manufacturing — brands built on systems and trust.',
  },
  5: {
    traits: 'Versatile, magnetic, communicative, freedom-loving, adventurous.',
    advice: 'Embrace change; avoid restlessness. Best days: Wednesday. Color: Green. Lucky number: 5, 14, 23.',
    business: 'Trade, travel, marketing and dynamic consumer brands that move fast.',
  },
  6: {
    traits: 'Nurturing, responsible, artistic, family-oriented, harmonious.',
    advice: 'Serve and beautify; avoid over-burdening self. Best days: Friday. Color: Pink, White. Lucky number: 6, 15, 24, 33.',
    business: 'Luxury, beauty, jewellery, healthcare and community brands driven by Venus.',
  },
  7: {
    traits: 'Mystical, analytical, spiritual, research-oriented, intuitive.',
    advice: 'Deep study rewards; avoid isolation. Best days: Saturday. Color: Multi/Peacock. Lucky number: 7, 16, 25.',
    business: 'Research, astrology, technology, spiritual services — niche authority brands.',
  },
  8: {
    traits: 'Powerful, material, executive, karmic, resilient.',
    advice: 'Balance power with patience; avoid over-control. Best days: Saturday. Color: Dark Blue, Black. Lucky number: 8, 17, 26.',
    business: 'Finance, real estate, large-scale enterprise — Saturn-ruled endurance brands.',
  },
  9: {
    traits: 'Humanitarian, compassionate, visionary, completion-bringer.',
    advice: 'Lead with heart; avoid burnout. Best days: Tuesday. Color: Red, Crimson. Lucky number: 9, 18, 27.',
    business: 'NGO, pharma, global and humanitarian brands under Mars.',
  },
  11: {
    traits: 'Master Number — visionary, inspirational, high intuition, spiritual teacher.',
    advice: 'Channel insight into service; avoid nervous tension.',
    business: 'Spiritual, healing and illumination-driven brands with rare vision.',
  },
  22: {
    traits: 'Master Number — master builder, practical visionary who manifests large structures.',
    advice: 'Think big, build step by step; avoid overwhelm.',
    business: 'Large-scale infrastructure and institution-building ventures.',
  },
  33: {
    traits: 'Master Number — master teacher, selfless service, healing and guidance.',
    advice: 'Serve without expectation; protect your own energy.',
    business: 'Education, healing communities and charitable enterprises.',
  },
};

export const MASTER_NUMBERS = [11, 22, 33];

/**
 * Digit-sum reduction to a single root number (1-9), except master numbers.
 */
export function reduceNumber(n) {
  let v = Math.abs(Math.floor(n));
  while (v > 9 && !MASTER_NUMBERS.includes(v)) {
    v = String(v).split('').reduce((acc, d) => acc + Number(d), 0);
  }
  return v;
}

export function letterValueMap(system = 'chaldean') {
  return system === 'pythagorean' ? PYTHAGOREAN : CHALDEAN;
}

export function nameNumber(name, system = 'chaldean') {
  const map = letterValueMap(system);
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '').split('');
  const total = letters.reduce((acc, ch) => acc + (map[ch] || 0), 0);
  const number = reduceNumber(total);
  return {
    total,
    number,
    isMaster: MASTER_NUMBERS.includes(total),
    planet: PLANET_OF_NUMBER[number] || PLANET_OF_NUMBER[total],
    meaning: NUMBER_MEANINGS[number] || NUMBER_MEANINGS[((number - 1) % 9) + 1],
    lettersCount: letters.length,
  };
}

export function mulank(birthDay) {
  const number = reduceNumber(birthDay);
  return { number, planet: PLANET_OF_NUMBER[number], meaning: NUMBER_MEANINGS[number] };
}

export function bhagyank(birthDate) {
  const digits = birthDate.replace(/[^0-9]/g, '').split('').map(Number);
  const total = digits.reduce((a, b) => a + b, 0);
  const number = reduceNumber(total);
  return { number, total, planet: PLANET_OF_NUMBER[number], meaning: NUMBER_MEANINGS[number] };
}

/**
 * Mobile number numerology — strips country code (91 / +91) then digit-sums.
 * Also surfaces the "final digit" trend used in Indian numerology practice.
 */
export function mobileNumber(mobile) {
  let digits = mobile.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  const total = digits.split('').reduce((a, b) => a + Number(b), 0);
  const number = reduceNumber(total);
  const lastDigit = Number(digits.slice(-1));
  return {
    digits,
    total,
    number,
    lastDigit,
    lastDigitPlanet: PLANET_OF_NUMBER[lastDigit],
    planet: PLANET_OF_NUMBER[number],
    meaning: NUMBER_MEANINGS[number],
  };
}

/**
 * Name ↔ destiny harmony check (Namank vs Bhagyank vs Mulank).
 * Returns a simple 0-100 harmony score and a plain-language verdict.
 */
export function nameHarmony(name, birthDate, system = 'chaldean') {
  const namank = nameNumber(name, system).number;
  const m = mulank(new Date(birthDate).getDate());
  const b = bhagyank(birthDate);
  const score = (n) => {
    if (n === namank) return 100;
    if (Math.abs(n - namank) === 1 || n + namank === 11 || n + namank === 10) return 70;
    if ([5, 9].includes(n) && [5, 9].includes(namank)) return 85;
    return 40;
  };
  const mulankScore = score(m.number);
  const bhagyankScore = score(b.number);
  const harmony = Math.round((mulankScore + bhagyankScore) / 2);
  return {
    namank,
    mulank: m.number,
    bhagyank: b.number,
    harmony,
    verdict:
      harmony >= 75
        ? 'Strong alignment — the name supports the birth destiny.'
        : harmony >= 50
          ? 'Moderate alignment — minor spelling adjustments can raise harmony.'
          : 'Weak alignment — consider name-name correction consultation for remedies.',
  };
}

export const NUMEROLOGY_SYSTEMS = [
  { id: 'chaldean', name: 'Chaldean (Vedic)', note: 'Sound-vibration mapping, preferred in India' },
  { id: 'pythagorean', name: 'Pythagorean', note: 'Sequential alphabet mapping (Western)' },
];
