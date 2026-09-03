#!/usr/bin/env node
/**
 * Seed fixture builder — qualification/astronomy golden fixture set (Sprint C v2).
 *
 * Builds qualification/fixtures/astronomy-golden-fixtures.json from EXTERNALLY
 * retrieved reference values:
 *   - Sun..Saturn: NASA/JPL Horizons API, quantity 31 (ObsEcLon / ObsEcLat =
 *     observer-centered IAU76/80 ecliptic-of-date longitude/latitude of the target
 *     center's APPARENT position, with light-time, gravitational deflection of light,
 *     and stellar aberration), geocentric (CENTER='500@399'), DE441-based.
 *     Retrieved 2026-09-03 via ssd.jpl.nasa.gov/api/horizons.api with
 *     START 1900-01-01 12:00 UT, STOP 2100-01-01 12:00 UT, STEP 10 calendar years
 *     (21 epochs x 7 bodies = 147 rows). Values at 1950/2000/2050/2100 reproduce the
 *     Sprint B 50-year seed exactly (cross-consistency verified).
 *   - Rahu/Ketu: computed here by an INDEPENDENT implementation of the published
 *     Meeus (Astronomical Algorithms, ch. 47) mean-lunar-node series — production
 *     code is NOT imported. Status SOURCE_SECONDARY until externally re-verified.
 *
 * The builder is deterministic: running it twice produces byte-identical JSON.
 * Re-run:  node qualification/tools/build-seed-fixtures.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/* Reference epochs (UTC) — must match the Horizons retrieval above exactly. */
const EPOCH_TAGS = [];
for (let year = 1900; year <= 2100; year += 10) EPOCH_TAGS.push(String(year));
const EPOCHS = EPOCH_TAGS.map(tag => ({
  tag,
  utc: `${tag}-01-01T12:00:00.000Z`,
  horizonsTag: `${tag}-Jan-01 12:00`
}));

/* ObsEcLon / ObsEcLat parsed from the Horizons CSV blocks retrieved 2026-09-03. */
const JPL_ROWS = {
  Sun: {
    jplNumber: '10',
    lon: {
      '1900': 280.6632209, '1910': 280.2163113, '1920': 279.7909893, '1930': 280.3677529,
      '1940': 279.9284358, '1950': 280.5143619, '1960': 280.0846605, '1970': 280.6659107,
      '1980': 280.2244255, '1990': 280.8142513, '2000': 280.3689092, '2010': 280.9605709,
      '2020': 280.5192141, '2030': 281.1121201, '2040': 280.6667349, '2050': 281.2579365,
      '2060': 280.8121573, '2070': 281.3991577, '2080': 280.9657403, '2090': 281.5519666,
      '2100': 281.1136513
    },
    lat: {
      '1900': 0.0000843, '1910': 0.0000703, '1920': 0.0000632, '1930': -0.0000433,
      '1940': -0.0000359, '1950': 0.0000016, '1960': 0.0001593, '1970': -0.0000160,
      '1980': -0.0001505, '1990': 0.0000235, '2000': 0.0002381, '2010': -0.0000042,
      '2020': -0.0001245, '2030': -0.0000444, '2040': 0.0000972, '2050': 0.0000982,
      '2060': 0.0000542, '2070': -0.0001437, '2080': -0.0000528, '2090': 0.0002043,
      '2100': 0.0000681
    }
  },
  Moon: {
    jplNumber: '301',
    lon: {
      '1900': 279.6163189, '1910': 167.6146387, '1920': 39.2147447, '1930': 296.7941777,
      '1940': 180.7502195, '1950': 67.5445015, '1960': 317.4826204, '1970': 197.0194903,
      '1980': 89.7362917, '1990': 333.2676928, '2000': 223.3237860, '2010': 110.7738207,
      '2020': 352.0847209, '2030': 245.7295474, '2040': 122.1278913, '2050': 25.3809518,
      '2060': 253.6837578, '2070': 159.2927446, '2080': 24.9385980, '2090': 289.0619284,
      '2100': 164.4237526
    },
    lat: {
      '1900': 1.7442764, '1910': 5.1145973, '1920': 1.3128223, '1930': -4.9100092,
      '1940': -2.1775111, '1950': 4.1114468, '1960': 3.2682331, '1970': -2.7752888,
      '1980': -4.4589681, '1990': 1.4706887, '2000': 5.1707422, '2010': 0.0282694,
      '2020': -5.0742207, '2030': -1.7910769, '2040': 3.9641394, '2050': 2.9106435,
      '2060': -2.3645198, '2070': -4.0302496, '2080': 0.5993267, '2090': 4.8230225,
      '2100': 0.4783108
    }
  },
  Mercury: {
    jplNumber: '199',
    lon: {
      '1900': 259.6392831, '1910': 296.4560145, '1920': 260.3996147, '1930': 298.7674567,
      '1940': 262.8915404, '1950': 299.9719890, '1960': 265.7063426, '1970': 299.2841647,
      '1980': 268.7205011, '1990': 295.6728108, '2000': 271.8892699, '2010': 288.4689185,
      '2020': 275.1713729, '2030': 278.7782794, '2040': 278.5314962, '2050': 269.6007343,
      '2060': 281.9441835, '2070': 263.2819928, '2080': 285.3891164, '2090': 260.0702100,
      '2100': 288.8176381
    },
    lat: {
      '1900': 1.0559217, '1910': -1.9495570, '1920': 0.6843303, '1930': -1.6403166,
      '1940': 0.2070045, '1950': -1.1360465, '1960': -0.2324631, '1970': -0.3849994,
      '1980': -0.6335667, '1990': 0.6303142, '2000': -0.9948190, '2010': 1.7934625,
      '2020': -1.3160540, '2030': 2.7525049, '2040': -1.5939723, '2050': 3.1648473,
      '2060': -1.8254536, '2070': 3.0485837, '2080': -2.0048845, '2090': 2.6375164,
      '2100': -2.1234914
    }
  },
  Venus: {
    jplNumber: '299',
    lon: {
      '1900': 306.9960853, '1910': 323.1219113, '1920': 236.6105642, '1930': 271.6915252,
      '1940': 308.9158260, '1950': 317.1524787, '1960': 238.9700906, '1970': 275.0824166,
      '1980': 312.0137777, '1990': 306.2219469, '2000': 241.5657794, '2010': 278.4790898,
      '2020': 315.0222601, '2030': 289.2694198, '2040': 244.3530445, '2050': 281.8772060,
      '2060': 317.9154473, '2070': 269.6224850, '2080': 247.2842832, '2090': 285.2710909,
      '2100': 320.6717010
    },
    lat: {
      '1900': -1.6864262, '1910': -0.0962218, '1920': 2.5187655, '1930': -0.0989797,
      '1940': -1.7479045, '1950': 0.7281321, '1960': 2.2894970, '1970': -0.2802567,
      '1980': -1.8001991, '1990': 1.9011725, '2000': 2.0663548, '2010': -0.4555498,
      '2020': -1.8347157, '2030': 3.2846046, '2040': 1.8480322, '2050': -0.6241418,
      '2060': -1.8491643, '2070': 4.2726831, '2080': 1.6333450, '2090': -0.7854510,
      '2100': -1.8411270
    }
  },
  Mars: {
    jplNumber: '499',
    lon: {
      '1900': 284.2529683, '1910': 18.1237226, '1920': 196.7511846, '1930': 272.2935868,
      '1940': 358.3025734, '1950': 182.3944399, '1960': 260.6714975, '1970': 342.6091072,
      '1980': 164.0564199, '1990': 250.0000748, '2000': 327.9632921, '2010': 138.7386057,
      '2020': 238.7208540, '2030': 315.0944146, '2040': 102.2873871, '2050': 228.0323919,
      '2060': 302.0985043, '2070': 61.1748519, '2080': 216.3763259, '2090': 290.3817390,
      '2100': 29.7293424
    },
    lat: {
      '1900': -0.9282320, '1910': 0.4745719, '1920': 1.9470382, '1930': -0.6828430,
      '1940': -0.3368220, '1950': 2.5214883, '1960': -0.3756352, '1970': -0.8016836,
      '1980': 3.1457264, '1990': -0.0329299, '2000': -1.0677752, '2010': 3.7778664,
      '2020': 0.3566210, '2030': -1.1618117, '2040': 3.7681024, '2050': 0.7689547,
      '2060': -1.1357587, '2070': 2.4774733, '2080': 1.2194647, '2090': -1.0059489,
      '2100': 0.9614072
    }
  },
  Jupiter: {
    jplNumber: '599',
    lon: {
      '1900': 241.2335461, '1910': 193.3180443, '1920': 136.9605378, '1930': 67.8344043,
      '1940': 1.2127020, '1950': 306.6180197, '1960': 258.8477350, '1970': 212.3931247,
      '1980': 160.1889662, '1990': 95.1487783, '2000': 25.2530685, '2010': 326.4601571,
      '2020': 276.7855420, '2030': 230.6623346, '2040': 181.4796684, '2050': 121.6321947,
      '2060': 51.1416873, '2070': 347.5922066, '2080': 295.1782583, '2090': 248.5198863,
      '2100': 201.2591617
    },
    lat: {
      '1900': 0.8144197, '1910': 1.3089820, '1920': 0.7948369, '1930': -0.6885629,
      '1940': -1.2929376, '1950': -0.5843696, '1960': 0.4727215, '1970': 1.2106549,
      '1980': 1.1300095, '1990': -0.1169982, '2000': -1.2621868, '2010': -0.9341904,
      '2020': 0.0878157, '2030': 1.0007646, '2040': 1.2839608, '2050': 0.4594467,
      '2060': -0.9981148, '2070': -1.1903251, '2080': -0.3129225, '2090': 0.7058739,
      '2100': 1.2784452
    }
  },
  Saturn: {
    jplNumber: '699',
    lon: {
      '1900': 267.7748827, '1910': 16.5200071, '1920': 161.6027201, '1930': 273.7710753,
      '1940': 24.4338849, '1950': 169.4355254, '1960': 279.5153553, '1970': 32.0598112,
      '1980': 176.9922191, '1990': 285.6574897, '2000': 40.3956366, '2010': 184.5178423,
      '2020': 291.4534813, '2030': 48.3812881, '2040': 191.6723482, '2050': 297.6321469,
      '2060': 57.1311951, '2070': 198.8858039, '2080': 303.5156595, '2090': 65.3824580,
      '2100': 205.6604687
    },
    lat: {
      '1900': 1.0073267, '1910': -2.5348390, '1920': 1.8036735, '1930': 0.7739473,
      '1940': -2.5492215, '1950': 2.0084798, '1960': 0.5428653, '1970': -2.5221050,
      '1980': 2.1635180, '1990': 0.2933231, '2000': -2.4448533, '2010': 2.2902029,
      '2020': 0.0511831, '2030': -2.3279871, '2040': 2.3674845, '2050': -0.2041414,
      '2060': -2.1509666, '2070': 2.4181034, '2080': -0.4488261, '2090': -1.9437339,
      '2100': 2.4242812
    }
  }
};

const JPL_HORIZONS_LOCATOR =
  'NASA/JPL Horizons API ssd.jpl.nasa.gov/api/horizons.api?format=json&EPHEM_TYPE=OBSERVER&CENTER=500@399' +
  '&START_TIME=1900-01-01%2012:00:00&STOP_TIME=2100-01-01%2012:00:00&STEP_SIZE=10y&QUANTITIES=31&CSV_FORMAT=YES' +
  " (COMMAND='<jplNumber>', OBJ_DATA='NO', MAKE_EPHEM='YES'); retrieved 2026-09-03; source ephemerides DE441 family";

/**
 * INDEPENDENT mean lunar node series (Meeus, Astronomical Algorithms ch. 47).
 * Tropical ecliptic longitude of the MEAN ascending node, degrees.
 * Deliberately implemented here without importing src/lib — protects against
 * circular testing (Mission Section 21).
 */
function independentMeanNodeTropicalDeg(julianDayTT) {
  const T = (julianDayTT - 2451545.0) / 36525.0;
  const omega =
    125.0445479 -
    1934.1362891 * T +
    0.0020754 * T * T +
    (T * T * T) / 467441 -
    (T * T * T * T) / 60616000;
  return ((omega % 360) + 360) % 360;
}

/* UTC Julian Day for the fixture epochs (Gregorian). */
function julianDayUtc(iso) {
  const t = Date.UTC(
    Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)),
    Number(iso.slice(11, 13)), Number(iso.slice(14, 16)), Number(iso.slice(17, 19))
  );
  return t / 86400000 + 2440587.5;
}

function sha256OfRow(row) {
  const canonical = JSON.stringify({
    fixtureId: row.fixtureId,
    utcTimestamp: row.utcTimestamp,
    point: row.point,
    tropicalEclipticLongitudeDeg: row.tropicalEclipticLongitudeDeg,
    tropicalEclipticLatitudeDeg: row.tropicalEclipticLatitudeDeg,
    referenceFrame: row.referenceFrame
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

function build() {
  const fixtures = [];

  for (const [point, def] of Object.entries(JPL_ROWS)) {
    for (const epoch of EPOCHS) {
      fixtures.push({
        fixtureId: `JPL-DE441-${epoch.tag}-${point.toUpperCase()}`,
        utcTimestamp: epoch.utc,
        point,
        tropicalEclipticLongitudeDeg: def.lon[epoch.tag],
        tropicalEclipticLatitudeDeg: def.lat[epoch.tag],
        referenceFrame: 'apparent geocentric ecliptic-of-date (IAU76/80), light-time + stellar aberration',
        sourceStatus: 'SOURCE_VERIFIED',
        sourceLocator: JPL_HORIZONS_LOCATOR.replace('<jplNumber>', def.jplNumber)
      });
    }
  }

  /* Rahu/Ketu analytic rows (independent Meeus-series computation, SOURCE_SECONDARY). */
  for (const epoch of EPOCHS) {
    const jd = julianDayUtc(epoch.utc);
    const rahu = independentMeanNodeTropicalDeg(jd);
    const ketu = ((rahu + 180) % 360 + 360) % 360;
    const locator =
      'Mean lunar node series per Meeus, Astronomical Algorithms ch. 47 ' +
      '(Ω = 125.0445479 − 1934.1362891·T + 0.0020754·T² + T³/467441 − T⁴/60616000), computed independently ' +
      'of production code by qualification/tools/build-seed-fixtures.cjs; status SOURCE_SECONDARY until re-verified against Swiss/JPL numerics (Sprint C+)';
    fixtures.push({
      fixtureId: `MEANNODE-${epoch.tag}-RAHU`,
      utcTimestamp: epoch.utc,
      point: 'Rahu',
      tropicalEclipticLongitudeDeg: Number(rahu.toFixed(7)),
      tropicalEclipticLatitudeDeg: 0,
      referenceFrame: 'mean ascending node, tropical ecliptic of date (analytic series)',
      sourceStatus: 'SOURCE_SECONDARY',
      sourceLocator: locator
    });
    fixtures.push({
      fixtureId: `MEANNODE-${epoch.tag}-KETU`,
      utcTimestamp: epoch.utc,
      point: 'Ketu',
      tropicalEclipticLongitudeDeg: Number(ketu.toFixed(7)),
      tropicalEclipticLatitudeDeg: 0,
      referenceFrame: 'mean descending node = mean ascending node + 180° (Registry §2.2)',
      sourceStatus: 'SOURCE_SECONDARY',
      sourceLocator: locator
    });
  }

  /* Integrity hashes — computed AFTER rows are finalized. */
  for (const row of fixtures) {
    row.contentSha256 = sha256OfRow(row);
  }
  const setSha = crypto
    .createHash('sha256')
    .update(fixtures.map(r => r.contentSha256).sort().join('|'))
    .digest('hex');

  const fixtureSet = {
    schemaVersion: '1.0.0',
    fixtureSetId: 'ASTRO_SEED_JPL_DE441_002',
    provenance: {
      source: 'NASA/JPL Horizons on-demand ephemeris system (ssd.jpl.nasa.gov)',
      quantity: '31 (ObsEcLon, ObsEcLat) — apparent geocentric ecliptic-of-date, geocentric observer 500@399',
      retrievedAtUtc: '2026-09-03T21:20:00Z',
      notes: [
        '21 epochs at exact 10-calendar-year steps 1900→2100 (UTC instants on the Horizons step grid).',
        'Times PRIOR to 1962 are UT1 per Horizons conventions; post-1962 are UTC.',
        'Values at 1950/2000/2050/2100 reproduce the Sprint B 50-year seed set exactly (v1 cross-consistency).',
        'Rahu/Ketu rows are independent analytic-series values (SOURCE_SECONDARY), not Horizons numerics.',
        'Sprint C corpus: 147 JPL rows (SOURCE_VERIFIED) + 42 analytic node rows = 189 rows. Sprint C+ replaces this with the full 100,000-row external corpus via bulk retrieval in a network-enabled environment.'
      ]
    },
    fixtures,
    fixtureSetSha256: setSha
  };

  const outPath = path.join(__dirname, '..', 'fixtures', 'astronomy-golden-fixtures.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(fixtureSet, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${fixtures.length} fixtures -> ${outPath}`);
  console.log(`fixtureSetSha256=${setSha}`);
}

build();
