/**
 * Canonical Granth library — shared types.
 *
 * A stored passage is NOT just a string: it carries the book, the edition it
 * belongs to, the section it was stored in, its row index, the kind of unit
 * it is (verse / speaker label / invocation / grouped range) and a checksum.
 * Anything the assistant says about a passage must resolve back to one of
 * these records.
 */

/** What kind of stored unit a row is. Speaker labels and invocations are NOT numbered verses. */
export type PassageKind = 'verse' | 'grouped-verse' | 'speaker' | 'invocation' | 'colophon' | 'unclassified';

export interface PassageLocator {
  /** 1-based adhyāya / kāṇḍa / skandha index where the edition numbers them. */
  chapter?: number;
  /** 1-based verse number inside the chapter. */
  verse?: number;
  /** Inclusive verse range for rows that group several verses. */
  verseRange?: { from: number; to: number };
  /** 1-based index of an invocation/dhyanam row inside its invocation block. */
  invocationIndex?: number;
  /** Section (narrative unit) identifier as stored in the library data. */
  sectionId?: string;
  /** Speaker label for speaker rows. */
  label?: string;
}

export interface PassageSource {
  dataFile: string;
  sectionId: string;
  rowIndex: number;
  editionId: string;
  /** Human-readable statement of where the text came from, as stored. */
  attribution: string;
}

export interface PassageRecord {
  passageId: string;
  bookId: string;
  editionId: string;
  sectionId: string;
  /** 0-based row index inside the stored section. Stable within a data version. */
  rowIndex: number;
  kind: PassageKind;
  locator: PassageLocator;
  /** Stored original (mūla) text. Never generated. */
  original: string;
  /** Stored meaning/translation as shipped with the corpus (not an AI explanation). */
  meaning?: string;
  /** Language tag of `original`, e.g. 'sa' (Sanskrit), 'hi'. */
  originalLanguage: string;
  /** Language tag of `meaning` when present. */
  meaningLanguage?: string;
  /** Identity checksum: book + edition + section + row + kind + text. */
  checksum: string;
  /** Content-only checksum (normalised original text) used for duplicate detection. */
  textChecksum: string;
  source: PassageSource;
  /** Set when the corruption scan flags this row. */
  corruption?: string[];
}

export interface RawRow {
  shlokaNo?: string;
  sanskrit: string;
  hindi: string;
}

export interface RawSection {
  id: string;
  title: string;
  subtitle?: string;
  verses: RawRow[];
}

export interface RawItem {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  deity: string;
  source: string;
  verified: boolean;
  category: 'aarti' | 'stotra' | 'granth' | 'siddha-stuti';
  videoId?: string;
  structure?: string;
  meaningSummary?: string;
  sections: RawSection[];
}

export interface BookDocument {
  schemaVersion: number;
  extractedAt: string;
  extractedFrom: string;
  category: string;
  item: RawItem;
}

export interface CollectionDocument {
  schemaVersion: number;
  extractedAt: string;
  extractedFrom: string;
  category: string;
  items: RawItem[];
}

export interface DataIndexEntry {
  id: number;
  slug: string;
  category: RawItem['category'];
  title: string;
  source: string;
  verified: boolean;
  sections: Array<{ id: string; rows: number }>;
  rows: number;
  /** Present for granths (one data module per book). */
  dataFile?: string;
}

export interface DataIndex {
  schemaVersion: number;
  generatedAt: string;
  generatedBy: string;
  sourceOfTruth: string;
  granths: DataIndexEntry[];
  collections: Record<string, { dataFile: string; items: DataIndexEntry[] }>;
}

export interface ExtractionManifest {
  schemaVersion: number;
  generatedAt: string;
  note: string;
  files: Array<{ file: string; sha256: string; bytes: number }>;
  index: { file: string; sha256: string; bytes: number };
}

/** A book with its rows normalised into typed passage records. */
export interface Book {
  bookId: string;
  slug: string;
  title: string;
  attribution: string;
  editionId: string;
  editionLabel: string;
  /** False when no per-edition manifest exists for the book. */
  hasEditionManifest: boolean;
  dataFile: string;
  sections: Array<{
    sectionId: string;
    title: string;
    subtitle?: string;
    passages: PassageRecord[];
  }>;
  passages: PassageRecord[];
  byId: Record<string, PassageRecord>;
}

export interface EditionChapterExpectation {
  chapter: number;
  sectionId: string;
  sanskritName: string;
  englishName: string;
  expectedVerseNumbers: number[];
  duplicateVerseNumbers: number[];
  missingVerseNumbers: number[];
  expectedSpeakerRows: number;
  speakerLabels: string[];
  embeddedSpeakerRows: Array<{ kind: string; label: string; beforeVerse: number }>;
  hindi: {
    source: string;
    versesPresent: number;
    speakerLines: number;
    missingVerseNumbers: number[];
  };
  expectedRows: number;
}

export interface EditionManifest {
  schemaVersion: number;
  bookId: string;
  editionId: string;
  displayName: string;
  generatedAt: string;
  generatedBy: string;
  provenance: {
    kind: string;
    sourceFiles: Array<{ path: string; role: string; bytes: number; sha256: string }>;
    publisher: string | null;
    printedEdition: string | null;
    editorOrTranslator: string | null;
    independentCollation: boolean;
    rightsStatus: string;
    notes: string[];
  };
  numbering: {
    convention: string;
    chapters: number;
    numberedVerses: number;
    recensionNote: string;
    dhyanamNote: string;
  };
  groupingRules: string[];
  expected: {
    invocations: Array<{
      sectionId: string;
      expectedRows: number;
      inReferenceSnapshot: boolean;
      verificationStatus: string;
    }>;
    chapters: EditionChapterExpectation[];
  };
}

/** Distinct failure modes. A caller must never collapse these into one "not found". */
export type LookupFailureCode =
  | 'UNKNOWN_BOOK'
  | 'UNKNOWN_SECTION'
  | 'INVALID_CHAPTER'
  | 'INVALID_VERSE'
  | 'INVALID_RANGE'
  | 'NOT_IN_EDITION'
  | 'NOT_STORED'
  | 'AMBIGUOUS'
  | 'UNSUPPORTED_SCOPE';

export interface LookupFailure {
  status: 'FAILURE';
  code: LookupFailureCode;
  messageHi: string;
  messageEn: string;
  /** Machine-readable hint the UI/assistant may act on. */
  known: {
    bookId?: string;
    chapters?: number;
    versesInChapter?: number;
    availableBooks?: string[];
  };
}

export type ReadingScopeKind = 'book' | 'chapter' | 'verse' | 'range' | 'section';

export interface LookupSuccess {
  status: 'FOUND';
  bookId: string;
  bookTitle: string;
  editionId: string;
  editionLabel: string;
  scope: { kind: ReadingScopeKind; chapter?: number; fromVerse?: number; toVerse?: number; sectionId?: string };
  passages: PassageRecord[];
  /** True only when every unit the edition expects for this scope is present. */
  isCompleteScope: boolean;
  /** Verse numbers present for a chapter/range scope (speaker rows excluded). */
  verseNumbers: number[];
  /** Units the edition expects for this scope that are absent from storage. */
  missingVerseNumbers: number[];
  attribution: string;
}

export type LookupResult = LookupSuccess | LookupFailure;
