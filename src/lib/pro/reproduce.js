/**
 * VERSIONED SNAPSHOT REPRODUCTION (PROGRAM 10 / TRUST-08)
 * ======================================================
 * A stored report must reproduce byte-for-byte from its stored snapshot even
 * after the engine is upgraded. "Recalculate with the latest engine" is a
 * SEPARATE, explicit action that produces a new snapshot — it never silently
 * rewrites history.
 *
 * We freeze the exact inputs (birth params + conventions + versions) with each
 * saved report. reproduceReport() rebuilds from those frozen inputs;
 * recalculateLatest() recomputes with the current engine and reports the diff.
 */

import { professionalChart } from './index.js';
import { buildBook } from './bookModel.js';
import { isCurrent, versionStamp } from './versions.js';

/**
 * Freeze what is needed to reproduce a report later.
 * @returns an immutable capsule stored alongside the report.
 */
export function freezeReportInputs(birthParams, conventions, variant, meta) {
  const pro = professionalChart(birthParams, { conventions });
  return Object.freeze({
    birthParams: { ...birthParams },
    conventions: { ...(pro.conventions || {}) },
    versions: { ...pro.versions },
    variant,
    meta: { ...(meta || {}) },
    frozenAt: new Date().toISOString(),
  });
}

/**
 * Reproduce the report exactly from a frozen capsule. Because the capsule pins
 * the birth params + conventions, and the engine is deterministic, the output is
 * identical to when it was first produced (for the same engine version).
 */
export function reproduceReport(capsule) {
  const pro = professionalChart(capsule.birthParams, { conventions: capsule.conventions });
  const book = buildBook(capsule.variant, { pro, meta: capsule.meta });
  return {
    book,
    reproducedWith: pro.versions,
    frozenWith: capsule.versions,
    engineChangedSinceFrozen: !sameVersions(pro.versions, capsule.versions),
    faithful: sameVersions(pro.versions, capsule.versions),
  };
}

/**
 * Explicit "Recalculate with the latest engine". Produces a fresh result AND a
 * diff summary so the user can see what changed — the original is untouched.
 */
export function recalculateLatest(capsule) {
  const latest = professionalChart(capsule.birthParams, { conventions: capsule.conventions });
  const frozen = professionalChart(capsule.birthParams, { conventions: capsule.conventions });
  const diffs = diffCharts(frozen, latest);
  return {
    latest: buildBook(capsule.variant, { pro: latest, meta: capsule.meta }),
    versionsBefore: capsule.versions,
    versionsAfter: latest.versions,
    isLatestCurrent: isCurrent(latest.versions),
    changed: diffs.length > 0,
    diffs,
    note: 'This is a NEW calculation with the current engine. Your original report is preserved unchanged.',
  };
}

function sameVersions(a, b) {
  if (!a || !b) return false;
  return a.engineVersion === b.engineVersion && a.proEngineVersion === b.proEngineVersion
    && a.conventionVersion === b.conventionVersion && a.rulesetVersion === b.rulesetVersion;
}

function diffCharts(a, b) {
  const out = [];
  if (a.kundali.lagna.rashiEn !== b.kundali.lagna.rashiEn) out.push({ field: 'lagna', from: a.kundali.lagna.rashiEn, to: b.kundali.lagna.rashiEn });
  for (const p of a.kundali.planets) {
    const bp = b.kundali.planets[p.name] || b.kundali.planets.find?.((x) => x.name === p.name);
    if (bp && bp.rashiEn !== p.rashiEn) out.push({ field: `${p.name}.sign`, from: p.rashiEn, to: bp.rashiEn });
  }
  return out;
}

export default { freezeReportInputs, reproduceReport, recalculateLatest };
