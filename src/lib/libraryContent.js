/**
 * CosmicTantra — Vedic Library (structured, E-E-A-T-first content).
 * Each article: slug, title, excerpt, category, sections, toolLinks.
 * Content is original, computed-fact-first (dates/times via engines where noted).
 */

export const LIBRARY = [
  {
    slug: 'lahiri-ayanamsha',
    title: 'What is Lahiri Ayanamsha? Sidereal vs Tropical in Vedic Astrology',
    excerpt: 'Why Indian astrology uses the sidereal zodiac, what the ayanamsha correction is, and how Chitra Paksha (Lahiri) is computed.',
    category: 'Vedic Science',
    sections: [
      { heading: 'The problem the ayanamsha solves', body: 'The Sun does not return to the same fixed star on the same tropical date. Over centuries, the equinox drifts against the backdrop of the nakshatras — roughly 50.3 arc-seconds per year. Tropical (Western) astrology ignores this drift; sidereal (Vedic) astrology subtracts it. The correction angle is the ayanamsha.' },
      { heading: 'Why Lahiri / Chitra Paksha?', body: "Chitra Paksha sets the ayanamsha so the bright star Spica (Chitra) sits exactly at 0° of Tula rashi — a standard recommended by Indian astronomical treatises and used by most panchangas. Lahiri's value is a smooth polynomial fit that stays within about ±0.01° of the classical value across 1900–2100." },
      { heading: 'What it changes in your chart', body: 'Because the ayanamsha in 2026 is about 24.2°, roughly 80% of charts have every planet shift by at least one nakshatra compared with a tropical calculation — and nearly half change Lagna. That is why the same birth data can produce "different" charts on different sites; the difference is almost always the ayanamsha, not the maths.' },
    ],
    toolLinks: [{ label: 'Compute your sidereal chart', href: '/#kundali-section' }],
  },
  {
    slug: 'vimshottari-dasha',
    title: 'Vimshottari Dasha Explained — Mahadasha, Antardasha, Pratyantardasha',
    excerpt: 'The 120-year planetary period system used to time life events, computed from the Moon\'s natal nakshatra.',
    category: 'Vedic Science',
    sections: [
      { heading: 'The 120-year cycle', body: 'Vimshottari divides 120 years among nine grahas: Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17. The cycle starts at birth from the lord of the Moon\'s nakshatra, for the balance of that nakshatra\'s span remaining at birth.' },
      { heading: 'Three tiers of timing', body: 'A Mahadasha (major period) is divided proportionally into Antardashas (sub-periods), and each Antardasha further into Pratyantardashas. CosmicTantra computes all three tiers from the exact natal Moon longitude — the same dates must reproduce for identical input (our calculation invariants enforce this).' },
      { heading: 'What a dasha reading is and is not', body: 'Dasha is timing context: which planetary flavor colours a period. It does not by itself predict events — interpretation requires the chart\'s strengths, transits and the practitioner\'s judgement. This is exactly why our reports separate the deterministic calculation from the human interpretation.' },
    ],
    toolLinks: [{ label: 'See your Dasha timeline', href: '/#dasha-section' }],
  },
  {
    slug: 'nakshatras-27',
    title: 'The 27 Nakshatras — Moon Mansions of Vedic Astrology',
    excerpt: 'Each nakshatra is a 13°20\' lunar mansion with a deity, symbol and ruler. Know the 27 stars, their padas, and what your Janma Nakshatra says.',
    category: 'Vedic Science',
    sections: [
      { heading: 'The lunar mansions', body: 'The zodiac is divided into 27 nakshatras of 13°20\' each (4 padas of 3°20\'). The Moon spends roughly one nakshatra per day, which is why the birth star is usually the Moon\'s position at birth — your Janma Nakshatra.' },
      { heading: 'Rulers & deities', body: 'Each nakshatra is ruled by a graha (Ashwini–Ketu, Bharani–Venus, ... Revati–Mercury) and a deity (Ashwini Kumaras, Yama, Agni, ... Pushan). The ruler drives Vimshottari dasha; the deity shapes the star\'s symbolism.' },
      { heading: 'Naming by nakshatra', body: 'Namakshara — the first syllable of a child\'s name — is prescribed by the Janma Nakshatra. Try our Baby Name Finder for syllable-correct suggestions.' },
    ],
    toolLinks: [{ label: 'Baby names by nakshatra', href: '/numerology/baby-names' }],
  },
  {
    slug: 'rahu-kaal',
    title: 'Rahu Kaal, Yamaganda & Abhijit — the daily avoid/act windows',
    excerpt: 'The eight-fold division of the day into hora-like segments, which segment belongs to Rahu each weekday, and the one window that is universally auspicious.',
    category: 'Panchang',
    sections: [
      { heading: 'The eight segments', body: 'The day from sunrise to sunset is divided into eight equal segments (about 1.5 hours each). Each weekday has a fixed order of planetary segments; Rahu\'s segment is Rahu Kaal, and its position rotates by weekday (Monday: 2nd, Tuesday: 7th, Wednesday: 5th, Thursday: 6th, Friday: 4th, Saturday: 3rd, Sunday: 8th).' },
      { heading: 'What to avoid', body: 'Traditional practice avoids beginning important work during Rahu Kaal, Yamaganda (Saturn\'s segment) and Gulika Kaal. Our personal calendar flags these automatically for your city and birth details.' },
      { heading: 'The universal good window', body: 'Abhijit Muhurat is the midline of the day (about 24 minutes of the 15th muhurta) and is considered universally auspicious regardless of weekday — the strongest general-purpose daytime window.' },
    ],
    toolLinks: [{ label: 'Today\'s windows for your city', href: '/panchang/patna' }],
  },
  {
    slug: 'mangal-dosh',
    title: 'Mangal Dosh — Mars in houses 1, 2, 4, 7, 8, 12 and classical mitigations',
    excerpt: 'What Mangal Dosh actually means, the criteria from Lagna and Moon, why it is not cancellation, and the classical mitigations used in marriage matching.',
    category: 'Relationships',
    sections: [
      { heading: 'The criteria', body: 'Mars in the 1st, 2nd, 4th, 7th, 8th or 12th house from either Lagna or Moon marks Mangal Dosh in classical matching. The dosha is considered stronger from Moon and weaker if Mars is in its own sign or exalted.' },
      { heading: 'Matching reality', body: 'Modern research and most traditional schools agree: the dosha is one factor of eight kootas and can be mitigated. Matching charts with equal dosha (both manglik) is often preferred — the dosha balances rather than adds.' },
      { heading: 'Our approach', body: 'The Kundali Milan tool computes dosha deterministically and reports it transparently; the scholar-verified review then applies lineage-specific rules and classical parihar rather than scare-selling remedies.' },
    ],
    toolLinks: [{ label: 'Run Kundali Milan', href: '/kundali-milan' }],
  },
  {
    slug: 'panchak-rikta',
    title: 'Panchak & Rikta Tithis — the calendar cautions Indians grew up with',
    excerpt: 'Why the Moon in the last five nakshatras suspends certain work, and why the 4th, 9th and 14th lunar days are called Rikta.',
    category: 'Panchang',
    sections: [
      { heading: 'Panchak', body: 'When the Moon transits Dhanishtha through Revati (the final five nakshatras), classical practice pauses house construction, roof work and certain travel. The five-day window repeats roughly every 27 days.' },
      { heading: 'Rikta tithis', body: 'The 4th (Chaturthi), 9th (Navami) and 14th (Chaturdashi) lunar days are called Rikta (empty) tithis. Traditional practice avoids property registration, big purchases and solemn beginnings on these days.' },
      { heading: 'Use them, don\'t fear them', body: 'These are timing cautions — not curses. They help you schedule, not avoid living. Our calendar shows them alongside the strong windows (Abhijit, Shubh Choghadiya) so you can plan around them.' },
    ],
    toolLinks: [{ label: 'Personal Vedic calendar', href: '/my-calendar' }],
  },
  {
    slug: 'kundli-milan-guide',
    title: 'Kundli Milan Guide — the 8 Kootas and what 36 points really mean',
    excerpt: 'Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi — what each koota scores and what a "18 out of 36" actually tells a couple.',
    category: 'Relationships',
    sections: [
      { heading: 'The eight kootas', body: 'Varna (1), Vashya (2), Tara (3), Yoni (4), Graha Maitri (5), Gana (6), Bhakoot (7) and Nadi (8) — 36 points total. Nadi and Bhakoot carry the heaviest weight in classical practice; a zero in Nadi is treated as a dosha deserving specialist review.' },
      { heading: 'What the score does not say', body: 'The score reflects Moon-based compatibility factors. It says nothing about the 10th-house career fit, Dasha timing of the marriage, or the couple\'s lived relationship — which is why a balanced score with dosha flags still benefits from scholarly interpretation.' },
      { heading: 'How we score', body: 'Our calculator uses the widely published classical pala tables (the same scoring used by mainstream panchanga platforms), computed deterministically from the sidereal engine, with every koota shown transparently.' },
    ],
    toolLinks: [{ label: 'Compute your Milan score', href: '/kundali-milan' }],
  },
  {
    slug: 'muhurat-shastra',
    title: 'Muhurat Shastra — why "a good date" is not a generic green tick',
    excerpt: 'Electional astrology: how Lagna auspiciousness, Vedha, tithi, nakshatra and the personal chart combine to make a real Muhurat.',
    category: 'Muhurat',
    sections: [
      { heading: 'Universal vs personal', body: 'A calendar\'s green tick is universal (good weekday, strong nakshatra, no Rikta tithi). A personal Muhurat adds your chart: Lagna of the moment, your Moon sign, house lords, and dasha-appropriate remedies.' },
      { heading: 'The classical checks', body: 'Lagna Shuddhi (a strong, unafflicted ascendant), avoidance of Vedha (planetary opposition to the Lagna lord), tithi/nakshatra quality and, for weddings, compatibility of both charts — the full package is what a jyotishi weighs.' },
      { heading: 'Built into our product', body: 'The Muhurat Discovery workspace shows universal windows; the ₹501 folio adds the personal chart alignment with a scholar\'s verification record.' },
    ],
    toolLinks: [{ label: 'Explore Muhurat Discovery', href: '/#muhurat-section' }],
  },
  {
    slug: 'kashi-deepawali',
    title: 'Dev Deepawali — the festival of a million diyas on Kashi\'s ghats',
    excerpt: 'Why Varanasi celebrates Kartik Purnima as Dev Deepawali, what happens on the 84 ghats, and the 2026 date and timing.',
    category: 'Kashi',
    sections: [
      { heading: 'The festival', body: 'On Kartik Purnima, Kashi commemorates the gods\' descent — Dev Deepawali. All 84 ghats glow with earthen lamps, and the Ganga aarti at Dashashwamedh becomes a panoramic ritual. It falls 15 days after Diwali.' },
      { heading: '2026 date', body: 'Kartika Shukla Purnima falls on 23 November 2026; the main Ganga Aarti at Dashashwamedh runs approximately 5:15 PM – 7:45 PM (exact times depend on sunset in Varanasi — check the Panchang page for the city).' },
      { heading: 'Visiting with intent', body: 'Arrive before sunset for the Sandhya Aarti band (the most potent ritual window of the day), use the Panchak avoidance rule for any travel planning, and consider a tour through Man Singh Observatory while in the city.' },
    ],
    toolLinks: [{ label: '2026 Vedic calendar', href: '/festivals/dev-deepawali' }, { label: 'Varanasi panchang', href: '/panchang/varanasi' }],
  },
];

export function getArticle(slug) {
  return LIBRARY.find(a => a.slug === slug) || null;
}
