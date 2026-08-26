/**
 * A small, transparent bright-star catalogue for the Observatory.
 *
 * The source values are the public-domain Yale Bright Star Catalogue style
 * fields (J2000 right ascension/declination, visual magnitude and B−V
 * colour index).  We deliberately keep the catalogue in source control rather
 * than fetching a remote star service at render time: the sky remains
 * deterministic, fast, and usable offline.
 */

export interface StarRecord {
  id: string;
  name: string;
  /** Right ascension at J2000, in decimal hours. */
  raHours: number;
  /** Declination at J2000, in decimal degrees. */
  decDeg: number;
  /** Compact aliases retained for small consumers and fixture readers. */
  ra: number;
  dec: number;
  magnitude: number;
  mag: number;
  /** B−V colour index; lower values are bluer. */
  bv: number;
  constellation: string;
}

const star = (
  id: string,
  name: string,
  raHours: number,
  decDeg: number,
  magnitude: number,
  bv: number,
  constellation: string,
): StarRecord => ({ id, name, raHours, decDeg, ra: raHours, dec: decDeg, magnitude, mag: magnitude, bv, constellation });

/**
 * 70 bright stars, selected from the Yale Bright Star Catalogue.  The
 * catalogue is intentionally limited to naked-eye anchor stars; it is not
 * intended to replace a professional all-sky catalogue.
 */
export const YALE_BSC_STARS: readonly StarRecord[] = [
  star('sirius', 'Sirius', 6.7525, -16.7161, -1.46, 0.00, 'CMa'),
  star('canopus', 'Canopus', 6.3992, -52.6957, -0.74, 0.15, 'Car'),
  star('arcturus', 'Arcturus', 14.2610, 19.1825, -0.05, 1.23, 'Boo'),
  star('rigil-kentaurus', 'Rigil Kentaurus', 14.6601, -60.8339, -0.27, 0.71, 'Cen'),
  star('vega', 'Vega', 18.6156, 38.7837, 0.03, 0.00, 'Lyr'),
  star('capella', 'Capella', 5.2782, 45.9980, 0.08, 0.80, 'Aur'),
  star('rigel', 'Rigel', 5.2423, -8.2016, 0.13, -0.03, 'Ori'),
  star('procyon', 'Procyon', 7.6550, 5.2250, 0.34, 0.42, 'CMi'),
  star('achernar', 'Achernar', 1.6286, -57.2368, 0.46, -0.16, 'Eri'),
  star('betelgeuse', 'Betelgeuse', 5.9195, 7.4071, 0.50, 1.85, 'Ori'),
  star('hadar', 'Hadar', 14.0637, -60.3730, 0.61, -0.23, 'Cen'),
  star('altair', 'Altair', 19.8464, 8.8683, 0.76, 0.22, 'Aql'),
  star('acrux', 'Acrux', 12.4433, -63.0991, 0.76, -0.24, 'Cru'),
  star('aldebaran', 'Aldebaran', 4.5987, 16.5093, 0.85, 1.54, 'Tau'),
  star('antares', 'Antares', 16.4901, -26.4319, 0.96, 1.83, 'Sco'),
  star('spica', 'Spica', 13.4199, -11.1614, 0.98, -0.23, 'Vir'),
  star('pollux', 'Pollux', 7.7553, 28.0262, 1.14, 1.00, 'Gem'),
  star('fomalhaut', 'Fomalhaut', 22.9608, -29.6222, 1.16, 0.09, 'PsA'),
  star('deneb', 'Deneb', 20.6905, 45.2803, 1.25, 0.09, 'Cyg'),
  star('mimosa', 'Mimosa', 12.7953, -59.6888, 1.25, -0.23, 'Cru'),
  star('regulus', 'Regulus', 10.1395, 11.9672, 1.35, -0.11, 'Leo'),
  star('adhara', 'Adhara', 6.9771, -28.9721, 1.50, -0.21, 'CMa'),
  star('castor', 'Castor', 7.5767, 31.8883, 1.58, 0.03, 'Gem'),
  star('gacrux', 'Gacrux', 12.5194, -57.1132, 1.63, 1.60, 'Cru'),
  star('shaula', 'Shaula', 17.5601, -37.1038, 1.63, -0.21, 'Sco'),
  star('bellatrix', 'Bellatrix', 5.4189, 6.3497, 1.64, -0.22, 'Ori'),
  star('elnath', 'Elnath', 5.4382, 28.6075, 1.65, -0.13, 'Tau'),
  star('miaplacidus', 'Miaplacidus', 9.2200, -69.7172, 1.67, 0.29, 'Car'),
  star('alnilam', 'Alnilam', 5.6036, -1.2019, 1.69, -0.18, 'Ori'),
  star('alnair', 'Alnair', 22.1372, -46.9609, 1.74, -0.09, 'Gru'),
  star('alioth', 'Alioth', 12.9005, 55.9598, 1.77, 0.02, 'UMa'),
  star('regor', 'Regor', 8.1589, -47.3366, 1.78, 0.17, 'Vel'),
  star('dubhe', 'Dubhe', 11.0621, 61.7510, 1.79, 1.07, 'UMa'),
  star('mirfak', 'Mirfak', 3.4054, 49.8612, 1.79, 0.48, 'Per'),
  star('wezen', 'Wezen', 7.1399, -26.3932, 1.84, 0.66, 'CMa'),
  star('sargas', 'Sargas', 17.6219, -42.9978, 1.86, 1.15, 'Sco'),
  star('kaus-australis', 'Kaus Australis', 18.4029, -34.3846, 1.85, 0.05, 'Sgr'),
  star('avior', 'Avior', 8.3752, -59.5095, 1.86, 0.15, 'Car'),
  star('alkaid', 'Alkaid', 13.7923, 49.3133, 1.86, -0.19, 'UMa'),
  star('menkalinan', 'Menkalinan', 5.9921, 44.9474, 1.90, -0.02, 'Aur'),
  star('atria', 'Atria', 16.8111, -69.0277, 1.91, 1.44, 'TrA'),
  star('alhena', 'Alhena', 6.6285, 16.3993, 1.93, 0.00, 'Gem'),
  star('peacock', 'Peacock', 20.4275, -56.7351, 1.94, -0.06, 'Pav'),
  star('mirzam', 'Mirzam', 6.3783, -17.9559, 1.98, -0.22, 'CMa'),
  star('alphard', 'Alphard', 9.4598, -8.6586, 1.98, 1.44, 'Hya'),
  star('hamal', 'Hamal', 2.1195, 23.4624, 2.00, 1.16, 'Ari'),
  star('dschubba', 'Dschubba', 16.0056, -22.6218, 2.29, -0.12, 'Sco'),
  star('nunki', 'Nunki', 18.9211, -26.2967, 2.05, -0.18, 'Sgr'),
  star('alpheratz', 'Alpheratz', 0.1398, 29.0904, 2.06, -0.20, 'And'),
  star('algol', 'Algol', 3.1361, 40.9556, 2.12, -0.05, 'Per'),
  star('denebola', 'Denebola', 11.8177, 14.5721, 2.14, 0.09, 'Leo'),
  star('polaris', 'Polaris', 2.5303, 89.2641, 1.98, 0.60, 'UMi'),
  star('mizar', 'Mizar', 13.3988, 54.9254, 2.23, 0.06, 'UMa'),
  star('kochab', 'Kochab', 14.8451, 74.1555, 2.08, 1.47, 'UMi'),
  star('ankaa', 'Ankaa', 0.4381, -42.3059, 2.40, 1.09, 'Phe'),
  star('alphecca', 'Alphecca', 15.5781, 26.7147, 2.23, 0.03, 'CrB'),
  star('scheat', 'Scheat', 23.0629, 28.0828, 2.42, 1.67, 'Peg'),
  star('markab', 'Markab', 23.0793, 15.2053, 2.49, -0.16, 'Peg'),
  star('algenib', 'Algenib', 0.2206, 15.1836, 2.83, -0.18, 'Peg'),
  star('caph', 'Caph', 0.1529, 59.1498, 2.27, 0.34, 'Cas'),
  star('navi', 'Navi', 0.9451, 60.7167, 2.47, 0.14, 'Cas'),
  star('ruchbah', 'Ruchbah', 1.4302, 60.2353, 2.68, 0.15, 'Cas'),
  star('sadr', 'Sadr', 20.3705, 40.2567, 2.23, 0.67, 'Cyg'),
  star('gienah', 'Gienah', 20.7702, 33.9703, 2.48, 1.03, 'Cyg'),
  star('unukalhai', 'Unukalhai', 15.7378, 6.4255, 2.63, 1.04, 'Ser'),
  star('zubenelgenubi', 'Zubenelgenubi', 14.8470, -16.0418, 2.75, -0.12, 'Lib'),
  star('zubeneschamali', 'Zubeneschamali', 15.2834, -9.3829, 2.61, -0.12, 'Lib'),
  star('kornephoros', 'Kornephoros', 16.5031, 21.4896, 2.77, 0.93, 'Her'),
  star('vindemiatrix', 'Vindemiatrix', 13.0364, 10.9592, 2.83, 0.92, 'Vir'),
  star('aludra', 'Aludra', 7.4016, -29.3031, 2.45, -0.01, 'CMa'),
];

/** Backwards-friendly short name used by the canvas renderer. */
export const STARS = YALE_BSC_STARS;

/**
 * Minimal constellation stick figures. Each pair is a line between catalogue
 * ids. Missing/hidden members are simply skipped by the renderer.
 */
export const CONSTELLATION_LINES: readonly [string, string][] = [
  ['sirius', 'mirzam'], ['mirzam', 'adhara'], ['adhara', 'wezen'], ['wezen', 'aludra'],
  ['bellatrix', 'betelgeuse'], ['bellatrix', 'alnilam'], ['betelgeuse', 'alnilam'],
  ['alnilam', 'rigel'], ['rigel', 'betelgeuse'], ['alnilam', 'wezen'],
  ['dubhe', 'mizar'], ['mizar', 'alioth'], ['alioth', 'alkaid'], ['dubhe', 'alkaid'],
  ['caph', 'navi'], ['navi', 'ruchbah'], ['ruchbah', 'caph'],
  ['alpheratz', 'markab'], ['markab', 'scheat'], ['scheat', 'algenib'], ['algenib', 'alpheratz'],
  ['deneb', 'sadr'], ['sadr', 'gienah'],
  ['dschubba', 'antares'], ['antares', 'shaula'], ['shaula', 'sargas'],
  ['nunki', 'kaus-australis'],
  ['hamal', 'alpheratz'], ['pollux', 'castor'], ['castor', 'alhena'],
  ['polaris', 'kochab'], ['arcturus', 'alkaid'], ['spica', 'zubeneschamali'],
];

export const NAKSHATRA_SHORT_NAMES = [
  'Ash', 'Bha', 'Kri', 'Roh', 'Mri', 'Ard', 'Pun', 'Push', 'Ashl',
  'Mag', 'PPhal', 'UPhal', 'Has', 'Chi', 'Swa', 'Vis', 'Anu', 'Jye',
  'Mul', 'PAsh', 'UAsh', 'Shr', 'Dha', 'Sha', 'PBha', 'UBha', 'Rev',
] as const;

/** A simple perceptual tint from B−V, useful for a dark-sky canvas. */
export function starColorFromBV(bv: number): string {
  if (bv <= -0.10) return '#B9D7FF';
  if (bv <= 0.20) return '#DDEAFF';
  if (bv <= 0.60) return '#FFF4D6';
  if (bv <= 1.10) return '#FFD7A3';
  return '#FFB477';
}

export function starRadiusFromMagnitude(magnitude: number): number {
  return Math.max(1.15, Math.min(4.8, 4.25 - magnitude * 0.72));
}
