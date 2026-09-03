/**
 * PJOS-01-DOMAIN: Evidence Compiler
 * ---------------------------------
 * Compiles a CanonicalJyotishSnapshot into an EvidenceStore covering all 12
 * evidence domains. Every node is content-addressed and carries provenance
 * (engineVersion + snapshotHash). Dependencies link derived claims back to
 * the facts they rest on — this is what makes the Why-graph and
 * traceDependencies possible downstream.
 *
 * Rule for every domain: store COMPUTED FACTS and, where a traditional rule
 * applies, the rule's output as a CONVENTION_RULE node that DEPENDS ON the
 * fact nodes. Facts and interpretations never mix inside one node.
 */

import type { CanonicalJyotishSnapshot } from './canonicalSnapshot';
import { getClassicalRule } from './ruleRegistry';
import {
  EvidenceStore,
  snapshotHash,
  type EvidenceDomain,
  type NewEvidenceNode,
  type EvidenceBasis,
} from './evidenceGraph';

export interface CompiledEvidence {
  store: EvidenceStore;
  snapshotHash: string;
  engineVersion: string;
  domainsPresent: EvidenceDomain[];
  nodeCount: number;
  compiledAt: string;
}

const CALC: EvidenceBasis = 'DERIVED_FROM_CALCULATION';
const CONV: EvidenceBasis = 'CONVENTION_RULE';

/**
 * Dignity -> strength scale (documented, deterministic, no free parameters):
 *   Uccana/Exalted 1.0 | Swargi/Own 0.9 | Maitra/Friendly 0.7 |
 *   Neutral 0.5 | Shatru/Enemy 0.3 | Neecha/Debilitated 0.2
 * Retrograde does NOT change strength here — it is stored as a fact so the
 * interpretation layer can decide the tradition-specific treatment.
 */
function dignityStrength(dignity: string): number {
  const d = dignity.toLowerCase();
  if (d.includes('exalt') || d.includes('uccana')) return 1.0;
  if (d.includes('own') || d.includes('swargi')) return 0.9;
  if (d.includes('friend') || d.includes('maitra')) return 0.7;
  if (d.includes('neutral')) return 0.5;
  if (d.includes('enemy') || d.includes('shatru')) return 0.3;
  if (d.includes('debil') || d.includes('neecha')) return 0.2;
  return 0.5;
}

export function compileEvidence(snapshot: CanonicalJyotishSnapshot): CompiledEvidence {
  const store = new EvidenceStore(snapshot.meta.engineVersion, snapshotHash(snapshot));
  const now = new Date().toISOString();
  // All nodes compiled here are the NATAL view; other temporal views
  // (transit, muhurta-instant) are added to the same store under different
  // sourceTags by the Time Explorer slice.
  const add = (p: NewEvidenceNode) => store.addNode({ ...p, sourceTag: p.sourceTag ?? 'NATAL' }, now);
  const nodeIds: Record<string, string> = {};

  /* ---------------- GRAHA: placement, dignity, nakshatra ---------------- */
  for (const p of snapshot.planetsArray) {
    const name = p.name as string;
    nodeIds[`graha:${name}`] = add({
      domain: 'GRAHA',
      subject: `graha:${name}`,
      claim: 'placement',
      value: {
        rashi: p.rashiName,
        rashiId: p.rashiId,
        house: p.house,
        degreeInRashi: round2(p.degreeInRasi ?? p.degreeInRashi),  // engine field is degreeInRasi
        isRetrograde: Boolean(p.isRetrograde),
      },
      strength: 0.5,
      confidence: 0.95,
      basis: CALC,
    }).id;
    nodeIds[`graha:${name}:dignity`] = add({
      domain: 'GRAHA',
      subject: `graha:${name}`,
      claim: 'dignity',
      value: { dignity: p.dignity ?? p.status, strength: dignityStrength(p.dignity ?? p.status) },
      strength: dignityStrength(p.dignity ?? p.status),
      confidence: 0.9,
      basis: CALC,
    }).id;
    if (p.nakshatra) {
      nodeIds[`graha:${name}:nakshatra`] = add({
        domain: 'GRAHA',
        subject: `graha:${name}`,
        claim: 'nakshatra',
        value: {
          name: p.nakshatra.name,
          index: p.nakshatra.index,
          pada: p.nakshatra.pada,
          ruler: p.nakshatra.ruler,
        },
        strength: 0.5,
        confidence: 0.95,
        basis: CALC,
        dependencies: [nodeIds[`graha:${name}`]],
      }).id;
    }
  }

  /* Lagna node — the root fact for bhava/domain inferences */
  nodeIds['lagna'] = add({
    domain: 'GRAHA',
    subject: 'lagna',
    claim: 'placement',
    value: {
      rashi: snapshot.lagna.rashiName,
      rashiId: snapshot.lagna.rashiId,
      degreeStr: snapshot.lagna.degreeStr,
      lord: snapshot.lagna.rashiLord,
      nakshatra: snapshot.lagna.nakshatra?.name,
      pada: snapshot.lagna.pada,
    },
    strength: 0.5,
    confidence: 0.95,
    basis: CALC,
  }).id;

  /* ---------------- BHAVA: occupancy + lordship ---------------- */
  for (const h of snapshot.houses) {
    const n = h.number as number;
    nodeIds[`bhava:${n}`] = add({
      domain: 'BHAVA',
      subject: `bhava:${n}`,
      claim: 'occupancy',
      value: { rashi: h.rashiName, lord: h.lord, planets: [...(h.planets ?? [])] },
      strength: 0.5,
      confidence: 0.95,
      basis: CALC,
      dependencies: [nodeIds['lagna']],
    }).id;
    const lordName = h.lord as string;
    if (lordName && nodeIds[`graha:${lordName}`]) {
      nodeIds[`bhava:${n}:lordship`] = add({
        domain: 'BHAVA',
        subject: `bhava:${n}`,
        claim: 'lordship',
        value: { lord: lordName, lordHouse: (snapshot.planetsArray.find((p) => p.name === lordName)?.house as number | undefined) ?? null },
        strength: 0.5,
        confidence: 0.9,
        basis: CALC,
        dependencies: [nodeIds[`bhava:${n}`], nodeIds[`graha:${lordName}`]],
      }).id;
    }
  }

  /* ---------------- DASHA: current period + windows ---------------- */
  const dashaDep = nodeIds['graha:Moon']; // vimshottari seed = moon nakshatra
  nodeIds['dasha:current:MAHA'] = add({
    domain: 'DASHA',
    subject: 'dasha:current',
    claim: 'current-mahadasha',
    value: { lord: snapshot.dasha.currentMahadasha },
    strength: 0.5,
    confidence: 0.85,
    basis: CALC,
    dependencies: dashaDep ? [dashaDep] : [],
  }).id;
  nodeIds['dasha:current:ANTA'] = add({
    domain: 'DASHA',
    subject: 'dasha:current',
    claim: 'current-antardasha',
    value: { lord: snapshot.dasha.currentAntardasha },
    strength: 0.5,
    confidence: 0.85,
    basis: CALC,
    dependencies: [nodeIds['dasha:current:MAHA']],
  }).id;
  if (snapshot.dasha.currentPratyantardasha) {
    nodeIds['dasha:current:PRATYA'] = add({
      domain: 'DASHA',
      subject: 'dasha:current',
      claim: 'current-pratyantardasha',
      value: { lord: snapshot.dasha.currentPratyantardasha },
      strength: 0.5,
      confidence: 0.8,
      basis: CALC,
      dependencies: [nodeIds['dasha:current:ANTA']],
    }).id;
  }
  for (const md of (snapshot.dasha.mahadashas as any[]) ?? []) {
    nodeIds[`dasha:window:${md.lord}`] = add({
      domain: 'DASHA',
      subject: `dasha:window:${md.lord}`,
      claim: 'window',
      value: { start: md.startDate, end: md.endDate, nominalYears: md.totalNominalYears, actualYears: round2(md.actualDurationYears) },
      strength: 0.5,
      confidence: 0.8,
      basis: CALC,
      dependencies: dashaDep ? [dashaDep] : [],
    }).id;
  }

  /* ---------------- PANCHANG: both temporal semantics ---------------- */
  // The two tithi readings are DIFFERENT subjects on purpose: no screen may
  // silently mix AT_LOCAL_SUNRISE (udaya) with AT_INSTANT semantics.
  nodeIds['panchang:udayaTithi'] = add({
    domain: 'PANCHANG',
    subject: 'panchang:udayaTithi',
    claim: 'tithi-at-local-sunrise',
    value: { number: snapshot.birthPanchang.udayaTithi.number, name: snapshot.birthPanchang.udayaTithi.name, paksha: snapshot.birthPanchang.udayaTithi.paksha },
    strength: 0.5,
    confidence: 0.9,
    basis: CALC,
  }).id;
  nodeIds['panchang:instantaneousTithi'] = add({
    domain: 'PANCHANG',
    subject: 'panchang:instantaneousTithi',
    claim: 'tithi-at-instant',
    value: {
      number: snapshot.birthPanchang.instantaneousTithi.number,
      name: snapshot.birthPanchang.instantaneousTithi.name,
      paksha: snapshot.birthPanchang.instantaneousTithi.paksha,
      progressPercent: snapshot.birthPanchang.instantaneousTithi.progressPercent,
    },
    strength: 0.5,
    confidence: 0.9,
    basis: CALC,
  }).id;
  if (snapshot.birthPanchang.nakshatra) {
    nodeIds['panchang:nakshatra'] = add({
      domain: 'PANCHANG',
      subject: 'panchang:nakshatra',
      claim: 'birth-nakshatra',
      value: { name: snapshot.birthPanchang.nakshatra.name, pada: snapshot.birthPanchang.nakshatra.pada, ruler: snapshot.birthPanchang.nakshatra.ruler },
      strength: 0.5,
      confidence: 0.95,
      basis: CALC,
    }).id;
  }

  /* ---------------- VARGA: D9 + vargottama flags ---------------- */
  const d9 = (snapshot.vargas as any)?.d9Navamsha;
  if (Array.isArray(d9)) {
    for (const v of d9) {
      const dep = nodeIds[`graha:${v.planet}`];
      nodeIds[`varga:d9:${v.planet}`] = add({
        domain: 'VARGA',
        subject: `varga:d9:${v.planet}`,
        claim: 'navamsha-placement',
        value: { navamshaRashi: v.navamshaRashi, pada: v.pada, isVargottama: Boolean(v.isVargottama) },
        strength: v.isVargottama ? 0.9 : 0.5,
        confidence: 0.9,
        basis: CALC,
        dependencies: dep ? [dep] : [],
      }).id;
    }
    for (const v of d9) {
      if (v.isVargottama) {
        add({
          domain: 'VARGA',
          subject: `varga:d9:${v.planet}`,
          claim: 'vargottama',
          value: { planet: v.planet, vargottama: true },
          strength: 0.9,
          confidence: 0.85,
          basis: CONV,
          dependencies: [nodeIds[`varga:d9:${v.planet}`]],
        });
      }
    }
  }

  /* ---------------- ASHTAKAVARGA: BA/SA scores ---------------- */
  const av = snapshot.ashtakavarga as any;
  if (av?.bav) {
    for (const [planet, scores] of Object.entries(av.bav)) {
      const dep = nodeIds[`graha:${planet}`];
      nodeIds[`av:bav:${planet}`] = add({
        domain: 'ASHTAKAVARGA',
        subject: `av:${planet}`,
        claim: 'bav-scores',
        value: { perRashi: [...(scores as number[])], total: (scores as number[]).reduce((a, b) => a + b, 0) },
        strength: 0.5,
        confidence: 0.9,
        basis: CALC,
        dependencies: dep ? [dep] : [],
      }).id;
    }
    if (Array.isArray(av.sav)) {
      nodeIds['av:sav'] = add({
        domain: 'ASHTAKAVARGA',
        subject: 'av:sav',
        claim: 'sav-scores',
        value: { perRashi: [...av.sav], total: av.sav.reduce((a: number, b: number) => a + b, 0) },
        strength: 0.5,
        confidence: 0.9,
        basis: CALC,
      }).id;
    }
  }

  /* ---------------- JAIMINI: karakas ---------------- */
  const jaimini = snapshot.jaimini as any;
  if (jaimini?.karakas) {
    for (const k of jaimini.karakas) {
      const dep = nodeIds[`graha:${k.planet}`];
      nodeIds[`jaimini:${k.code}`] = add({
        domain: 'JAIMINI',
        subject: `jaimini:${k.code}`,
        claim: 'karaka',
        value: { planet: k.planet, rashi: k.rashi, house: k.house, degreeInRashi: k.degreeInRashi },
        strength: 0.5,
        confidence: 0.9,
        basis: CALC,
        dependencies: dep ? [dep] : [],
      }).id;
    }
  }

  /* ---------------- KP: sub-lord structure ---------------- */
  const kp = snapshot.kp as any;
  if (kp?.planets) {
    for (const k of kp.planets) {
      const dep = nodeIds[`graha:${k.planet}`];
      nodeIds[`kp:${k.planet}`] = add({
        domain: 'KP',
        subject: `kp:${k.planet}`,
        claim: 'sub-lords',
        value: { signLord: k.signLord, starLord: k.starLord, subLord: k.subLord, subSubLord: k.subSubLord, houseOccupied: k.houseOccupied },
        strength: 0.5,
        confidence: 0.85,
        basis: CALC,
        dependencies: dep ? [dep] : [],
      }).id;
    }
  }

  /* ---------------- BALA: shadbala ---------------- */
  const balas = snapshot.balas as any;
  if (balas?.shadbala) {
    const sd = balas.shadbala;
    nodeIds['bala:shadbala'] = add({
      domain: 'BALA',
      subject: 'bala:shadbala',
      claim: 'shadbala-totals',
      value: compactBala(sd),
      strength: 0.5,
      confidence: 0.85,
      basis: CALC,
    }).id;
  }

  /* ---------------- RELATIONSHIP: panchadha maitri ---------------- */
  const rel = snapshot.relationships as any;
  if (rel?.panchadhaMaitri) {
    nodeIds['relationship:panchadhaMaitri'] = add({
      domain: 'RELATIONSHIP',
      subject: 'relationship:panchadhaMaitri',
      claim: 'graha-maitri-matrix',
      value: rel.panchadhaMaitri,
      strength: 0.5,
      confidence: 0.9,
      basis: CALC,
    }).id;
  }

  /* ---------------- TIMELINE_OUTCOME: dasha window structure ---------------- */
  // Past/future windows expressed against the person's timeline. Outcome
  // correlation (TIMELINE_OUTCOME's full role) is added when outcome records
  // become persisted and consent-gated (D-1) — never before.
  for (const md of (snapshot.dasha.mahadashas as any[]) ?? []) {
    if (md.isCurrent) {
      add({
        domain: 'TIMELINE_OUTCOME',
        subject: 'timeline:current-window',
        claim: 'active-dasha-window',
        value: { mahadasha: md.lord, start: md.startDate, end: md.endDate },
        strength: 0.5,
        confidence: 0.8,
        basis: CALC,
        dependencies: [nodeIds[`dasha:window:${md.lord}`], nodeIds['dasha:current:MAHA']].filter(Boolean),
      });
    }
  }

  /* ---------------- CONVENTION: rule outputs (factual, no fear framing) --- */
  const yd = snapshot.yogasAndDoshas as any;
  if (yd) {
    if (yd.manglik) {
      add({
        domain: 'CONVENTION',
        subject: 'convention:manglik',
        claim: 'manglik-rule',
        value: { isManglik: yd.manglik.isManglik, severity: yd.manglik.severity, isCancelled: yd.manglik.isCancelled },
        strength: yd.manglik.isManglik && !yd.manglik.isCancelled ? 0.7 : 0.3,
        confidence: 0.8,
        basis: CONV,
        dependencies: nodeIds['graha:Mars'] ? [nodeIds['graha:Mars']] : [],
      });
    }
    if (yd.sadeSati) {
      // Sprint G/§9/§18: Sade Sati is a TRANSIT phenomenon evaluated at the
      // explicit reference instant against the natal Moon rashi. The WHY chain
      // must show: TRANSIT Saturn fact + natal Moon anchor -> verdict. Natal
      // Saturn is deliberately NOT a dependency (RSK_016).
      const ss = yd.sadeSati as Record<string, unknown>;
      const transitRashiId = Number(ss.transitSaturnRashiId) || null;
      const transitFactId = transitRashiId
        ? add({
            domain: 'GRAHA',
            subject: 'graha:Saturn',
            claim: 'transit-placement',
            value: { rashiId: transitRashiId, referenceInstantUtc: ss.referenceInstantUtc ?? null },
            strength: 0.5,
            confidence: 0.95,
            basis: CALC,
            sourceTag: 'TRANSIT',
          }).id
        : null;
      const moonDep = nodeIds['graha:Moon'] ? [nodeIds['graha:Moon']] : [];
      add({
        domain: 'CONVENTION',
        subject: 'convention:sadeSati',
        claim: 'sade-sati-transit-phase',
        value: {
          isActive: ss.isActive ?? null,
          phase: ss.phase ?? null,
          basis: ss.basis ?? 'TRANSIT',
          saturnHousesFromMoon: ss.saturnHousesFromMoon ?? null,
          referenceInstantUtc: ss.referenceInstantUtc ?? null,
        },
        strength: 0.5,
        confidence: 0.9,
        basis: CONV,
        dependencies: [...moonDep, ...(transitFactId ? [transitFactId] : [])],
        ruleRef: (() => {
          const r = getClassicalRule('RULE_SADE_SATI_BAND');
          return r ? { ruleId: r.id, ruleVersion: r.version } : undefined;
        })(),
      });
    }
    if (Array.isArray(yd.rajYogas)) {
      add({
        domain: 'CONVENTION',
        subject: 'convention:rajYogas',
        claim: 'rajyoga-presence',
        value: { present: yd.rajYogas },
        strength: yd.rajYogas.length > 0 ? 0.7 : 0.3,
        confidence: 0.8,
        basis: CONV,
      });
    }
    // Sprint I/§16/§18: Kalsarpa verdict with its ADOPTED variant declared.
    if (yd.kalsarpa && typeof yd.kalsarpa === 'object') {
      const k = yd.kalsarpa as Record<string, unknown>;
      const grahaDeps = (['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as string[])
        .map((g) => nodeIds[`graha:${g}`])
        .filter(Boolean) as string[];
      add({
        domain: 'CONVENTION',
        subject: 'convention:kalsarpa',
        claim: 'kalsarpa-variant-verdict',
        value: {
          status: k.status ?? null,
          variant: k.variant ?? 'ONE_HEMISPHERE_NODE_AXIS',
          arc: k.arc ?? null,
          evidence: Array.isArray(k.evidence) ? (k.evidence as unknown[]).slice(0, 12) : [],
          typeNamingStatus: (k.typeNaming as Record<string, unknown> | undefined)?.status ?? 'NOT_CALCULATED',
          notCalculatedReason: k.notCalculatedReason ?? null,
        },
        strength: 0.5,
        confidence: 0.9,
        basis: CONV,
        dependencies: grahaDeps,
        ruleRef: (() => {
          const r = getClassicalRule('RULE_KALSARPA_HEMISPHERE');
          return r ? { ruleId: r.id, ruleVersion: r.version } : undefined;
        })(),
      });
    }
    // Every yoga evaluation becomes its own conclusion node (§18: every
    // consequential conclusion gets an evidence node).
    if (Array.isArray(yd.yogas)) {
      for (const y of yd.yogas as Array<Record<string, unknown>>) {
        const depPlanets = (y.inputs as Record<string, unknown> | undefined)?.planets;
        const deps = (Array.isArray(depPlanets) ? (depPlanets as string[]) : [])
          .map((g) => nodeIds[`graha:${g}`])
          .filter(Boolean) as string[];
        const cross = getClassicalRule(String(y.id));
        add({
          domain: 'CONVENTION',
          subject: `convention:yoga:${String(y.id)}`,
          claim: 'yoga-evaluation',
          value: {
            status: y.status ?? null,
            rule: y.rule ?? null,
            strength: y.strength ?? null,
            conditions: Array.isArray(y.conditions)
              ? (y.conditions as Array<Record<string, unknown>>).map((c) => ({ id: c.id, satisfied: c.satisfied }))
              : [],
            notCalculatedReason: y.notCalculatedReason ?? null,
          },
          strength: y.status === 'PRESENT' ? 0.7 : 0.3,
          confidence: 0.85,
          basis: CONV,
          dependencies: deps,
          ruleRef: cross ? { ruleId: cross.id, ruleVersion: cross.version } : undefined,
        });
      }
    }
  }

  /* ---------------- CONVENTION: combustion (RSK_002 provenance) ---------- */
  const combustions = (snapshot.relationships as Record<string, unknown> | undefined)?.combustions as Record<string, Record<string, unknown>> | undefined;
  if (combustions) {
    for (const [planet, c] of Object.entries(combustions)) {
      if (!nodeIds[`graha:${planet}`] || !nodeIds['graha:Sun']) continue;
      const applicable = c.applicable !== false && typeof c.angularDistanceToSun === 'number' && c.angularDistanceToSun < 900;
      // separation FACT node (depends on both placements), then the rule node.
      const sepId = applicable
        ? add({
            domain: 'GRAHA',
            subject: `graha:${planet}`,
            claim: 'sun-separation',
            value: { angularDistanceToSun: c.angularDistanceToSun },
            strength: 0.5,
            confidence: 0.95,
            basis: CALC,
            dependencies: [nodeIds[`graha:${planet}`], nodeIds['graha:Sun']],
          }).id
        : null;
      add({
        domain: 'CONVENTION',
        subject: `convention:combustion:${planet}`,
        claim: 'combustion-rule',
        value: {
          isCombust: c.isCombust ?? null,
          severity: c.severity ?? null,
          adoptedOrb: c.combustionOrb ?? null,
          angularDistanceToSun: applicable ? c.angularDistanceToSun : null,
          applicable: c.applicable ?? applicable,
          borderline: c.borderline ?? false,
          scholarJudgementRequired: c.scholarJudgementRequired ?? false,
        },
        strength: c.isCombust ? 0.7 : 0.3,
        confidence: 0.9,
        basis: CONV,
        dependencies: sepId ? [sepId] : [nodeIds[`graha:${planet}`]],
        ruleRef: (() => {
          const r = getClassicalRule('RULE_COMBUSTION_ORBS');
          return r ? { ruleId: r.id, ruleVersion: r.version } : undefined;
        })(),
      });
    }
  }
  const avakhada = snapshot.avakhada as any;
  if (avakhada) {
    add({
      domain: 'CONVENTION',
      subject: 'convention:avakhada',
      claim: 'avakhada-profile',
      value: {
        varna: avakhada.varna,
        vashya: avakhada.vashya,
        yoni: avakhada.yoni,
        gana: avakhada.gana,
        tara: avakhada.tara,
      },
      strength: 0.5,
      confidence: 0.8,
      basis: CONV,
    });
  }

  const domainsPresent = [...new Set(store.list().map((n) => n.domain))];
  return {
    store,
    snapshotHash: store.snapshotHash,
    engineVersion: store.engineVersion,
    domainsPresent,
    nodeCount: store.size,
    compiledAt: now,
  };
}

/* ------------------------------------------------------------------ */

function round2(n: number | undefined): number | null {
  return typeof n === 'number' && Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/** Shadbala objects are nested and large; keep the load-bearing totals only. */
function compactBala(sd: any): Record<string, number> {
  const out: Record<string, number> = {};
  if (Array.isArray(sd.planets)) {
    for (const p of sd.planets) {
      out[p.planet ?? p.name ?? 'unknown'] = round2(p.totalBala ?? p.shadbala ?? p.bala ?? null) as number;
    }
  } else if (sd && typeof sd === 'object') {
    for (const [k, v] of Object.entries(sd)) {
      if (typeof v === 'number') out[k] = round2(v) as number;
    }
  }
  return out;
}
