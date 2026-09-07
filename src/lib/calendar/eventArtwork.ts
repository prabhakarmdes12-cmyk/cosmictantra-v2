/**
 * FESTIVAL ARTWORK ASSET PIPELINE
 * -----------------------------------------------------------------------------
 * Maps event IDs from docs/EVENT_IMAGE_MANIFEST.json to 16:9 artwork stored
 * under /public/assets/calendar/events/.
 *
 * Guarantees:
 *  - Zero hardcoded dates — this module only maps EVENT IDENTITY to ASSETS.
 *  - Every major festival (Ganesh Chaturthi, Navratri, Durga Ashtami,
 *    Dussehra, Diwali, Mahashivaratri, Chhath Puja, Sharad Purnima, …)
 *    resolves to a 16:9 artwork for day cells and detail cards.
 *  - Category fallback images guarantee a visual for minor vrats too.
 *  - Consumers must render a graceful gradient fallback if an asset is absent
 *    (next/onError) — the pipeline never blocks rendering on a missing file.
 */

import rawManifest from '../../../docs/EVENT_IMAGE_MANIFEST.json';

export interface EventArtwork {
  id: string;
  nameHi: string;
  nameEn: string;
  category: string;
  imagePath: string;
  generationPrompt: string;
  isMajor: boolean;
}

interface TithiArtworkEntry {
  tithi: number; // position within paksha, 1-15 (15 = Purnima in Shukla, Amavasya in Krishna)
  paksha?: 'Shukla' | 'Krishna'; // disambiguates position 15
  nameHi: string;
  nameEn: string;
  imagePath: string;
  generationPrompt: string;
}

interface ManifestShape {
  basePath: string;
  aspectRatio: string;
  categories: Record<string, { fallbackImage: string; promptPrefix: string }>;
  events: Array<{
    id: string;
    nameHi: string;
    nameEn: string;
    category: string;
    imagePath: string;
    generationPrompt: string;
    isMajor: boolean;
  }>;
  tithiArtwork?: TithiArtworkEntry[];
}

const MANIFEST = rawManifest as unknown as ManifestShape;

/** All artwork assets declared in the manifest. */
export const EVENT_ARTWORKS: EventArtwork[] = MANIFEST.events;

/** Category → fallback image path (16:9). */
export const CATEGORY_FALLBACKS: Record<string, string> = Object.fromEntries(
  Object.entries(MANIFEST.categories).map(([key, value]) => [
    key,
    MANIFEST.basePath + value.fallbackImage,
  ])
);

const ARTWORK_BY_ID: Record<string, EventArtwork> = Object.fromEntries(
  EVENT_ARTWORKS.map((a) => [a.id, a])
);

/**
 * Ordered token table — first match wins, so festival-specific tokens are
 * listed before generic tithi tokens (e.g. गणेश before एकादशी).
 * Entries may resolve to a manifest event OR directly to a tithi artwork
 * (generic Purnima/Amavasya observances emitted by the engine every month).
 */
type ArtworkTokenEntry = {
  tokens: string[];
  eventId?: string;
  tithi?: { pos: number; paksha?: 'Shukla' | 'Krishna' };
};

const ARTWORK_TOKENS: ArtworkTokenEntry[] = [
  // Navavarsh BEFORE navratri-start ('चैत्र नवरात्रि' contains नवरात्रि)
  { tokens: ['नववर्ष', 'navavarsh', 'nav varsh', 'hindu new year', 'चैत्र नवरात्रि'], eventId: 'navavarsh' },
  { tokens: ['होली', 'होलिका', 'holi'], eventId: 'holi' },
  { tokens: ['रामनवमी', 'ram navami', 'ramnavami'], eventId: 'ram-navami' },
  { tokens: ['हनुमान', 'hanuman'], eventId: 'hanuman-jayanti' },
  { tokens: ['नाग', 'nag panchami'], eventId: 'nag-panchami' },
  { tokens: ['धनतेरस', 'dhanteras', 'धन्वंतरी', 'dhanvantari'], eventId: 'dhanteras' },
  { tokens: ['गोवर्धन', 'अन्नकोट', 'annakut', 'govardhan'], eventId: 'annakut' },
  { tokens: ['भाई दूज', 'bhai dooj', 'bhai doodh', 'यमद्वितीया'], eventId: 'bhai-dooj' },
  // Dev Deepawali BEFORE diwali ('देव दीपावली' contains दीपावली)
  { tokens: ['देव दीपावली', 'dev deepawali', 'dev deepavali', 'कृष्ण पूर्णिमा'], eventId: 'dev-deepawali' },
  { tokens: ['बसंत', 'सरस्वती', 'saraswati'], eventId: 'vasant-panchami' },
  { tokens: ['गणेश', 'विनायक', 'ganesh', 'vinayaka', 'chaturthi', 'अनन्त', 'anant', 'संकष्टी', 'sankashti'], eventId: 'ganesh-chaturthi' },
  { tokens: ['जन्माष्टमी', 'जन्माष्ट', 'janmashtami', 'janmastami'], eventId: 'janmashtami' },
  { tokens: ['नवरात्रि', 'घटस्थापना', 'navratri', 'navaratri', 'ghatasthapana'], eventId: 'navratri-start' },
  { tokens: ['दुर्गा', 'महाष्टमी', 'महानवमी', 'durga', 'maha ashtami', 'ashtami', 'ayudha'], eventId: 'durga-ashtami' },
  { tokens: ['विजयादशमी', 'दशहरा', 'vijayadashami', 'dussehra'], eventId: 'vijayadashami' },
  { tokens: ['दीपावली', 'diwali', 'लक्ष्मी पूजा', 'नरक', 'chhoti diwali'], eventId: 'diwali' },
  { tokens: ['छठ', 'chhath'], eventId: 'chhath-puja' },
  { tokens: ['महाशिवरात्रि', 'mahashivaratri'], eventId: 'mahashivaratri' },
  { tokens: ['शरद पूर्णिमा', 'शरदपूरणिमा', 'kojagari', 'कोजागरि', 'sharad purnima'], eventId: 'sharad-purnima' },
  { tokens: ['करवा', 'karwa'], eventId: 'karwa-chauth' },
  { tokens: ['रक्षा', 'raksha'], eventId: 'raksha-bandhan' },
  { tokens: ['गुरु पूर्णिमा', 'गुरुपूरणिमा', 'guru purnima', 'gurupurnima'], eventId: 'guru-purnima' },
  { tokens: ['संक्रांति', 'sankranti'], eventId: 'makar-sankranti' },
  { tokens: ['प्रदोष', 'प्रदोष व्रत', 'pradosh'], eventId: 'pradosh-vrat' },
  { tokens: ['एकादशी', 'ekadashi', 'एकादशि'], eventId: 'ekadashi-generic' },
  // Generic tithi observances emitted by the engine every month — resolve
  // directly to the tithi artwork layer (LAST so specific festivals win).
  { tokens: ['पूर्णिमा', 'purnima'], tithi: { pos: 15, paksha: 'Shukla' } },
  { tokens: ['अमावस्या', 'amavasya'], tithi: { pos: 15, paksha: 'Krishna' } },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Resolves the 16:9 artwork for a festival/vrat named by the panchang engine
 * (e.g. from resolveFestivals). Returns null when no artwork matches — the
 * caller then falls back to a category image or a neutral gradient.
 */
export function getArtworkForFestival(nameHi: string, nameEn?: string): EventArtwork | null {
  const haystack = normalize(`${nameHi} ${nameEn || ''}`);
  if (!haystack) return null;
  for (const entry of ARTWORK_TOKENS) {
    if (!entry.tokens.some((token) => haystack.includes(token))) continue;
    if (entry.eventId) {
      const artwork = ARTWORK_BY_ID[entry.eventId];
      if (artwork) return artwork;
    }
    if (entry.tithi) {
      const index = entry.tithi.paksha === 'Krishna' ? 15 + entry.tithi.pos : entry.tithi.pos;
      const tithiArt = getTithiArtwork({
        index,
        paksha: entry.tithi.paksha === 'Krishna' ? 'Krishna Paksha' : 'Shukla Paksha',
      });
      if (tithiArt) return tithiArt;
    }
  }
  return null;
}

export function getArtworkByEventId(eventId: string): EventArtwork | null {
  return ARTWORK_BY_ID[eventId] || null;
}

/**
 * Chooses the best artwork for a day that may carry multiple observances:
 * prefer isMajor manifests, then the first festival in engine order.
 */
export function pickArtworkForFestivals(
  festivals: Array<{ name: string; nameHi: string; isImportant?: boolean }>
): EventArtwork | null {
  if (!festivals || festivals.length === 0) return null;
  for (const f of festivals) {
    if (!f.isImportant) continue;
    const artwork = getArtworkForFestival(f.nameHi, f.name);
    if (artwork && artwork.isMajor) return artwork;
  }
  for (const f of festivals) {
    const artwork = getArtworkForFestival(f.nameHi, f.name);
    if (artwork) return artwork;
  }
  return null;
}

/** All tithi artwork declared in the manifest (16 entries over 15 paksha positions). */
export const TITHI_ARTWORKS: TithiArtworkEntry[] = MANIFEST.tithiArtwork || [];

/**
 * TITHI ARTWORK LAYER — the strategic moat vs traditional calendars.
 * Resolves a 16:9 artwork for ANY tithi (Pratipada → Amavasya), so that every
 * single day of the month carries a dignified visual, festival or not.
 *
 * Engine convention: day.tithi.index is 1-30 (1-15 Shukla, 16-30 Krishna);
 * position-within-paksha = ((index - 1) % 15) + 1. Position 15 disambiguates
 * via paksha: Shukla → Purnima artwork, Krishna → Amavasya artwork.
 */
export function getTithiArtwork(tithi: { index: number; paksha?: string }): EventArtwork | null {
  const pos = ((tithi.index - 1) % 15) + 1; // 1-15
  const isShukla = tithi.paksha !== 'Krishna Paksha';
  const entry = TITHI_ARTWORKS.find((e) => {
    if (e.tithi !== pos) return false;
    if (pos === 15) return (e.paksha || 'Shukla') === (isShukla ? 'Shukla' : 'Krishna');
    return true;
  });
  if (!entry) return null;
  return {
    id: `tithi-${entry.tithi}-${entry.paksha || 'shared'}`,
    nameHi: entry.nameHi,
    nameEn: entry.nameEn,
    category: 'TITHI',
    imagePath: entry.imagePath,
    generationPrompt: entry.generationPrompt,
    isMajor: false,
  };
}

/**
 * FULL DAY ARTWORK CHAIN (used by month cells, list rows, day detail hero):
 *   1. Major festival artwork (isMajor, engine order)
 *   2. Any festival artwork
 *   3. Tithi artwork (guarantees a visual for every day)
 *   4. null — caller renders the neutral gradient
 */
export function pickDayArtwork(day: {
  festivals: Array<{ name: string; nameHi: string; isImportant?: boolean }>;
  tithi: { index: number; paksha?: string };
}): EventArtwork | null {
  const festivalArt = pickArtworkForFestivals(day.festivals);
  if (festivalArt) return festivalArt;
  return getTithiArtwork(day.tithi);
}
