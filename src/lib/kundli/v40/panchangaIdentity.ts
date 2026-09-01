/**
 * KUNDLI V40 — Panchanga identity, with an honest lunar month (§7).
 *
 * The panchang kernel emits `masa.amanta` and `masa.purnimanta`, but
 * `src/lib/panchang.js:383-384` assigns the SAME string to both, and the month
 * itself is derived from the Sun's sidereal sign rather than from the new-moon
 * instant. Presenting that single value under two convention names would be a
 * fabricated fact.
 *
 * V40 therefore reports the computed value once, under the convention its
 * derivation actually approximates (amanta), and reports the purnimanta name
 * as NOT_CALCULATED with the reason. The kernel is not edited; the report
 * simply refuses to consume a duplicated field.
 */

import type { KundliCanonicalModel } from '../types';
import type { CapabilityStatus, ContentType } from './contentTypes';
import { FACT } from './factPaths';

export const PANCHANGA_IDENTITY_VERSION = 'panchanga-identity-v1';

export interface MasaReport {
  amanta: { status: CapabilityStatus; value?: string; method?: string; reason?: string; evidenceIds: string[] };
  purnimanta: { status: CapabilityStatus; value?: string; reason?: string; evidenceIds: string[] };
  defect: string;
}

export interface PanchangaIdentity {
  version: string;
  tithi: { name: string; number: number; paksha: string; evidenceIds: string[] };
  nakshatra: { name: string; pada: number; ruler: string; evidenceIds: string[] };
  yoga: { name: string; evidenceIds: string[] };
  karana: { name: string; evidenceIds: string[] };
  ayana: { value: string; evidenceIds: string[] };
  ritu: { value: string; evidenceIds: string[] };
  masa: MasaReport;
  samvat: { value: string; evidenceIds: string[] };
  contentType: ContentType;
}

export function buildPanchangaIdentity(canonical: KundliCanonicalModel): PanchangaIdentity {
  const p = canonical.panchanga;
  const masaValue = (p.masa ?? '').trim();

  return {
    version: PANCHANGA_IDENTITY_VERSION,
    tithi: {
      name: p.tithi.name,
      number: p.tithi.number,
      paksha: p.tithi.paksha,
      evidenceIds: [FACT.tithi],
    },
    nakshatra: {
      name: p.nakshatra.name,
      pada: p.nakshatra.pada,
      ruler: p.nakshatra.ruler,
      evidenceIds: [FACT.panchangaNakshatra, FACT.panchangaPada],
    },
    yoga: { name: p.yoga.name, evidenceIds: [FACT.panchangaYoga] },
    karana: { name: p.karana.name, evidenceIds: [FACT.panchangaKarana] },
    ayana: { value: p.ayana, evidenceIds: [FACT.ayana] },
    ritu: { value: p.ritu, evidenceIds: [FACT.ritu] },
    samvat: { value: p.samvat, evidenceIds: [FACT.samvat] },
    masa: {
      amanta: masaValue
        ? {
            status: 'CALCULATED',
            value: masaValue,
            method:
              'Derived by the panchang kernel from the Sun\'s sidereal rashi at birth (masa index = solar rashi + 1). ' +
              'This approximates the amanta month name; it is not derived from the new-moon instant.',
            evidenceIds: [FACT.masa],
          }
        : {
            status: 'NOT_CALCULATED',
            reason: 'The canonical panchanga carries no lunar-month value.',
            evidenceIds: [FACT.masa],
          },
      purnimanta: {
        status: 'NOT_CALCULATED',
        reason:
          'The purnimanta month name is not independently computed. The panchang engine exposes a `purnimanta` field, ' +
          'but it is a copy of the amanta value, and converting one convention to the other requires the new-moon and ' +
          'full-moon instants, which this build does not compute. Reporting the copied value would be a fabricated fact.',
        evidenceIds: [],
      },
      defect:
        'PANCHANG_MASA_DUPLICATE — panchang.js emits identical amanta and purnimanta strings. Recorded in ' +
        'forensic/v40-current-architecture.md as V40-D02; the kernel is not modified by the V40 work.',
    },
    contentType: 'CALCULATED_FACT',
  };
}
