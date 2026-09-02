/**
 * scholarHandover.ts — VIP Concierge handover packet (Kashi V3, Module 4).
 *
 * When a seeker asks to talk to a pandit, the human scholar must NOT restart
 * the conversation from zero. This module packages everything Kashi Sahayak
 * already knows — identity, birth data, computed Lagna/Rashi/Nakshatra/Dasha,
 * the transit snapshot, the seeker's own question — into a deterministic,
 * copy-pasteable ScholarHandoverPacket:
 *
 *   1. PacketId        — short, quotable, so WhatsApp chats can be matched
 *   2. Seeker profile  — name + birth date/time/city/geo, or explicit gaps
 *   3. Astro summary   — what the engine computed (never blank: "इन्टेक अधूरा")
 *   4. Transit context — the power/caution window message of the moment
 *   5. Question        — verbatim; the scholar answers THIS, nothing else
 *   6. Provenance note — engine name, generation time, verify-independently
 *
 * Pure and deterministic: same input + same clock ⇒ same packet. No I/O, no
 * LLM, no privacy leak beyond what the seeker themselves supplied.
 */

export interface ScholarHandoverSeekerInput {
  name?: string | null;
  birthDate?: string | null;
  birthTime?: string | null;
  birthCity?: string | null;
  lat?: number | string | null;
  lon?: number | string | null;
  question?: string | null;
}

export interface ScholarHandoverPulseInput {
  lagna?: string | null;
  nakshatra?: string | null;
  dasha?: string | null;
  transitStatus?: 'CAUTION_DAY' | 'POWER_DAY' | null;
  transitMessage?: string | null;
  recommendation?: string | null;
}

export interface ScholarHandoverPacket {
  /** Quotable id like `SH-20260903-1F9C` — stable across re-derivation. */
  packetId: string;
  generatedAtIso: string;
  /** Ordered sections; heading + bullet lines, both in Hindi. */
  sections: Array<{ heading: string; lines: string[] }>;
  /** Full packet as one WhatsApp-ready string (prefill / scholar paste). */
  whatsappText: string;
  /** Flat display lines for the concierge modal panel. */
  displayLines: string[];
}

const MISSING = 'इन्टेक अधूरा — कृपया साधक से पूछें';

const filled = (v?: string | number | null): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
};

/** Deterministic 4-hex suffix so two same-day packets never collide. */
const hashSuffix = (seed: string): string => {
  let h = 0x811c9dc5; // FNV-1a
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(-4);
};

/**
 * Build the handover packet. `now` is injectable for tests.
 */
export function buildScholarHandoverPacket(
  input: {
    seeker: ScholarHandoverSeekerInput;
    pulse?: ScholarHandoverPulseInput | null;
  },
  now: Date = new Date()
): ScholarHandoverPacket {
  const { seeker, pulse } = input;
  const generatedAtIso = now.toISOString();
  const day = generatedAtIso.slice(0, 10).replace(/-/g, '');
  const seed = [seeker.name, seeker.birthDate, seeker.birthTime, seeker.birthCity, seeker.question, day].join('|');
  const packetId = `SH-${day}-${hashSuffix(seed)}`;

  const name = filled(seeker.name) ?? 'साधक (नाम नहीं दिया)';
  const birthDate = filled(seeker.birthDate) ?? MISSING;
  const birthTime = filled(seeker.birthTime) ?? MISSING;
  const birthCity = filled(seeker.birthCity) ?? MISSING;
  const lat = filled(seeker.lat);
  const lon = filled(seeker.lon);
  const geo = lat && lon ? `अक्षांश ${lat}, देशांतर ${lon}` : 'जियो-निर्देशांक उपलब्ध नहीं';
  const question = filled(seeker.question) ?? MISSING;

  const lagna = filled(pulse?.lagna) ?? MISSING;
  const nakshatra = filled(pulse?.nakshatra) ?? MISSING;
  const dasha = filled(pulse?.dasha) ?? MISSING;
  const transitStatus = pulse?.transitStatus === 'CAUTION_DAY' ? 'सतर्कता दिवस (Caution Window)'
    : pulse?.transitStatus === 'POWER_DAY' ? 'शुभ सिद्धि योग (Power Window)'
    : 'गोचर स्थिति संगणित नहीं';
  const transitMessage = filled(pulse?.transitMessage) ?? '—';
  const recommendation = filled(pulse?.recommendation) ?? '—';

  const sections: ScholarHandoverPacket['sections'] = [
    {
      heading: '१. साधक परिचय',
      lines: [`नाम: ${name}`, `जन्म तिथि: ${birthDate}`, `जन्म समय: ${birthTime}`, `जन्म स्थान: ${birthCity}`, geo],
    },
    {
      heading: '२. खगोलीय सारांश (इंजन-संगणित)',
      lines: [`लग्न: ${lagna}`, `चन्द्र नक्षत्र: ${nakshatra}`, `विंशोत्तरी दशा: ${dasha}`],
    },
    {
      heading: '३. आज का गोचर संदर्भ',
      lines: [`स्थिति: ${transitStatus}`, transitMessage],
    },
    {
      heading: '४. साधक का प्रश्न',
      lines: [question],
    },
    {
      heading: '५. सहायक की सिफारिश',
      lines: [recommendation],
    },
    {
      heading: '६. स्रोत व प्रमाणन',
      lines: [
        'पैकेट आईडी: ' + packetId,
        'जनन समय (IST): ' + new Date(now.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' '),
        'गणना इंजन: Lahiri Ayanamsha • CosmicTantra Natal Engine • काशी सहायक (नियतात्मक, बिना LLM)',
        'पंडित जी कृपया सत्यापन करें: जन्म विवरण साधक द्वारा स्वयं दिए गए हैं; आवश्यक हो तो कुण्डली PDF माँगें।',
      ],
    },
  ];

  const displayLines: string[] = [];
  for (const section of sections) {
    displayLines.push(section.heading);
    for (const line of section.lines) displayLines.push(`• ${line}`);
  }

  const whatsappText = [
    `🕉️ काशी सहायक — विद्वान् हस्तान्तरण पैकेट ${packetId}`,
    ...sections.flatMap((s) => ['', s.heading, ...s.lines.map((l) => `• ${l}`)]),
    '',
    'भुगतान: ₹501 (आधिकारिक लिंक पर ही) • कॉल/WhatsApp: +91 99729 34937',
  ].join('\n');

  return { packetId, generatedAtIso, sections, whatsappText, displayLines };
}
