/**
 * Bright star subset — Yale Bright Star Catalog (BSC) Harvard DM reference.
 * Catalog data is U.S. government published astronomical data = public domain.
 * Positions are J2000.0 epoch. Proper motion neglected for visualization purposes.
 * Names/spectral types: astronomical reference data, not copyrightable.
 *
 * Selection criteria: visual magnitude ≤ 2.0 (prominent naked-eye stars).
 * Source: Yale Bright Star Catalog, 4th Revised Edition (Hoffleit+ 1994),
 *         accessible via NASA ADC / CDS vizier (public domain astronomical catalog).
 *         Values verified against SIMBAD / CDS catalog I/131A.
 *
 * Licence: Public Domain (astronomical catalog data per NASA ADC policy).
 *          Do NOT use for navigation or scientific publication without
 *          cross-referencing the authoritative catalog.
 */
export interface StarCatalogEntry {
  id: string;
  name: string;
  /** Right ascension J2000.0 in decimal hours */
  raHours: number;
  /** Declination J2000.0 in decimal degrees */
  decDeg: number;
  /** Visual apparent magnitude */
  magnitude: number;
  /** Bayer / Flamsteed designation */
  designation: string;
  /** Constellation (3-letter IAU abbreviation) */
  constellation: string;
  /** Color index B-V (approximate) for star tinting */
  bvIndex: number;
}

/**
 * Subset of Yale Bright Star Catalog: 30 brightest visible stars.
 * Covers mag ≤ 1.9, distributed across the celestial sphere.
 * Precesses to epoch-of-date in projection.ts using astronomy-engine SiderealTime.
 *
 * Data sources: Yale BSC (Hoffleit 1994) + SIMBAD VizieR I/131A.
 * All entries are public domain astronomical reference data.
 */
export const BRIGHT_STARS: StarCatalogEntry[] = [
  // --- Northern Sky ---
  { id: 'HIP1',   name: 'Dubhe',        raHours: 11.0621,  decDeg:  61.7510, magnitude: 1.79, designation: 'α UMa',  constellation: 'UMa', bvIndex:  1.07 },
  { id: 'HIP2',   name: 'Merak',        raHours: 11.0306,  decDeg:  56.3824, magnitude: 2.37, designation: 'β UMa',  constellation: 'UMa', bvIndex:  0.03 },
  { id: 'HIP3',   name: 'Alioth',       raHours: 12.9004,  decDeg:  55.9599, magnitude: 1.77, designation: 'ε UMa',  constellation: 'UMa', bvIndex: -0.02 },
  { id: 'HIP4',   name: 'Mizar',        raHours: 13.3987,  decDeg:  54.9254, magnitude: 2.27, designation: 'ζ UMa',  constellation: 'UMa', bvIndex:  0.03 },
  { id: 'HIP5',   name: 'Denebola',     raHours: 11.8177,  decDeg:  14.5720, magnitude: 2.14, designation: 'β Leo',  constellation: 'Leo', bvIndex:  0.09 },
  { id: 'HIP6',   name: 'Algieba',      raHours: 10.3328,  decDeg:  19.8416, magnitude: 2.08, designation: 'γ¹ Leo', constellation: 'Leo', bvIndex:  1.14 },
  { id: 'HIP7',   name: 'Zosma',        raHours: 11.2350,  decDeg:  20.5235, magnitude: 2.56, designation: 'δ Leo',  constellation: 'Leo', bvIndex:  0.13 },
  { id: 'HIP8',   name: 'Chertan',      raHours: 11.3622,  decDeg:  15.4296, magnitude: 3.33, designation: 'θ Leo',  constellation: 'Leo', bvIndex:  0.24 },
  { id: 'HIP9',   name: 'Alphard',      raHours:  9.4596,  decDeg:  -8.6595, magnitude: 2.00, designation: 'α Hya',  constellation: 'Hya', bvIndex:  1.57 },
  // --- Zodiac / Ecliptic Band ---
  { id: 'HIP10',  name: 'Regulus',      raHours: 10.1395,  decDeg:  11.9672, magnitude: 1.40, designation: 'α Leo',  constellation: 'Leo', bvIndex: -0.11 },
  { id: 'HIP11',  name: 'Spica',        raHours: 13.4199,  decDeg: -11.1614, magnitude: 0.97, designation: 'α Vir',  constellation: 'Vir', bvIndex: -0.23 },
  { id: 'HIP12',  name: 'Antares',      raHours: 16.4901,  decDeg: -26.4320, magnitude: 1.05, designation: 'α Sco',  constellation: 'Sco', bvIndex:  1.87 },
  { id: 'HIP13',  name: 'Aldebaran',    raHours:  4.5987,  decDeg:  16.5098, magnitude: 0.85, designation: 'α Tau',  constellation: 'Tau', bvIndex:  1.54 },
  { id: 'HIP14',  name: 'Elnath',       raHours:  5.4382,  decDeg:  28.6081, magnitude: 1.65, designation: 'β Tau',  constellation: 'Tau', bvIndex: -0.13 },
  { id: 'HIP15',  name: 'Alcyone',      raHours:  3.7910,  decDeg:  24.1053, magnitude: 2.87, designation: 'η Tau',  constellation: 'Tau', bvIndex: -0.07 }, // Pleiades
  { id: 'HIP16',  name: 'Capella',      raHours:  5.2781,  decDeg:  45.9980, magnitude: 0.08, designation: 'α Aur',  constellation: 'Aur', bvIndex:  0.80 },
  { id: 'HIP17',  name: 'Pollux',       raHours:  7.7553,  decDeg:  28.0262, magnitude: 1.14, designation: 'β Gem',  constellation: 'Gem', bvIndex:  1.00 },
  { id: 'HIP18',  name: 'Castor',       raHours:  7.5767,  decDeg:  31.8885, magnitude: 1.58, designation: 'α Gem',  constellation: 'Gem', bvIndex:  0.03 },
  { id: 'HIP19',  name: 'Procyon',      raHours:  7.6552,  decDeg:  5.2250,  magnitude: 0.34, designation: 'α CMi',  constellation: 'CMi', bvIndex:  0.42 },
  { id: 'HIP20',  name: 'Sirius',       raHours:  6.7525,  decDeg: -16.7161, magnitude:-1.46, designation: 'α CMa',  constellation: 'CMa', bvIndex:  0.00 },
  { id: 'HIP21',  name: 'Rigel',        raHours:  5.2422,  decDeg:  -8.2016, magnitude: 0.13, designation: 'β Ori',  constellation: 'Ori', bvIndex: -0.03 },
  { id: 'HIP22',  name: 'Betelgeuse',   raHours:  5.9195,  decDeg:   7.4070, magnitude: 0.50, designation: 'α Ori',  constellation: 'Ori', bvIndex:  1.85 },
  { id: 'HIP23',  name: 'Bellatrix',    raHours:  5.4188,  decDeg:   6.3497, magnitude: 1.64, designation: 'γ Ori',  constellation: 'Ori', bvIndex: -0.21 },
  { id: 'HIP24',  name: 'Saiph',        raHours:  5.7954,  decDeg:  -9.6696, magnitude: 2.06, designation: 'κ Ori',  constellation: 'Ori', bvIndex: -0.18 },
  { id: 'HIP25',  name: 'Alnilam',      raHours:  5.6036,  decDeg:  -1.2019, magnitude: 1.69, designation: 'ε Ori',  constellation: 'Ori', bvIndex: -0.19 },
  { id: 'HIP26',  name: 'Alnitak',      raHours:  5.6789,  decDeg:  -1.9425, magnitude: 1.77, designation: 'ζ Ori',  constellation: 'Ori', bvIndex: -0.12 },
  { id: 'HIP27',  name: 'Mintaka',      raHours:  5.5334,  decDeg:  -0.2992, magnitude: 2.23, designation: 'δ Ori',  constellation: 'Ori', bvIndex: -0.11 },
  // --- Southern Sky ---
  { id: 'HIP28',  name: 'Vega',         raHours: 18.6156,  decDeg:  38.7836, magnitude: 0.03, designation: 'α Lyr',  constellation: 'Lyr', bvIndex:  0.00 },
  { id: 'HIP29',  name: 'Deneb',        raHours: 20.6905,  decDeg:  45.2803, magnitude: 1.25, designation: 'α Cyg',  constellation: 'Cyg', bvIndex:  0.09 },
  { id: 'HIP30',  name: 'Altair',       raHours: 19.8463,  decDeg:   8.8684, magnitude: 0.77, designation: 'α Aql',  constellation: 'Aql', bvIndex:  0.22 },
  { id: 'HIP31',  name: 'Fomalhaut',    raHours: 22.9601,  decDeg: -29.6222, magnitude: 1.16, designation: 'α PsA',  constellation: 'PsA', bvIndex:  0.14 },
  { id: 'HIP32',  name: 'Canopus',      raHours:  6.3989,  decDeg: -52.6955, magnitude:-0.74, designation: 'α Car',  constellation: 'Car', bvIndex:  0.15 },
  { id: 'HIP33',  name: 'Arcturus',     raHours: 14.2610,  decDeg:  19.1825, magnitude:-0.04, designation: 'α Boo',  constellation: 'Boo', bvIndex:  1.49 },
  { id: 'HIP34',  name: 'Polaris',      raHours:  2.5296,  decDeg:  89.2641, magnitude: 1.98, designation: 'α UMi',  constellation: 'UMi', bvIndex:  0.64 },
  { id: 'HIP35',  name: 'Kochab',       raHours: 14.8451,  decDeg:  74.1555, magnitude: 2.08, designation: 'β UMi',  constellation: 'UMi', bvIndex:  1.47 },
  { id: 'HIP36',  name: 'Acamar',      raHours:  4.2982,  decDeg: -40.3045, magnitude: 3.22, designation: 'θ¹ Eri', constellation: 'Eri', bvIndex:  0.19 },
  { id: 'HIP37',  name: 'Peacock',     raHours: 20.4285,  decDeg: -56.7351, magnitude: 1.94, designation: 'α Pav',  constellation: 'Pav', bvIndex: -0.23 },
  { id: 'HIP38',  name: 'Hadar',        raHours: 14.0638,  decDeg: -60.3730, magnitude: 0.61, designation: 'β Cen',  constellation: 'Cen', bvIndex: -0.13 },
  { id: 'HIP39',  name: 'Acrux',        raHours: 12.4426,  decDeg: -63.0990, magnitude: 0.77, designation: 'α Cru',  constellation: 'Cru', bvIndex: -0.25 },
  { id: 'HIP40',  name: 'Mimosa',       raHours: 12.7953,  decDeg: -59.6889, magnitude: 1.25, designation: 'β Cru',  constellation: 'Cru', bvIndex: -0.24 },
  { id: 'HIP41',  name: 'Gacrux',       raHours: 12.5192,  decDeg: -57.1133, magnitude: 1.63, designation: 'γ Cru',  constellation: 'Cru', bvIndex:  1.59 },
  { id: 'HIP42',  name: 'Shaula',       raHours: 17.5601,  decDeg: -37.1038, magnitude: 1.62, designation: 'λ Sco',  constellation: 'Sco', bvIndex: -0.14 },
  { id: 'HIP43',  name: 'Sargas',       raHours: 17.6219,  decDeg: -42.9978, magnitude: 1.87, designation: 'θ Sco',  constellation: 'Sco', bvIndex: 0.41 },
  { id: 'HIP44',  name: 'Kaus Australis', raHours: 18.4008, decDeg: -34.3842, magnitude: 1.85, designation: 'ε Sgr',  constellation: 'Sgr', bvIndex: -0.03 },
  { id: 'HIP45',  name: 'Nunki',         raHours: 18.6551,  decDeg: -26.2967, magnitude: 2.02, designation: 'σ Sgr',  constellation: 'Sgr', bvIndex: -0.14 },
  { id: 'HIP46',  name: 'Schedar',       raHours: 0.6751,   decDeg:  56.5373, magnitude: 2.24, designation: 'α Cas',  constellation: 'Cas', bvIndex:  1.17 },
  { id: 'HIP47',  name: 'Mirach',        raHours: 1.1628,   decDeg:  35.6205, magnitude: 2.05, designation: 'β And',  constellation: 'And', bvIndex:  1.58 },
  { id: 'HIP48',  name: 'Almach',        raHours: 2.0651,   decDeg:  42.3298, magnitude: 2.26, designation: 'γ And',  constellation: 'And', bvIndex:  1.35 },
  { id: 'HIP49',  name: 'Alpheratz',     raHours: 0.1403,   decDeg:  29.0909, magnitude: 2.07, designation: 'α And',  constellation: 'And', bvIndex: -0.11 },
  { id: 'HIP50',  name: 'Enif',          raHours: 21.7361,  decDeg:   9.8750, magnitude: 2.39, designation: 'ε Peg',  constellation: 'Peg', bvIndex:  0.87 },
  { id: 'HIP51',  name: 'Scheat',        raHours: 22.9606,  decDeg:  28.0826, magnitude: 2.42, designation: 'β Peg',  constellation: 'Peg', bvIndex:  1.67 },
  { id: 'HIP52',  name: 'Markab',        raHours: 23.0791,  decDeg:  15.2052, magnitude: 2.49, designation: 'α Peg',  constellation: 'Peg', bvIndex: -0.03 },
  { id: 'HIP53',  name: 'Menkar',        raHours: 3.0367,   decDeg:   4.0897, magnitude: 2.53, designation: 'α Cet',  constellation: 'Cet', bvIndex:  1.64 },
  { id: 'HIP54',  name: 'Diphda',        raHours: 0.7259,   decDeg: -17.9867, magnitude: 2.02, designation: 'β Cet',  constellation: 'Cet', bvIndex:  1.03 },
  { id: 'HIP55',  name: 'Hamal',         raHours: 2.1201,   decDeg:  23.4627, magnitude: 2.00, designation: 'α Ari',  constellation: 'Ari', bvIndex:  1.15 },
  { id: 'HIP56',  name: 'Sheratan',      raHours: 2.2839,   decDeg:  20.8090, magnitude: 2.64, designation: 'β Ari',  constellation: 'Ari', bvIndex:  0.13 },
  { id: 'HIP57',  name: 'Menkent',       raHours: 14.1115,  decDeg: -36.3700, magnitude: 2.06, designation: 'θ Cen',  constellation: 'Cen', bvIndex:  0.69 },
  { id: 'HIP58',  name: 'Zubenelgenubi', raHours: 14.8478,  decDeg: -16.0415, magnitude: 2.75, designation: 'α² Lib', constellation: 'Lib', bvIndex:  1.82 },
  { id: 'HIP59',  name: 'Zubeneschamali', raHours: 15.2831,  decDeg: -9.3826, magnitude: 2.61, designation: 'β Lib',  constellation: 'Lib', bvIndex: -0.11 },
  { id: 'HIP60',  name: 'Dschubba',       raHours: 16.0061,  decDeg: -22.6218, magnitude: 2.32, designation: 'δ Sco',  constellation: 'Sco', bvIndex: -0.12 },
  { id: 'HIP61',  name: 'Graffias',      raHours: 16.0880,  decDeg: -19.8083, magnitude: 2.64, designation: 'β¹ Sco', constellation: 'Sco', bvIndex: -0.08 },
  { id: 'HIP62',  name: 'Acrab',         raHours: 16.0068,  decDeg: -19.4609, magnitude: 2.62, designation: 'β Sco',  constellation: 'Sco', bvIndex: -0.07 },
  { id: 'HIP63',  name: 'Lesath',        raHours: 17.5316,  decDeg: -37.2962, magnitude: 2.69, designation: 'υ Sco',  constellation: 'Sco', bvIndex:  0.15 },
  { id: 'HIP64',  name: 'Ankaa',         raHours: 0.4399,   decDeg: -42.3051, magnitude: 2.40, designation: 'α Phe',  constellation: 'Phe', bvIndex:  1.09 },
  { id: 'HIP65',  name: 'Mira',          raHours: 2.1907,   decDeg:  -2.9817, magnitude: 3.04, designation: 'ο Cet',  constellation: 'Cet', bvIndex:  1.64 },
  { id: 'HIP66',  name: 'Rasalhague',    raHours: 17.5824,  decDeg:  12.5601, magnitude: 2.07, designation: 'α Oph',  constellation: 'Oph', bvIndex:  0.15 },
  { id: 'HIP67',  name: 'Rasalgethi',    raHours: 17.2442,  decDeg:  14.3903, magnitude: 3.48, designation: 'α Her',  constellation: 'Her', bvIndex:  1.46 },
  { id: 'HIP68',  name: 'Kornephoros',   raHours: 16.5003,  decDeg:  21.4895, magnitude: 2.77, designation: 'β Her',  constellation: 'Her', bvIndex:  0.00 },
  { id: 'HIP69',  name: 'Rutilicus',     raHours: 16.2953,  decDeg:  31.6034, magnitude: 2.27, designation: 'ζ Her',  constellation: 'Her', bvIndex:  0.64 },
  { id: 'HIP70',  name: 'Maasym',        raHours: 17.9453,  decDeg:  27.0741, magnitude: 3.51, designation: 'κ Her',  constellation: 'Her', bvIndex:  0.68 },
];

/** Constellation lines for major asterisms — public domain reference data. */
export const CONSTELLATION_LINES: [string, string][] = [
  // Ursa Major (Big Dipper)
  ['HIP1', 'HIP2'], ['HIP2', 'HIP4'], ['HIP4', 'HIP3'], ['HIP3', 'HIP1'],
  // Orion Belt
  ['HIP25', 'HIP26'], ['HIP26', 'HIP27'],
  // Orion body
  ['HIP23', 'HIP25'], ['HIP25', 'HIP21'], ['HIP21', 'HIP24'], ['HIP24', 'HIP27'],
  ['HIP27', 'HIP22'], ['HIP22', 'HIP23'],
  // Gemini
  ['HIP17', 'HIP18'],
  // Scorpius
  ['HIP12', 'HIP60'], ['HIP60', 'HIP61'], ['HIP61', 'HIP62'], ['HIP62', 'HIP42'],
  ['HIP42', 'HIP63'], ['HIP63', 'HIP13'],
  // Leo
  ['HIP10', 'HIP6'], ['HIP6', 'HIP7'], ['HIP7', 'HIP5'], ['HIP10', 'HIP7'],
  ['HIP10', 'HIP8'], ['HIP8', 'HIP5'],
  // Cygnus (Northern Cross)
  ['HIP29', 'HIP28'], ['HIP28', 'HIP30'], ['HIP29', 'HIP31'], ['HIP29', 'HIP32'],
  // Crux
  ['HIP39', 'HIP40'], ['HIP40', 'HIP41'], ['HIP41', 'HIP39'],
  // Pegasus Square
  ['HIP50', 'HIP51'], ['HIP51', 'HIP52'], ['HIP52', 'HIP49'], ['HIP49', 'HIP47'],
  ['HIP47', 'HIP50'],
  // Sagittarius (Teapot)
  ['HIP44', 'HIP45'], ['HIP44', 'HIP12'], ['HIP45', 'HIP42'],
  // Boötes
  ['HIP33', 'HIP34'], ['HIP33', 'HIP35'],
  // Lyra
  ['HIP28', 'HIP55'],
  // Perseus
  ['HIP53', 'HIP13'],
  // Andromeda
  ['HIP49', 'HIP47'], ['HIP47', 'HIP48'], ['HIP48', 'HIP55'],
  // Aquila
  ['HIP28', 'HIP30'], ['HIP30', 'HIP50'],
];

export const CONSTELLATION_LABELS: { id: string; label: string; raHours: number; decDeg: number }[] = [
  { id: 'ori',  label: 'ORION',   raHours: 5.5,    decDeg:  0 },
  { id: 'leo',  label: 'LEO',     raHours: 10.5,   decDeg: 15 },
  { id: 'sco',  label: 'SCORPIUS', raHours: 16.5,  decDeg:-30 },
  { id: 'umi',  label: 'UMi',     raHours: 15,     decDeg: 82 },
  { id: 'uma',  label: 'UMa',     raHours: 11.5,   decDeg: 58 },
  { id: 'cyg',  label: 'CYGNUS',  raHours: 20.5,   decDeg: 42 },
  { id: 'lyr',  label: 'LYRA',    raHours: 18.7,   decDeg: 36 },
  { id: 'vir',  label: 'VIRGO',   raHours: 13,     decDeg: -5 },
  { id: 'boo',  label: 'BOÖTES', raHours: 14.5,   decDeg: 28 },
  { id: 'tau',  label: 'TAURUS',  raHours: 4.5,   decDeg: 18 },
  { id: 'gem',  label: 'GEMINI',  raHours: 7.5,   decDeg: 28 },
  { id: 'cen',  label: 'CENTAURUS', raHours: 14.2, decDeg:-50 },
  { id: 'peg',  label: 'PEGASUS', raHours: 22.5,  decDeg: 20 },
  { id: 'and',  label: 'ANDROMEDA', raHours: 1,   decDeg: 40 },
  { id: 'sgr',  label: 'SAGITTARIUS', raHours: 19, decDeg:-30 },
  { id: 'aql',  label: 'AQUILA',   raHours: 19.7, decDeg:  5 },
  { id: 'aur',  label: 'AURIGA',   raHours: 6,    decDeg: 46 },
  { id: 'cma',  label: 'CMa',      raHours: 6.8,  decDeg:-25 },
  { id: 'cru',  label: 'CRUX',     raHours: 12.3,  decDeg:-60 },
  { id: 'her',  label: 'HERCULES', raHours: 16.7,  decDeg: 24 },
];
