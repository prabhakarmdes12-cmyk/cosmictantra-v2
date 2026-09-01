/**
 * V40 Phase D/E/F acceptance — the derived model.
 *
 * Proves, on the golden chart, that:
 *   1. the canonical chart is still the chart we validated;
 *   2. the Vimshottari birth balance re-derivation agrees with the dasha
 *      engine's own first mahadasha to within a day;
 *   3. the independent D10 re-implementation agrees with the kernel;
 *   4. every evidence identifier emitted anywhere in the derived model
 *      resolves to a real value in the canonical chart.
 */

import { test, expect } from '@playwright/test';
import { buildGoldenCanonical, GOLDEN_EXPECTATIONS } from './goldenCanonical';
import { buildDerivedModel } from '../../src/lib/kundli/v40/derivedModel';
import { validateD10 } from '../../src/lib/kundli/v40/d10Validation';
import { resolveFactPath } from '../../src/lib/kundli/v40/factPaths';
import type { EvidenceClaim } from '../../src/lib/kundli/v40/contentTypes';

const canonical = buildGoldenCanonical();
const derived = buildDerivedModel(canonical);

test.describe('V40 derived model — golden chart', () => {
  test('canonical chart still matches the validated ground truth', () => {
    expect(canonical.ascendant.sign.en).toBe(GOLDEN_EXPECTATIONS.lagna.sign);
    expect(canonical.ascendant.degreeInSign).toBeCloseTo(GOLDEN_EXPECTATIONS.lagna.degreeApprox, 1);
    for (const [id, exp] of Object.entries(GOLDEN_EXPECTATIONS.planets)) {
      const p = canonical.planets.find((x) => x.id === id);
      expect(p, `planet ${id} present`).toBeTruthy();
      expect(p!.sign.en, `${id} sign`).toBe(exp.sign);
      expect(p!.house, `${id} house`).toBe(exp.house);
      expect(p!.degreeInSign, `${id} degree`).toBeCloseTo(exp.degApprox, 1);
    }
    expect(canonical.divisionalCharts.find((c) => c.division === 9)?.lagnaSign)
      .toBe(GOLDEN_EXPECTATIONS.d9LagnaSign);
  });

  test('Vimshottari birth balance is re-derived precisely and agrees with the engine', () => {
    const bal = derived.dasha.balanceAtBirth;
    expect(bal.status).toBe('CALCULATED');
    expect(bal.lord).toBe(canonical.dashas.mahadashas[0].planet);

    // Better than the "5.0 years" the canonical adapter stores.
    expect(bal.ymd).toMatch(/^\d+y \d+m \d+d$/);
    expect(bal.years).toBeGreaterThan(0);

    // Cross-check against the dasha engine's own first mahadasha span.
    expect(bal.crossCheck.agreesWithinOneDay, bal.crossCheck.note).toBe(true);
    expect(Math.abs(bal.crossCheck.deltaDays)).toBeLessThanOrEqual(1);
  });

  test('D10 kernel output matches an independent re-implementation', () => {
    const r = validateD10(canonical);
    for (const c of r.comparisons) {
      const expected = (GOLDEN_EXPECTATIONS.d10 as Record<string, string>)[c.graha];
      if (expected) {
        expect(c.engineSign, `${c.graha} kernel D10`).toBe(expected);
        expect(c.referenceSign, `${c.graha} reference D10`).toBe(expected);
      }
      expect(c.agrees, `${c.graha}: kernel ${c.engineSign} vs reference ${c.referenceSign}`).toBe(true);
    }
    expect(r.lagna.referenceSign).toBe(GOLDEN_EXPECTATIONS.d10Lagna);
    expect(r.allAgree).toBe(true);
    expect(r.disagreements).toHaveLength(0);
  });

  test('D10 stays quarantined despite agreeing', () => {
    expect(derived.d10.promotion.status).toBe('VALIDATION_PENDING');
    expect(derived.d10.promotion.mayInfluenceConclusions).toBe(false);
    const d10Factor = derived.career.confidence.missingFactors.map((m) => m.factor);
    expect(d10Factor).toContain('D10_CONFIRMATION');
  });

  test('every emitted evidence identifier resolves in the canonical chart', () => {
    const claims: EvidenceClaim[] = [
      ...derived.career.natalPromise,
      ...derived.career.supportiveFactors,
      ...derived.career.challengingFactors,
      ...derived.career.mixedFactors,
      ...derived.career.dashaActivation,
      ...derived.career.vargaConfirmation,
      ...derived.career.transitActivation,
    ];

    const ids = new Set<string>();
    for (const c of claims) for (const id of c.evidenceIds) ids.add(id);
    for (const h of derived.highlights) for (const id of h.evidenceIds) ids.add(id);
    for (const q of derived.discussionPoints) for (const id of q.evidenceIds) ids.add(id);
    for (const b of derived.bhavas.bhavas) for (const id of b.evidenceIds) ids.add(id);

    expect(ids.size, 'the derived model must cite evidence at all').toBeGreaterThan(20);

    const unresolved: string[] = [];
    for (const id of ids) {
      if (id.startsWith('RULE:')) continue;
      const value = resolveFactPath(canonical, id);
      if (value === undefined || value === null) unresolved.push(id);
    }
    expect(unresolved, `unresolved evidence paths: ${unresolved.join(', ')}`).toHaveLength(0);
  });

  test('shadbala and other unvalidated capabilities are never promoted', () => {
    const byName = new Map(derived.capabilities.map((c) => [c.name, c]));
    const shadbala = [...byName.values()].find((c) => /shadbala/i.test(c.name));
    expect(shadbala, 'shadbala must appear in the capability inventory').toBeTruthy();
    expect(shadbala!.status).not.toBe('CALCULATED');
    for (const c of derived.capabilities) {
      if (c.status !== 'CALCULATED') expect(c.mayInfluenceConclusions).toBe(false);
    }
  });

  test('career synthesis reports evidence coverage, never a probability', () => {
    const c = derived.career;
    expect(c.confidence.evidenceCoverage).toBeGreaterThan(0);
    expect(c.confidence.evidenceCoverage).toBeLessThanOrEqual(1);
    expect(c.supportiveFactors.length).toBeGreaterThan(0);
    // Venus owns and occupies the 10th from Leo lagna; the lagnesha is there too.
    const statements = c.supportiveFactors.map((x) => x.statement).join(' | ');
    expect(statements).toMatch(/Venus/);
    const all = [
      ...c.conclusion.statements.map((s) => s.text),
      ...c.natalPromise.map((s) => s.statement),
    ].join(' ');
    expect(all).not.toMatch(/\b\d{1,3}\s?% (chance|probability|likely)/i);
    expect(c.conclusion.explicitlyNotClaimed.length).toBeGreaterThan(0);
  });

  test('functional lordship keeps natural character separate and issues no maraka verdict', () => {
    const jupiter = derived.functionalLordship.find((f) => f.graha === 'Jupiter');
    expect(jupiter).toBeTruthy();
    expect(jupiter!.ruledHouses).toEqual([5, 8]);
    expect(jupiter!.naturalCharacter).toBe('BENEFIC');
    const mars = derived.functionalLordship.find((f) => f.graha === 'Mars');
    expect(mars!.ruledHouses).toEqual([4, 9]);
    expect(mars!.yogakaraka).toBe(true);
    const joined = derived.functionalLordship.map((f) => f.functionalStatement).join(' ');
    expect(joined).not.toMatch(/will cause|will bring|death of/i);
    // Maraka ownership may be noted as a candidate, but never as a verdict.
    expect(joined).toMatch(/no maraka verdict is issued/i);
  });

  test('panchanga masa duplication is reported honestly', () => {
    expect(derived.panchanga.masa.amanta.status).toBe('CALCULATED');
    expect(derived.panchanga.masa.purnimanta.status).toBe('NOT_CALCULATED');
    expect(derived.panchanga.masa.defect).toContain('PANCHANG_MASA_DUPLICATE');
  });
});
