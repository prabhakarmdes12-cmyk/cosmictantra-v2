/**
 * Static access to the extracted scripture collections.
 *
 * These JSON modules are produced by `scripts/extract-granth-library.cjs`
 * from `src/app/aarti-stotra/page.tsx`. The text is identical to what the page
 * shipped inline; only its location changed.
 *
 * Use this module ONLY where the whole collection is rendered (the library
 * page). The chat/API path must use the lazy loader in
 * `src/lib/granth/registry.ts` so a single book is not bundled everywhere.
 */
import gitaDoc from './data/granths/bhagavad-gita';
import manasDoc from './data/granths/ramcharitmanas';
import shivaDoc from './data/granths/shiva-mahapuran';
import deviDoc from './data/granths/devi-bhagavata';
import stotrasDoc from './data/collections/stotras';
import aartisDoc from './data/collections/aartis';
import siddhaStutiDoc from './data/collections/siddha-stuti';
import type { RawItem } from './types';

export interface LibraryVerseItem {
  shlokaNo?: string;
  sanskrit: string;
  hindi: string;
}

export interface LibrarySection {
  id: string;
  title: string;
  subtitle?: string;
  verses: LibraryVerseItem[];
}

export interface LibraryItem {
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
  sections: LibrarySection[];
}

const gita = gitaDoc.item;
const manas = manasDoc.item;
const shiva = shivaDoc.item;
const devi = deviDoc.item;

/** The four primary Granths, in the same order the page rendered them. */
export const GRANTHS_DATA = [gita, manas, shiva, devi] as unknown as LibraryItem[];

export const STOTRAS_DATA = stotrasDoc.items as unknown as LibraryItem[];
export const AARTIS_DATA = aartisDoc.items as unknown as LibraryItem[];
export const SIDDHA_STUTI_DATA = siddhaStutiDoc.items as unknown as LibraryItem[];
