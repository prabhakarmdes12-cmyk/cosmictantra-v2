#!/usr/bin/env node
/**
 * Seed fixture builder — qualification/astronomy golden fixture set (Sprint B).
 *
 * Builds qualification/fixtures/astronomy-golden-fixtures.json from EXTERNALLY
 * retrieved reference values:
 *   - Sun..Saturn: NASA/JPL Horizons API, quantity 31 (ObsEcLon / ObsEcLat =
 *     observer-centered IAU76/80 ecliptic-of-date longitude/latitude of the target
 *     center's APPARENT position, with light-time, gravitational deflection of light,
 *     and stellar aberration), geocentric (CENTER='500@399'), DE441-based.
 *     Retrieved 2026-09-03 via ssd.jpl.nasa.gov/api/horizons.api with
 *     START 1950-01-01 12:00 UT, STOP 2100-01-01 12:00 UT, STEP 50 calendar years.
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

/* Reference epochs (UTC). Must match the Horizons retrieval above exactly. */
const EPOCHS = [
  { tag: '1950', utc: '1950-01-01T12:00:00.000Z', horizonsTag: '1950-Jan-01 12:00' },
  { tag: '2000', utc: '2000-01-01T12:00:00.000Z', horizonsTag: '2000-Jan-01 12:00' },
  { tag: '2050', utc: '2050-01-01T12:00:00.000Z', horizonsTag: '2050-Jan-01 12:00' },
  { tag: '2100', utc: '2100-01-01T12:00:00.000Z', horizonsTag: '2100-Jan-01 12:00' }
];

/* ObsEcLon / ObsEcLat parsed from the Horizons CSV blocks retrieved 2026-09-03. */
const JPL_ROWS = {
  Sun: {
    jplNumber: '10',
    lon: { '1950': 280.5143619, '2000': 280.3689092, '2050': 281.2579365, '2100': 281.1136513 },
    lat: { '1950': 0.0000016, '2000': 0.0002381, '2050': 0.0000982, '2100': 0.0000681 }
  },
  Moon: {
    jplNumber: '301',
    lon: { '1950': 67.5445015, '2000': 223.3237860, '2050': 25.3809518, '2100': 164.4237526 },
    lat: { '1950': 4.1114468, '2000': 5.1707422, '2050': 2.9106435, '2100': 0.4783108 }
  },
  Mercury: {
    jplNumber: '199',
    lon: { '1950': 299.9719890, '2000': 271.8892699, '2050': 269.6007343, '2100': 288.8176381 },
    lat: { '1950': -1.1360465, '2000': -0.9948190, '2050': 3.1648473, '2100': -2.1234914 }
  },
  Venus: {
    jplNumber: '299',
    lon: { '1950': 317.1524787, '2000': 241.5657794, '2050': 281.8772060, '2100': 320.6717010 },
    lat: { '1950': 0.7281321, '2000': 2.0663548, '2050': -0.6241418, '2100': -1.8411270 }
  },
  Mars: {
    jplNumber: '499',
    lon: { '1950': 182.3944399, '2000': 327.9632921, '2050': 228.0323919, '2100': 29.7293424 },
    lat: { '1950': 2.5214883, '2000': -1.0677752, '2050': 0.7689547, '2100': 0.9614072 }
  },
  Jupiter: {
    jplNumber: '599',
    lon: { '1950': 306.6180197, '2000': 25.2530685, '2050': 121.6321947, '2100': 201.2591617 },
    lat: { '1950': -0.5843696, '2000': -1.2621868, '2050': 0.4594467, '2100': 1.2784452 }
  },
  Saturn: {
    jplNumber: '699',
    lon: { '1950': 169.4355254, '2000': 40.3956366, '2050': 297.6321469, '2100': 205.6604687 },
    lat: { '1950': 2.0084798, '2000': -2.4448533, '2050': -0.2041414, '2100': 2.4242812 }
  }
};

const JPL_HORIZONS_LOCATOR =
  'NASA/JPL Horizons API ssd.jpl.nasa.gov/api/horizons.api?format=json&EPHEM_TYPE=OBSERVER&CENTER=500@399' +
  '&START_TIME=1950-01-01%2012:00:00&STOP_TIME=2100-01-01%2012:00:00&STEP_SIZE=50y&QUANTITIES=31&CSV_FORMAT=YES' +
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
      'E.M. Standish, "Keplerian Elements for Approximate Positions of the Major Planets" / JPL SSD; ' +
      'mean lunar node series per Meeus, Astronomical Algorithms ch. 47 ' +
      '(Ω = 125.0445479 − 1934.1362891·T + 0.0020754·T² + T³/467441 − T⁴/60616000), computed independently ' +
      'of production code by qualification/tools/build-seed-fixtures.cjs; status SOURCE_SECONDARY until re-verified against Swiss/JPL numerics (Sprint C)';
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
    fixtureSetId: 'ASTRO_SEED_JPL_DE441_001',
    provenance: {
      source: 'NASA/JPL Horizons on-demand ephemeris system (ssd.jpl.nasa.gov)',
      quantity: '31 (ObsEcLon, ObsEcLat) — apparent geocentric ecliptic-of-date, geocentric observer 500@399',
      retrievedAtUtc: '2026-09-03T20:50:00Z',
      notes: [
        'Epochs are UTC instants exactly on the Horizons 50-calendar-year step grid 1950→2100.',
        'Times PRIOR to 1962 are UT1 per Horizons conventions; post-1962 are UTC.',
        'Rahu/Ketu rows are independent analytic-series values (SOURCE_SECONDARY), not Horizons numerics.',
        'This is the Sprint B SEED set proving harness mechanics and external agreement on 36 reference rows; Sprint C replaces it with the 100,000-scenario mass qualification.'
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
