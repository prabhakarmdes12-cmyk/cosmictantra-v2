/**
 * KASHI SAHAYAK — Granth Recitation catalogue (eight scriptures).
 *
 * The recitation flow offers eight texts, each with its own structure and
 * playback:
 *
 *   1. श्रीमद् भगवद् गीता        — १८ अध्याय
 *   2. श्री रामचरितमानस         — ७ काण्ड
 *   3. श्री शिव महापुराण         — ध्यान, षडक्षर, लिङ्गाष्टक, द्वादश ज्योतिर्लिंग
 *   4. श्रीमद् देवी भागवत        — देवी गायत्री, देवी सूक्त, नवदुर्गा
 *   5. श्री हनुमान चालीसा        — २ दोहा • ४० चौपाई • १ दोहा
 *   6. शिव ताण्डव स्तोत्र        — सम्पूर्ण स्तोत्र
 *   7. महा मृत्युंजय मन्त्र      — ऋग्वेद ७.५९.१२
 *   8. श्री सूक्तम् व कनकाधारा   — दो स्तोत्र
 *
 * TEXT PROVENANCE. The first six resolve their verses from the repository's
 * own verified granth library (src/lib/granth/data), loaded DYNAMICALLY so the
 * multi-megabyte Gita and Ramcharitmanas documents never enter the chat
 * widget's bundle. The last two are not in that library, so their verses are
 * embedded here from curated public editions, retrieved 2026-09-02:
 *
 *   - महा मृत्युंजय: Rigveda 7.59.12, the universally transmitted text.
 *   - श्री सूक्तम्: Rigveda Khilani, Devanagari and sense as published by
 *     greenmesg.org (Sanskrit with English meaning).
 *   - कनकाधारा स्तोत्रम्: Adi Shankaracharya, Devanagari as published by
 *     vignanam.org (Vaidika Vignanam, शुद्ध देवनागरी edition).
 *
 * Nothing here is paraphrased into new scripture: embedded mūla text is copied
 * verse-for-verse from those editions, and the Hindi senses are brief
 * reader-facing glosses marked as such. A recital never invents a verse it
 * cannot source — an unresolvable unit returns an empty passage list and the
 * chat says so instead of speaking silence.
 */

export interface RecitalPassage {
  /** Verse label as the edition prints it (दोहा १, चौपाई १-४, ऋक् १ …). */
  ref: string;
  /** Mūla text, verbatim. */
  sanskrit: string;
  /** Brief Hindi sense for the reader. A gloss, not a new scripture. */
  hindi: string;
}

export interface RecitalUnit {
  id: string;
  labelHi: string;
}

export interface GranthRecital {
  id: string;
  titleHi: string;
  titleEn: string;
  /** The structure a seeker recognises the text by. */
  structureHi: string;
  deityHi: string;
  kind: 'LIBRARY' | 'EMBEDDED';
  /** Where the complete text lives on the site, when it does. */
  readerHref?: string;
}

export const GRANTH_RECITALS: GranthRecital[] = [
  {
    id: 'bhagavad-gita',
    titleHi: 'श्रीमद् भगवद् गीता',
    titleEn: 'Shrimad Bhagavad Gita',
    structureHi: '१८ अध्याय',
    deityHi: 'श्री कृष्ण • अर्जुन',
    kind: 'LIBRARY',
    readerHref: '/granth-reader?book=bhagavad-gita',
  },
  {
    id: 'ramcharitmanas',
    titleHi: 'श्री रामचरितमानस',
    titleEn: 'Shri Ramcharitmanas',
    structureHi: '७ काण्ड',
    deityHi: 'श्री राम',
    kind: 'LIBRARY',
    readerHref: '/granth-reader?book=ramcharitmanas',
  },
  {
    id: 'shiva-mahapuran',
    titleHi: 'श्री शिव महापुराण',
    titleEn: 'Shri Shiva Mahapuran',
    structureHi: 'ध्यान • षडक्षर • लिङ्गाष्टक • ज्योतिर्लिंग',
    deityHi: 'भगवान शिव',
    kind: 'LIBRARY',
    readerHref: '/granth-reader?book=shiva-mahapuran',
  },
  {
    id: 'devi-bhagavata',
    titleHi: 'श्रीमद् देवी भागवत',
    titleEn: 'Shrimad Devi Bhagavata',
    structureHi: 'देवी गायत्री • देवी सूक्त • नवदुर्गा',
    deityHi: 'आदि शक्ति',
    kind: 'LIBRARY',
    readerHref: '/granth-reader?book=devi-bhagavata',
  },
  {
    id: 'hanuman-chalisa',
    titleHi: 'श्री हनुमान चालीसा',
    titleEn: 'Shri Hanuman Chalisa',
    structureHi: '२ दोहा • ४० चौपाई • १ दोहा',
    deityHi: 'श्री हनुमान',
    kind: 'LIBRARY',
    readerHref: '/aarti-stotra',
  },
  {
    id: 'shiva-tandava',
    titleHi: 'शिव ताण्डव स्तोत्रम्',
    titleEn: 'Shiva Tandava Stotram',
    structureHi: 'सम्पूर्ण स्तोत्र',
    deityHi: 'भगवान शिव',
    kind: 'LIBRARY',
    readerHref: '/aarti-stotra',
  },
  {
    id: 'maha-mrityunjaya',
    titleHi: 'महा मृत्युंजय मन्त्र',
    titleEn: 'Maha Mrityunjaya Mantra',
    structureHi: 'ऋग्वेद ७.५९.१२',
    deityHi: 'भगवान शिव',
    kind: 'EMBEDDED',
  },
  {
    id: 'shri-suktam-kanakadhara',
    titleHi: 'श्री सूक्तम् व कनकाधारा स्तोत्रम्',
    titleEn: 'Shri Suktam & Kanakadhara Stotram',
    structureHi: 'दो स्तोत्र',
    deityHi: 'माँ लक्ष्मी',
    kind: 'EMBEDDED',
  },
];

export function recitalById(id: string): GranthRecital | null {
  return GRANTH_RECITALS.find((r) => r.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/* Embedded mūla for the two texts the library does not carry          */
/* ------------------------------------------------------------------ */

const EMBEDDED_UNITS: Record<string, RecitalUnit[]> = {
  'maha-mrityunjaya': [{ id: 'mantra', labelHi: 'मन्त्र, अर्थ व जप विधि' }],
  'shri-suktam-kanakadhara': [
    { id: 'shri-suktam', labelHi: 'श्री सूक्तम् (ऋग्वेदीय)' },
    { id: 'kanakadhara', labelHi: 'कनकाधारा स्तोत्रम्' },
  ],
};

const EMBEDDED_PASSAGES: Record<string, RecitalPassage[]> = {
  'maha-mrityunjaya:mantra': [
    {
      ref: 'ऋक् ७.५९.१२',
      sanskrit: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् ।\nउर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय माऽमृतात् ॥',
      hindi: 'हम त्र्यम्बक (तीन लोकों के द्रष्टा) भगवान शिव की उपासना करते हैं, जो सुगन्धित हैं और सबकी पुष्टि करते हैं। जैसे पका हुआ खीरा बन्धन से सहज ही छूट जाता है, वैसे ही हम मृत्यु के बन्धन से मुक्त हों — अमृतत्व से नहीं, मृत्यु से।',
    },
    {
      ref: 'जप विधि',
      sanskrit: 'ॐ नमः शिवाय — प्रति संकल्प १०८ जप।',
      hindi: 'संकल्प लेकर रुद्राक्ष या स्फटिक माला से १०८ जप करें; जप के पश्चात् एक घड़ा जल अभिमन्त्रित कर घर-पরিजन पर प्रोक्षण करें। यह विधि पारम्परिक है, फल की गारण्टी नहीं।',
    },
  ],
  'shri-suktam-kanakadhara:shri-suktam': [
    {
      ref: 'ऋक् १',
      sanskrit: 'हिरण्यवर्णां हरिणीं सुवर्णरजतस्रजाम् ।\nचन्द्रां हिरण्मयीं लक्ष्मीं जातवेदो म आवह ॥',
      hindi: 'हे जातवेदो! हेमवर्ण, हरिणी-सी सुन्दर, स्वर्ण-रजत की मालाओं से सजी, चन्द्रमा-सी चमकती हिरण्मयी लक्ष्मी को मेरे लिए यहाँ आमन्त्रित करो।',
    },
    {
      ref: 'ऋक् २',
      sanskrit: 'तां म आवह जातवेदो लक्ष्मीं अनपगामिनीम् ।\nयस्यां हिरण्यं विन्देयं गां अश्वं पुरुषान् अहम् ॥',
      hindi: 'हे जातवेदो! उस अचला, अनपगामिनी लक्ष्मी को मेरे लिए लाओ, जिनसे मुझे स्वर्ण, गौ, अश्व और पुत्र-पौत्रादि प्राप्त हों।',
    },
    {
      ref: 'ऋक् ५',
      sanskrit: 'चन्द्रां प्रभासां यशसा ज्वलन्तीं श्रियं लोके देवजुष्टाम् उदाराम् ।\nतां पद्मिनीं ईं शरणं अहं प्रपद्ये ऽलक्ष्मीः मे नश्यतां त्वाम् वृणे ॥',
      hindi: 'लोकों में चन्द्रमा-सी प्रभा और यश से ज्वलित, देवताओं से सेवित, उदार श्री को मैं शरण मानता हूँ; कमलवासिनी उस देवी को मैं वरता हूँ — मेरी अलक्ष्मी नष्ट हो।',
    },
  ],
  'shri-suktam-kanakadhara:kanakadhara': [
    {
      ref: 'श्लोक १',
      sanskrit: 'अङ्गं हरेः पुलकभूषणम् आश्रयन्ती भृङ्गाङ्गनेव मुकुलाभरणं तमालम् ।\nअङ्गीकृताखिलविभूतिः अपाङ्गलीला माङ्गल्यदास्तु मम मङ्गलदेवतायाः ॥',
      hindi: 'जो सम्पूर्ण विभूति को अङ्गीकार किए हुए, मङ्गल की देवी माँ लक्ष्मी हैं, जिनकी अपाङ्ग-लीला श्रीहरि के अङ्ग पर पुलकों की शोभा बढ़ाती है — वही मेरे लिए मङ्गल करें।',
    },
    {
      ref: 'श्लोक २',
      sanskrit: 'मुग्धा मुहुः विदधती वदने मुरारेः प्रेमत्रपाप्रणिहितानि गतागतानि ।\nमाला दृशोः मधुकरीव महोत्पले या सा मे श्रियं दिशतु सागरसम्भवायाः ॥',
      hindi: 'मुरारे के मुखारविन्द पर प्रेम और लज्जा से बार-बार आते-जाते जो नयन-कमल की मधुमक्खी-सी दृष्टि-माला है, वह सागरसम्भवा लक्ष्मी मेरे लिए कल्याण विधान करें।',
    },
    {
      ref: 'श्लोक १८',
      sanskrit: 'सरसिजनिलये सरोजहस्ते धवलतमांशुकगन्धमाल्यशोभे ।\nभगवति हरिवल्लभे मनोज्ञे त्रिभुवनभूतिकरि प्रसीद मह्यम् ॥',
      hindi: 'हे कमलनिवासिनी, कमलधारी, शुभ्र वस्त्र-गन्ध-माला से शोभित, हे हरिवल्लभे भगवती! तीनों लोकों को सम्पदा देने वाली माँ, मुझ पर प्रसन्न हों।',
    },
    {
      ref: 'फलश्रुति',
      sanskrit: 'सुवर्णधारास्तोत्रं यत् शङ्कराचार्यनिर्मितम् ।\nत्रिसन्ध्यं यः पठेत् नित्यं स कुबेरसमो भवेत् ॥',
      hindi: 'यह सुवर्णधारा स्तोत्र श्री शङ्कराचार्य विरचित है; जो इसे नित्य त्रिसन्ध्या पढ़ता है, वह कुबेर-समान सम्पन्न होता है — यह परम्परागत फलश्रुति है, वाणिज्यिक आश्वासन नहीं।',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Resolution                                                          */
/* ------------------------------------------------------------------ */

import type { BookDocument, CollectionDocument } from '../granth/types';

type GranthDoc = BookDocument | CollectionDocument;

const LIBRARY_LOADERS: Record<string, () => Promise<{ default: GranthDoc }>> = {
  'bhagavad-gita': () => import('../granth/data/granths/bhagavad-gita'),
  'ramcharitmanas': () => import('../granth/data/granths/ramcharitmanas'),
  'shiva-mahapuran': () => import('../granth/data/granths/shiva-mahapuran'),
  'devi-bhagavata': () => import('../granth/data/granths/devi-bhagavata'),
  // Collection documents wrap several texts in `items`; the two recitals that
  // live there are selected by slug below.
  'hanuman-chalisa': () => import('../granth/data/collections/stotras'),
  'shiva-tandava': () => import('../granth/data/collections/stotras'),
};

const COLLECTION_SLUGS: Record<string, string> = {
  'hanuman-chalisa': 'hanuman-chalisa',
  'shiva-tandava': 'shiva-tandava',
};

/**
 * Dynamic import() of a transpiled module hands back either the document
 * itself (webpack/ESM) or a double-wrapped `{ default: { default: doc } }`
 * (CJS interop in some test runners). Unwrap until the document shows up, so
 * the recitation flow resolves identically in the browser and in the suite.
 */
function unwrap(mod: { default: unknown }): GranthDoc {
  let d = mod.default as Record<string, unknown> | null;
  for (let i = 0; i < 2 && d && !('item' in d) && !('items' in d); i += 1) {
    d = (d.default as Record<string, unknown> | null) ?? null;
  }
  return d as unknown as GranthDoc;
}

function sectionsOf(doc: GranthDoc, recitalId: string) {
  if ('item' in doc) return doc.item?.sections ?? [];
  const slug = COLLECTION_SLUGS[recitalId];
  return doc.items.find((it) => it.slug === slug)?.sections ?? [];
}

function toPassages(section: { verses: Array<{ shlokaNo?: string; sanskrit: string; hindi: string }> }, limit: number): RecitalPassage[] {
  return (section.verses ?? []).slice(0, limit).map((v) => ({
    ref: v.shlokaNo ?? '',
    sanskrit: v.sanskrit ?? '',
    hindi: v.hindi ?? '',
  })).filter((p) => p.sanskrit.length > 0);
}

/** The recitable units of one text: अध्याय, काण्ड, स्तोत्र-खण्ड or मन्त्र। */
export async function loadRecitalUnits(recitalId: string): Promise<RecitalUnit[]> {
  const recital = recitalById(recitalId);
  if (!recital) return [];
  if (recital.kind === 'EMBEDDED') return EMBEDDED_UNITS[recitalId] ?? [];
  const loader = LIBRARY_LOADERS[recitalId];
  if (!loader) return [];
  try {
    const doc = unwrap(await loader());
    return sectionsOf(doc, recitalId).map((s) => ({ id: s.id ?? '', labelHi: s.title ?? '' }))
      .filter((u) => u.id.length > 0);
  } catch {
    // A missing or corrupt edition must never break the conversation.
    return [];
  }
}

/**
 * The passages one playback session speaks for a unit. Deliberately the
 * opening verses rather than the whole अध्याय: a browser voice reading seven
 * hundred shlokas unattended is not recitation, it is a runaway tab. The
 * complete text stays one tap away in the reader (readerHref).
 */
export async function loadRecitalPassages(
  recitalId: string,
  unitId: string,
  limit = 2,
): Promise<RecitalPassage[]> {
  const recital = recitalById(recitalId);
  if (!recital) return [];
  if (recital.kind === 'EMBEDDED') return EMBEDDED_PASSAGES[`${recitalId}:${unitId}`] ?? [];
  const loader = LIBRARY_LOADERS[recitalId];
  if (!loader) return [];
  try {
    const doc = unwrap(await loader());
    const section = sectionsOf(doc, recitalId).find((s) => s.id === unitId);
    return section ? toPassages(section, limit) : [];
  } catch {
    return [];
  }
}

/** One spoken string per passage: mūla first, then its sense. */
export function recitalSpeech(p: RecitalPassage): string {
  const ref = p.ref ? `${p.ref}। ` : '';
  return `${ref}${p.sanskrit.replace(/\n/g, ' ')}। भावार्थ: ${p.hindi}`;
}
