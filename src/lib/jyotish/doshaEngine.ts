/**
 * DOSHA ENGINE — Sprint I (charter §16).
 *
 * Kalsarpa is the first dosha formally ADOPTED here. Its variant axes were
 * registered in Sprint H (RULE_KALSARPA_VARIANTS, NOT_ADOPTED — charter §16
 * forbids exposing Kalsarpa until its definition and variants are formally
 * registered). Sprint I adopts ONE variant and declares the rest.
 *
 * ADOPTED VARIANT (declared on every result, never implied):
 *   ONE_HEMISPHERE_NODE_AXIS — all SEVEN visible grahas (Sun, Moon, Mars,
 *   Mercury, Jupiter, Venus, Saturn; the nodes themselves are the boundary and
 *   are NOT counted) occupy ONE closed half of the zodiac bounded by the
 *   Rahu-Ketu axis. A graha sharing a rashi with Rahu or Ketu makes the result
 *   INDETERMINATE (schools disagree whether boundary rashi placement breaks the
 *   yoga — never guessed here, CT_INV_006). The arc direction is recorded as
 *   evidence (RAHU_TO_KETU or KETU_TO_RAHU); the reading that requires one
 *   specific direction is a declared ALTERNATIVE, not adopted. The twelve
 *   Anant/Vasuki-type names are NOT_CALCULATED (naming rules are not adopted).
 *
 * HONESTY: no licensed Jyotish edition is held; the adopted interpretation is
 * the only authoritative statement (mirrors yogaSourceRegistry policy).
 */

export const DOSHA_ENGINE_VERSION = 'dosha-engine-1.0.0 (sprint I, kalsarpa variant adopted)';

export type KalsarpaStatus = 'PRESENT' | 'ABSENT' | 'INDETERMINATE' | 'NOT_CALCULATED';

export interface KalsarpaEvaluation {
  engineVersion: string;
  status: KalsarpaStatus;
  /** The ADOPTED variant id — declared on every result. */
  variant: 'ONE_HEMISPHERE_NODE_AXIS';
  basis: string;
  /** Which hemisphere the grahas occupy, when determined. */
  arc?: 'RAHU_TO_KETU' | 'KETU_TO_RAHU';
  evidence: string[];
  /** The classical twelve names are NOT adopted (no naming rule registered). */
  typeNaming: { status: 'NOT_CALCULATED'; reason: string };
  notCalculatedReason?: string;
  registryRuleId: 'RULE_KALSARPA_VARIANTS';
  /** Declared alternative readings this engine did NOT adopt. */
  declaredAlternatives: string[];
}

const SEVEN = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

const VARIANT_BASIS =
  'All seven visible grahas (Sun..Saturn) within ONE closed half of the zodiac bounded by the Rahu-Ketu axis; ' +
  'grahas sharing a node rashi force INDETERMINATE (boundary placement contested); nodes excluded as the boundary itself.';

const DECLARED_ALTERNATIVES = [
  'Direction-qualified readings: some schools require the grahas to occupy the arc from Rahu to Ketu in zodiacal order specifically (the mirrored arc would not qualify); this engine records the arc but accepts either direction.',
  'Boundary readings: some schools allow a graha in the same rashi as Rahu or Ketu to still count inside the hemisphere; this engine returns INDETERMINATE for such charts.',
  'Kala Amrita: the mirrored-yoga reading (planets between Ketu and Rahu named differently) is NOT adopted as a separate verdict.',
  'Moon-exclusion readings: some schools exclude the Moon from the counted grahas; the Moon IS counted here.'
];

export function evaluateKalsarpa(input: {
  /** Rashi ids (1..12) of the seven visible grahas; 0 means unresolved. */
  grahaRashis: Record<string, number>;
  rahuRashiId: number;
  ketuRashiId: number;
}): KalsarpaEvaluation {
  const base = {
    engineVersion: DOSHA_ENGINE_VERSION,
    variant: 'ONE_HEMISPHERE_NODE_AXIS' as const,
    basis: VARIANT_BASIS,
    typeNaming: {
      status: 'NOT_CALCULATED' as const,
      reason: 'The Anant/Vasuki twelve-name classification requires an adopted naming rule; none is registered.'
    },
    registryRuleId: 'RULE_KALSARPA_VARIANTS' as const,
    declaredAlternatives: DECLARED_ALTERNATIVES
  };

  const { rahuRashiId, ketuRashiId } = input;
  if (!rahuRashiId || !ketuRashiId) {
    return { ...base, status: 'NOT_CALCULATED', notCalculatedReason: 'Node rashis unresolved — Kalsarpa cannot be evaluated.', evidence: ['rahuRashiId/ ketuRashiId unresolved'] };
  }
  // Structural check: Ketu is always exactly opposite Rahu (6 rashis away).
  const expectedKetu = (((rahuRashiId - 1 + 6) % 12) + 1);
  if (ketuRashiId !== expectedKetu) {
    return {
      ...base,
      status: 'NOT_CALCULATED',
      notCalculatedReason: `Node axis inconsistent: Ketu rashi ${ketuRashiId} is not opposite Rahu rashi ${rahuRashiId} (expected ${expectedKetu}).`,
      evidence: [`rahu ${rahuRashiId}, ketu ${ketuRashiId}, expected ketu ${expectedKetu}`]
    };
  }

  const evidence: string[] = [`Rahu in rashi ${rahuRashiId}; Ketu in rashi ${ketuRashiId} (opposite).`];
  const offsets: Array<{ graha: string; offset: number | null }> = SEVEN.map((g) => {
    const r = input.grahaRashis[g] ?? 0;
    if (!r) return { graha: g, offset: null };
    const offset = (r - 1 - (rahuRashiId - 1) + 12) % 12; // 0 = Rahu rashi, 6 = Ketu rashi
    evidence.push(`${g} in rashi ${r} — offset from Rahu: ${offset} (${offset === 0 ? 'Rahu rashi' : offset === 6 ? 'Ketu rashi' : offset < 6 ? 'Rahu→Ketu arc' : 'Ketu→Rahu arc'})`);
    return { graha: g, offset };
  });

  if (offsets.some((o) => o.offset === null)) {
    return { ...base, status: 'INDETERMINATE', notCalculatedReason: 'One or more graha rashis unresolved — Kalsarpa cannot be judged.', evidence };
  }
  if (offsets.some((o) => o.offset === 0 || o.offset === 6)) {
    return {
      ...base,
      status: 'INDETERMINATE',
      notCalculatedReason: 'A graha shares a rashi with Rahu or Ketu — boundary placement is a contested variant (declared alternative); not guessed.',
      evidence
    };
  }
  const allRahuToKetu = offsets.every((o) => (o.offset as number) < 6);
  const allKetuToRahu = offsets.every((o) => (o.offset as number) > 6);
  if (allRahuToKetu) {
    return { ...base, status: 'PRESENT', arc: 'RAHU_TO_KETU', evidence };
  }
  if (allKetuToRahu) {
    return { ...base, status: 'PRESENT', arc: 'KETU_TO_RAHU', evidence };
  }
  const straddlers = offsets.filter((o) => (o.offset as number) < 6).map((o) => o.graha);
  const otherSide = offsets.filter((o) => (o.offset as number) > 6).map((o) => o.graha);
  evidence.push(`Hemispheres split: ${straddlers.join(', ')} on the Rahu→Ketu arc vs ${otherSide.join(', ')} on the Ketu→Rahu arc.`);
  return { ...base, status: 'ABSENT', evidence };
}
