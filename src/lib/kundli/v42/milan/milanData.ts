/**
 * KUNDLI V42 — Kundli Milan classical data.
 *
 * The tables below are the fixed Ashtakoota / 36-Guna reference data. They are
 * deliberately kept separate from the arithmetic so a rule can be audited
 * against its source and so a table error is a one-line edit, not a buried
 * branch.
 *
 * Sources (cross-checked, per convention):
 *   - Brihat Parashara Hora Shastra (Ashtakoota doctrine)
 *   - Phaladeepika (Gana / Nadi discussion)
 *   - Muhurta Chintamani (as commonly cited for dosha / pairings)
 *   - Vedangal / Jyotish computation literature: the fixed Varna, Vashya,
 *     Tara, Yoni, Graha Maitri, Gana, Bhakoot and Nadi grids used by
 *     traditional North-Indian match-makers.
 *
 * NOTE ON AUTHORITY: The total out of 36 is a conventional summary, not a
 * scientific measurement. The report always says which koota / dosha drove
 * the verdict and always directs a couple to a qualified Pandit for the
 * consultative reading (phala), because no score, however high, replaces
 * human judgement about a marriage.
 */
import { NAKSHATRA_NAMES } from '../../../astrologyEngine';

export type Varna = 'Brahmin' | 'Kshatriya' | 'Vaishya' | 'Shudra';
export type Vashya = 'Dwipad' | 'Chatushpad' | 'Jalachar' | 'Vanchar' | 'Keet';
export type Yoni =
  | 'Horse' | 'Elephant' | 'Sheep' | 'Serpent' | 'Dog' | 'Cat' | 'Rat'
  | 'Cow' | 'Buffalo' | 'Tiger' | 'Deer' | 'Monkey' | 'Mongoose' | 'Lion';
export type Gana = 'Deva' | 'Manushya' | 'Rakshasa';
export type Nadi = 'Aadi' | 'Madhya' | 'Antya';
export type Planet = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';

/** English rashi name -> Varna. */
export const VARNA_BY_RASHI: Record<string, Varna> = {
  Aries: 'Kshatriya',
  Taurus: 'Vaishya',
  Gemini: 'Shudra',
  Cancer: 'Brahmin',
  Leo: 'Kshatriya',
  Virgo: 'Vaishya',
  Libra: 'Shudra',
  Scorpio: 'Brahmin',
  Sagittarius: 'Kshatriya',
  Capricorn: 'Vaishya',
  Aquarius: 'Shudra',
  Pisces: 'Brahmin',
};

export const VARNA_RANK: Record<Varna, number> = {
  Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1,
};

/** Varna score: bride × groom, 1 if groom >= bride else 0. */
export function varnaScore(bride: Varna, groom: Varna): number {
  return VARNA_RANK[groom] >= VARNA_RANK[bride] ? 1 : 0;
}

/** English rashi name -> Vashya group. */
export const VASHYA_BY_RASHI: Record<string, Vashya> = {
  Aries: 'Chatushpad',
  Taurus: 'Chatushpad',
  Gemini: 'Dwipad',
  Cancer: 'Jalachar',
  Leo: 'Vanchar',
  Virgo: 'Dwipad',
  Libra: 'Dwipad',
  Scorpio: 'Keet',
  Sagittarius: 'Dwipad',
  Capricorn: 'Jalachar',
  Aquarius: 'Dwipad',
  Pisces: 'Jalachar',
};

/** Vashya matrix (bride row × groom col). Same group = 2. */
export const VASHYA_MATRIX: Record<Vashya, Record<Vashya, number>> = {
  Chatushpad: { Chatushpad: 2, Jalachar: 0, Vanchar: 2, Keet: 0, Dwipad: 0 },
  Jalachar:   { Chatushpad: 1, Jalachar: 2, Vanchar: 0, Keet: 1, Dwipad: 1 },
  Vanchar:    { Chatushpad: 1, Jalachar: 0, Vanchar: 2, Keet: 0, Dwipad: 0 },
  Keet:       { Chatushpad: 0, Jalachar: 1, Vanchar: 0, Keet: 2, Dwipad: 1 },
  Dwipad:     { Chatushpad: 1, Jalachar: 1, Vanchar: 1, Keet: 0, Dwipad: 2 },
};

/** 14 Yoni animals, index order used by the fixed 14x14 grid. */
export const YONIS: Yoni[] = [
  'Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat',
  'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion',
];

/** Nakshatra name -> Yoni animal. Standard grid (Saravali / Grokipedia / VedicMarga). */
export const YONI_BY_NAKSHATRA: Record<string, Yoni> = {
  Ashwini: 'Horse',
  Bharani: 'Elephant',
  Krittika: 'Sheep',
  Rohini: 'Serpent',
  Mrigashira: 'Serpent',
  Ardra: 'Dog',
  Punarvasu: 'Cat',
  Pushya: 'Sheep',
  Ashlesha: 'Cat',
  Magha: 'Rat',
  'Purva Phalguni': 'Rat',
  'Uttara Phalguni': 'Cow',
  Hasta: 'Buffalo',
  Chitra: 'Tiger',
  Swati: 'Buffalo',
  Vishakha: 'Tiger',
  Anuradha: 'Deer',
  Jyeshtha: 'Deer',
  Mula: 'Dog',
  'Purva Ashadha': 'Monkey',
  'Uttara Ashadha': 'Mongoose',
  Shravana: 'Monkey',
  Dhanishta: 'Lion',
  Shatabhisha: 'Horse',
  'Purva Bhadrapada': 'Lion',
  'Uttara Bhadrapada': 'Cow',
  Revati: 'Elephant',
};

/**
 * Yoni matrix, printed as rows = bride, columns = groom.
 * 4 same, 3 friendly, 2 neutral, 1 hostile, 0 enemy.
 * Source: Saravali fixed Yoni grid (cross-checked against the conventional
 * predator/prey enmities — Cat-Rat and Serpent-Mongoose are the classic 0s).
 */
export const YONI_MATRIX: Record<Yoni, Record<Yoni, number>> = {
  Horse:     { Horse: 4, Elephant: 2, Sheep: 2, Serpent: 3, Dog: 2, Cat: 2, Rat: 2, Cow: 1, Buffalo: 0, Tiger: 1, Deer: 3, Monkey: 3, Mongoose: 2, Lion: 1 },
  Elephant:  { Horse: 2, Elephant: 4, Sheep: 3, Serpent: 3, Dog: 2, Cat: 2, Rat: 2, Cow: 2, Buffalo: 3, Tiger: 1, Deer: 2, Monkey: 3, Mongoose: 2, Lion: 0 },
  Sheep:     { Horse: 2, Elephant: 3, Sheep: 4, Serpent: 2, Dog: 1, Cat: 2, Rat: 1, Cow: 3, Buffalo: 3, Tiger: 1, Deer: 2, Monkey: 0, Mongoose: 3, Lion: 1 },
  Serpent:   { Horse: 3, Elephant: 3, Sheep: 2, Serpent: 4, Dog: 2, Cat: 1, Rat: 1, Cow: 1, Buffalo: 1, Tiger: 2, Deer: 2, Monkey: 2, Mongoose: 0, Lion: 2 },
  Dog:       { Horse: 2, Elephant: 2, Sheep: 1, Serpent: 2, Dog: 4, Cat: 2, Rat: 1, Cow: 2, Buffalo: 2, Tiger: 1, Deer: 0, Monkey: 2, Mongoose: 1, Lion: 1 },
  Cat:       { Horse: 2, Elephant: 2, Sheep: 2, Serpent: 1, Dog: 2, Cat: 4, Rat: 0, Cow: 2, Buffalo: 2, Tiger: 1, Deer: 3, Monkey: 3, Mongoose: 2, Lion: 1 },
  Rat:       { Horse: 2, Elephant: 2, Sheep: 1, Serpent: 1, Dog: 1, Cat: 0, Rat: 4, Cow: 2, Buffalo: 2, Tiger: 2, Deer: 2, Monkey: 2, Mongoose: 1, Lion: 2 },
  Cow:       { Horse: 1, Elephant: 2, Sheep: 3, Serpent: 1, Dog: 2, Cat: 2, Rat: 2, Cow: 4, Buffalo: 3, Tiger: 0, Deer: 3, Monkey: 2, Mongoose: 2, Lion: 1 },
  Buffalo:   { Horse: 0, Elephant: 3, Sheep: 3, Serpent: 1, Dog: 2, Cat: 2, Rat: 2, Cow: 3, Buffalo: 4, Tiger: 1, Deer: 2, Monkey: 2, Mongoose: 2, Lion: 1 },
  Tiger:     { Horse: 1, Elephant: 1, Sheep: 1, Serpent: 2, Dog: 1, Cat: 1, Rat: 2, Cow: 0, Buffalo: 1, Tiger: 4, Deer: 1, Monkey: 1, Mongoose: 2, Lion: 1 },
  Deer:      { Horse: 1, Elephant: 2, Sheep: 2, Serpent: 2, Dog: 0, Cat: 3, Rat: 2, Cow: 3, Buffalo: 2, Tiger: 1, Deer: 4, Monkey: 2, Mongoose: 2, Lion: 1 },
  Monkey:    { Horse: 3, Elephant: 3, Sheep: 0, Serpent: 2, Dog: 2, Cat: 3, Rat: 2, Cow: 2, Buffalo: 2, Tiger: 1, Deer: 2, Monkey: 4, Mongoose: 3, Lion: 2 },
  Mongoose:  { Horse: 2, Elephant: 2, Sheep: 3, Serpent: 0, Dog: 1, Cat: 2, Rat: 1, Cow: 2, Buffalo: 2, Tiger: 2, Deer: 2, Monkey: 3, Mongoose: 4, Lion: 2 },
  Lion:      { Horse: 1, Elephant: 0, Sheep: 1, Serpent: 2, Dog: 1, Cat: 1, Rat: 2, Cow: 1, Buffalo: 2, Tiger: 1, Deer: 1, Monkey: 2, Mongoose: 2, Lion: 4 },
};

/** Graha Maitri — natural friendship of the rashi lords. */
export interface PlanetRelation { friends: Planet[]; neutrals: Planet[]; enemies: Planet[]; }
export const GRAHA_RELATIONS: Record<Planet, PlanetRelation> = {
  Sun:     { friends: ['Moon', 'Mars', 'Jupiter'], neutrals: ['Mercury'], enemies: ['Venus', 'Saturn'] },
  Moon:    { friends: ['Sun', 'Mercury'], neutrals: ['Mars', 'Venus', 'Jupiter'], enemies: ['Saturn'] },
  Mars:    { friends: ['Sun', 'Moon', 'Jupiter'], neutrals: ['Venus', 'Saturn'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], neutrals: ['Mars', 'Jupiter', 'Saturn'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], neutrals: ['Saturn'], enemies: ['Mercury', 'Venus'] },
  Venus:   { friends: ['Mercury', 'Saturn'], neutrals: ['Mars', 'Jupiter'], enemies: ['Sun', 'Moon'] },
  Saturn:  { friends: ['Mercury', 'Venus'], neutrals: ['Jupiter'], enemies: ['Sun', 'Moon', 'Mars'] },
};

/** Nakshatra -> Gana. */
export const GANA_BY_NAKSHATRA: Record<string, Gana> = {
  Ashwini: 'Deva', Bharani: 'Manushya', Krittika: 'Rakshasa', Rohini: 'Manushya',
  Mrigashira: 'Deva', Ardra: 'Manushya', Punarvasu: 'Deva', Pushya: 'Deva',
  Ashlesha: 'Rakshasa', Magha: 'Rakshasa', 'Purva Phalguni': 'Manushya',
  'Uttara Phalguni': 'Manushya', Hasta: 'Deva', Chitra: 'Rakshasa', Swati: 'Deva',
  Vishakha: 'Rakshasa', Anuradha: 'Deva', Jyeshtha: 'Rakshasa', Mula: 'Rakshasa',
  'Purva Ashadha': 'Manushya', 'Uttara Ashadha': 'Manushya', Shravana: 'Deva',
  Dhanishta: 'Rakshasa', Shatabhisha: 'Rakshasa', 'Purva Bhadrapada': 'Manushya',
  'Uttara Bhadrapada': 'Manushya', Revati: 'Deva',
};

/** Gana score matrix, rows = bride, cols = groom. */
export const GANA_MATRIX: Record<Gana, Record<Gana, number>> = {
  Deva:     { Deva: 6, Manushya: 5, Rakshasa: 1 },
  Manushya: { Deva: 5, Manushya: 6, Rakshasa: 0 },
  Rakshasa: { Deva: 1, Manushya: 0, Rakshasa: 6 },
};

/** Nakshatra -> Nadi. */
export const NADI_BY_NAKSHATRA: Record<string, Nadi> = {
  Ashwini: 'Aadi', Ardra: 'Aadi', Punarvasu: 'Aadi', 'Uttara Phalguni': 'Aadi',
  Hasta: 'Aadi', Jyeshtha: 'Aadi', Mula: 'Aadi', Shatabhisha: 'Aadi',
  'Purva Bhadrapada': 'Aadi',
  Bharani: 'Madhya', Mrigashira: 'Madhya', Pushya: 'Madhya',
  'Purva Phalguni': 'Madhya', Chitra: 'Madhya', Vishakha: 'Madhya',
  'Purva Ashadha': 'Madhya', Dhanishta: 'Madhya', 'Uttara Bhadrapada': 'Madhya',
  Krittika: 'Antya', Rohini: 'Antya', Ashlesha: 'Antya', Magha: 'Antya',
  Swati: 'Antya', Anuradha: 'Antya', 'Uttara Ashadha': 'Antya',
  Shravana: 'Antya', Revati: 'Antya',
};

export const RASHI_ID_BY_NAME: Record<string, number> = {
  Aries: 1, Taurus: 2, Gemini: 3, Cancer: 4, Leo: 5, Virgo: 6,
  Libra: 7, Scorpio: 8, Sagittarius: 9, Capricorn: 10, Aquarius: 11, Pisces: 12,
};

/** 1-based nakshatra number from the canonical name; -1 when unknown. */
export function nakshatraIndex(name: string): number {
  return NAKSHATRA_NAMES.indexOf(name) + 1;
}

export type RajjuGroup = 'Shiro' | 'Kantha' | 'Udara' | 'Kati' | 'Pada';

/** South-Indian / Porutham-style Rajju. Not part of the 36-Guna score. */
export const RAJJU_BY_NAKSHATRA: Record<string, RajjuGroup> = {
  Mrigashira: 'Shiro', Chitra: 'Shiro', Dhanishta: 'Shiro',
  Rohini: 'Kantha', Ardra: 'Kantha', Hasta: 'Kantha', Swati: 'Kantha', Shatabhisha: 'Kantha',
  Krittika: 'Udara', Punarvasu: 'Udara', 'Uttara Phalguni': 'Udara', Vishakha: 'Udara', 'Uttara Ashadha': 'Udara',
  Bharani: 'Kati', Pushya: 'Kati', 'Purva Phalguni': 'Kati', Anuradha: 'Kati', 'Purva Ashadha': 'Kati',
  Ashwini: 'Pada', Ashlesha: 'Pada', Magha: 'Pada', Jyeshtha: 'Pada', Mula: 'Pada', Shravana: 'Pada', Revati: 'Pada', 'Purva Bhadrapada': 'Pada', 'Uttara Bhadrapada': 'Pada',
};

export const RAJJU_ORDER: RajjuGroup[] = ['Shiro', 'Kantha', 'Udara', 'Kati', 'Pada'];

export function rajjuOf(nakshatra: string): RajjuGroup | undefined {
  return RAJJU_BY_NAKSHATRA[nakshatra];
}

/** The 14 classical Vedha pairs (bidirectional). */
export const VEDHA_PAIRS: Array<[string, string]> = [
  ['Ashwini', 'Jyeshtha'],
  ['Bharani', 'Anuradha'],
  ['Krittika', 'Vishakha'],
  ['Rohini', 'Swati'],
  ['Mrigashira', 'Dhanishta'],
  ['Ardra', 'Shravana'],
  ['Punarvasu', 'Uttara Ashadha'],
  ['Pushya', 'Purva Ashadha'],
  ['Ashlesha', 'Mula'],
  ['Magha', 'Revati'],
  ['Purva Phalguni', 'Uttara Bhadrapada'],
  ['Uttara Phalguni', 'Purva Bhadrapada'],
  ['Hasta', 'Shatabhisha'],
];

/** Houses (from Lagna) where Mars creates Mangal Dosha. */
export const MANGAL_HOUSES = [1, 4, 7, 8, 12];

export const SOURCE_LABELS: Record<string, string> = {
  BPHS: 'Brihat Parashara Hora Shastra (Ashtakoota doctrine)',
  PHALA: 'Phaladeepika',
  MUHURTA: 'Muhurta Chintamani',
  TRADITION: 'Traditional North-Indian Ashtakoota practice',
};
