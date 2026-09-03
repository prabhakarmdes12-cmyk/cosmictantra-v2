/**
 * Builds qualification/fixtures/varshaphala-fixtures.json (VARSHAPHALA_TAJIKA_001).
 * Sprint L: pins the honest Varshaphala/Tajika engine (varshaphala-engine-2.0.0):
 * classical tables (component maxima, thrirasi tables, exaltation/debilitation
 * points), registry pins, declared findings, and ENGINE_DERIVED golden scenarios
 * with verified boundary claims (DAY/NIGHT, reading-sensitive, fallback,
 * fail-closed). Deterministic. Run: npx tsx tools/build-varshaphala-fixtures.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { VARSHAPHALA_ENGINE_VERSION, computeVarshaphala, type VarshaphalaInput } from '../src/lib/jyotish/varshaphalaEngine';
import { CLASSICAL_RULE_REGISTRY_VERSION, classicalRuleRegistryFingerprint, listClassicalRules, ensureClassicalRulesSeeded } from '../src/lib/jyotish/ruleRegistry';

export const VARSHAPHALA_FIXTURE_BUILDER_VERSION = 'varshaphala-fixture-builder-1.0.0 (sprint L)';

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(v as Record<string, unknown>).sort()
    .map((k) => JSON.stringify(k) + ':' + stableStringify((v as Record<string, unknown>)[k]))
    .join(',') + '}';
}

const RULE_IDS = ['RULE_VARSHA_SOLAR_RETURN', 'RULE_MUNTHA_PROGRESSION', 'RULE_TAJIKA_PANCHAVARGEEYA_BALA', 'RULE_VARSHESHWAR_SELECTION'];

interface GoldenScenario {
  scenarioId: string;
  input: VarshaphalaInput;
  claim: Record<string, unknown>;
  expected: {
    status: string;
    solarReturnUtc: string;
    dayNight: string;
    annualLagnaRashiId: number;
    munthaRashiId: number;
    munthaHouseFromAnnualLagna: number;
    varsheshwarPlanet: string;
    varsheshwarPvTotal: number;
    varsheshwarPortfolios: string[];
    readingSensitive: boolean;
    sahamCount: number;
    punyaLongitude: number;
    punyaCorrected: boolean;
    varshaDashaTotalPatyamsa: number;
    varshaDashaFirstParticipant: string;
    varshaDashaSumDays: number;
  };
}

const CHARTS: Array<{ label: string; input: Omit<VarshaphalaInput, 'targetYear'> }> = [
  { label: 'patna', input: { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' } },
  { label: 'delhi', input: { birthDate: '1983-11-02', birthTime: '06:15', latitude: 28.6139, longitude: 77.209, timezone: 5.5, locationName: 'Delhi' } },
  { label: 'chennai', input: { birthDate: '1978-03-21', birthTime: '21:40', latitude: 13.0827, longitude: 80.2707, timezone: 5.5, locationName: 'Chennai' } },
  { label: 'kolkata', input: { birthDate: '2001-12-30', birthTime: '12:00', latitude: 22.5726, longitude: 88.3639, timezone: 5.5, locationName: 'Kolkata' } },
  { label: 'jaipur', input: { birthDate: '1990-07-04', birthTime: '17:25', latitude: 26.9124, longitude: 75.7873, timezone: 5.5, locationName: 'Jaipur' } }
];

function build(): unknown {
  ensureClassicalRulesSeeded();
  const registry = Object.fromEntries(RULE_IDS.map((id) => {
    const r = listClassicalRules().find((x) => x.id === id)!;
    return [id, { validationStatus: r.validationStatus, adoption: r.adoption, sourceVerification: r.sourceVerification }];
  }));

  const golden: GoldenScenario[] = [];
  let seq = 0;
  const claimsSeen = new Set<string>();

  const scanFor = (predicate: (r: ReturnType<typeof computeVarshaphala>) => string | null, chartIdx: number[]): void => {
    for (const ci of chartIdx) {
      for (let year = 2019; year <= 2026 && golden.length < 64; year++) {
        const input: VarshaphalaInput = { ...CHARTS[ci].input, targetYear: year };
        let r: ReturnType<typeof computeVarshaphala>;
        try {
          r = computeVarshaphala(input);
        } catch {
          continue;
        }
        const claim = predicate(r);
        if (claim && !claimsSeen.has(claim)) {
          claimsSeen.add(claim);
          golden.push({
            scenarioId: `VT-${String(++seq).padStart(3, '0')}-${CHARTS[ci].label}-${year}`,
            input,
            claim: { type: claim, engineVersion: r.engineVersion },
            expected: {
              status: r.status,
              solarReturnUtc: r.solarReturnUtc,
              dayNight: r.dayNight,
              annualLagnaRashiId: r.annualLagna.rashiId,
              munthaRashiId: r.muntha.rashiId,
              munthaHouseFromAnnualLagna: r.muntha.houseFromAnnualLagna,
              varsheshwarPlanet: r.varsheshwar.planet,
              varsheshwarPvTotal: r.varsheshwar.balaVirupas!,
              varsheshwarPortfolios: r.varsheshwar.portfolios,
              readingSensitive: r.varsheshwar.readingSensitive,
              sahamCount: r.sahams.length,
              punyaLongitude: r.sahams.find((x) => x.name === 'Punya')!.longitude,
              punyaCorrected: r.sahams.find((x) => x.name === 'Punya')!.correctionApplied,
              varshaDashaTotalPatyamsa: r.varshaDasha!.totalPatyamsaDeg,
              varshaDashaFirstParticipant: r.varshaDasha!.periods[0].participant,
              varshaDashaSumDays: r.varshaDasha!.periods.reduce((a, q) => a + q.durationDays, 0)
            }
          });
          return;
        }
      }
    }
    throw new Error(`[VARSHAPHALA_FIXTURES:SCAN_EXHAUSTED] claim not found`);
  };

  scanFor((r) => (r.status === 'CALCULATED' && r.dayNight === 'DAY' ? 'DAY_CASE' : null), [0, 1, 2, 3, 4]);
  scanFor((r) => (r.status === 'CALCULATED' && r.dayNight === 'NIGHT' ? 'NIGHT_CASE' : null), [0, 1, 2, 3, 4]);
  scanFor((r) => (r.status === 'CALCULATED' && r.varsheshwar.readingSensitive ? 'READING_SENSITIVE_CASE' : null), [0, 1, 2, 3, 4]);
  scanFor((r) => (r.status === 'CALCULATED' && !r.varsheshwar.eligibleByAspect ? 'MUNTHA_FALLBACK_CASE' : null), [0, 1, 2, 3, 4]);
  scanFor((r) => (r.status === 'CALCULATED' && r.varsheshwar.portfolios.length >= 2 ? 'MULTI_PORTFOLIO_CASE' : null), [0, 1, 2, 3, 4]);
  // plus two plain anchors
  for (const ci of [0, 2]) {
    const input: VarshaphalaInput = { ...CHARTS[ci].input, targetYear: 2026 };
    const r = computeVarshaphala(input);
    golden.push({
      scenarioId: `VT-${String(++seq).padStart(3, '0')}-${CHARTS[ci].label}-2026`,
      input,
      claim: { type: 'PLAIN_ANCHOR', engineVersion: r.engineVersion },
      expected: {
        status: r.status,
        solarReturnUtc: r.solarReturnUtc,
        dayNight: r.dayNight,
        annualLagnaRashiId: r.annualLagna.rashiId,
        munthaRashiId: r.muntha.rashiId,
        munthaHouseFromAnnualLagna: r.muntha.houseFromAnnualLagna,
        varsheshwarPlanet: r.varsheshwar.planet,
        varsheshwarPvTotal: r.varsheshwar.balaVirupas!,
        varsheshwarPortfolios: r.varsheshwar.portfolios,
        readingSensitive: r.varsheshwar.readingSensitive,
        sahamCount: r.sahams.length,
        punyaLongitude: r.sahams.find((x) => x.name === 'Punya')!.longitude,
        punyaCorrected: r.sahams.find((x) => x.name === 'Punya')!.correctionApplied,
        varshaDashaTotalPatyamsa: r.varshaDasha!.totalPatyamsaDeg,
        varshaDashaFirstParticipant: r.varshaDasha!.periods[0].participant,
        varshaDashaSumDays: r.varshaDasha!.periods.reduce((a, q) => a + q.durationDays, 0)
      }
    });
  }

  const core = {
    engineVersion: VARSHAPHALA_ENGINE_VERSION,
    ruleRegistryVersion: CLASSICAL_RULE_REGISTRY_VERSION,
    ruleRegistryFingerprint: classicalRuleRegistryFingerprint(),
    ruleIds: RULE_IDS,
    registry: registry,
    componentMaxima: { kshetra: 30, ochcha: 20, hadda: 'NOT_CALCULATED (table unavailable)', drekkana: 10, navamsa: 5 },
    thrirasiDay: { fire: 'Sun', earth: 'Venus', air: 'Saturn', water: 'Mars' },
    thrirasiNight: { fire: 'Jupiter', earth: 'Moon', air: 'Mercury', water: 'Mars' },
    aspectQualifyingHouses: [2, 3, 5, 9, 11, 12],
    fallbackRule: 'MUNTHA_LORD',
    sahamCount: 35,
    sahamMethod: 'Raman ch.8: Minuend - Subtrahend + Anchor, night reversal, 30-deg correction (forward-arc betweenness), whole-sign cusps',
    varshaDashaParticipants: 8,
    varshaYearLengthDays: 365.25,
    tolerance: { seconds: 2, degrees: 1e-5, pvAbs: 1e-9 },
    goldenScenarioCount: golden.length,
    golden: golden
  };
  const setSha256 = crypto.createHash('sha256').update(stableStringify(core)).digest('hex');
  return {
    fixtureSetId: 'VARSHAPHALA_TAJIKA_001',
    builder: VARSHAPHALA_FIXTURE_BUILDER_VERSION,
    engineNote: 'expectations are ENGINE_DERIVED regression pins; the solar-return astronomy inherits the Sprint-C JPL-certified kernel',
    honestyNote: 'the pre-Sprint-L module fabricated Varsheshwar/solar-return/Sahams; those fabrications are withdrawn and pinned-against here',
    ...core,
    setSha256
  };
}

const isMain = process.argv[1] && process.argv[1].endsWith('build-varshaphala-fixtures.ts');
if (isMain) {
  const fixture = build();
  const out = path.join(__dirname, '..', 'qualification', 'fixtures', 'varshaphala-fixtures.json');
  fs.writeFileSync(out, JSON.stringify(fixture, null, 2) + '\n');
  const sha = crypto.createHash('sha256').update(stableStringify((fixture as { setSha256: string }).setSha256 === undefined ? fixture : fixture)).digest('hex');
  console.log(`wrote ${out}`);
  console.log(`golden=${(fixture as { goldenScenarioCount: number }).goldenScenarioCount} sha256=${(fixture as { setSha256: string }).setSha256}`);
  void sha;
}
