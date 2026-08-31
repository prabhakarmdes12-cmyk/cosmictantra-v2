/** Exact retrieval only. The page's larger collection is not yet a shared reader library. */
import { VERIFIED_SCRIPTURE_CORPUS } from './scriptureCorpus';

export interface ReadRequest {
  grantha: string;
  mode: 'full' | 'chapter' | 'verse' | 'section' | 'condition';
  chapter?: number;
  verse?: number;
  sectionId?: string;
  condition?: string;
}
export interface ReadResponse {
  found: boolean;
  text: string;
  sourceName: string;
  chapter?: number;
  verse?: number;
  section?: string;
  /** Partial relative to the book, not a truncated verse. */
  isPartial: boolean;
  isFull: boolean;
  note: string;
}
export function readScriptureText(req: ReadRequest): ReadResponse {
  const isGita = /^(gita|bhagavad[- ]gita|गीता|भगवद्गीता|श्रीमद्भगवद्गीता)$/i.test(req.grantha.trim());
  const entry = isGita && req.mode === 'verse' && Number.isInteger(req.chapter) && Number.isInteger(req.verse)
    ? VERIFIED_SCRIPTURE_CORPUS[`BG_${req.chapter}_${req.verse}`] : undefined;
  if (entry) {
    return {
      found: true,
      text: `${entry.sanskrit}\n\n${entry.transliteration}\n\nहिन्दी अर्थ: ${entry.hindiMeaning}\n\nEnglish: ${entry.englishMeaning}`,
      sourceName: entry.grantha, chapter: entry.chapter, verse: entry.verse,
      isPartial: true, isFull: false,
      note: 'संग्रह में उपलब्ध श्लोक; पूरे ग्रन्थ का पाठ नहीं।',
    };
  }
  return {
    found: false, sourceName: req.grantha, isPartial: false, isFull: false,
    text: 'अनुरोधित पाठ इस चैट के जुड़े संग्रह में अनुपलब्ध है। मैं अनुमान से पाठ नहीं सुनाऊँगी। आरती एवं ग्रन्थ पुस्तकालय में उपलब्ध पाठ देख सकते हैं।',
    note: 'पूर्ण ग्रन्थ, अध्याय, अनुभाग और परिस्थिति-आधारित retrieval अभी इस reader से जुड़े नहीं हैं।',
  };
}
/** Conservative parsing: never interpret a generic "read" request as scripture. */
export function parseScriptureReadRequest(query: string): ReadRequest | null {
  const normalized = query.replace(/[०-९]/g, d => String('०१२३४५६७८९'.indexOf(d))).toLowerCase();
  if (!/(\bread\b|\brecite\b|पढ़ो|पढ़ें|सुनाओ|सुनाइए|पूरा पाठ|full text)/.test(normalized)) return null;
  const book = normalized.match(/bhagavad[- ]gita|\bgita\b|श्रीमद्भगवद्गीता|भगवद्गीता|गीता|ramcharitmanas|रामचरितमानस|madhurashtakam|मधुराष्टकम्|शिवमहापुराण|देवीभागवत|हनुमानचालीसा/);
  if (!book) return null;
  const grantha = /gita|गीता/.test(book[0]) ? 'gita' : book[0];
  const dotted = normalized.match(/(?:gita|गीता)\s*(\d+)[.:](\d+)/);
  const chapter = dotted?.[1] ?? normalized.match(/(?:chapter|अध्याय)\s*(\d+)/)?.[1] ?? normalized.match(/(\d+)\s*(?:वाँ|वां|वें)?\s*अध्याय/)?.[1];
  const verse = dotted?.[2] ?? normalized.match(/(?:verse|श्लोक)\s*(\d+)/)?.[1];
  if (/\d+\s*(?:-|–|से|to)\s*\d+/.test(normalized)) return { grantha, mode: 'section', sectionId: 'range' };
  return { grantha, mode: verse ? 'verse' : chapter ? 'chapter' : 'full',
    chapter: chapter ? Number(chapter) : undefined, verse: verse ? Number(verse) : undefined };
}
