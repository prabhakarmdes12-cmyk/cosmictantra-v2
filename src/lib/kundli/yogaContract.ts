/**
 * YOGA CONTRACT — strict validation of a yoga record arriving at the
 * canonical adapter.
 *
 * The adapter must never accept a yoga it cannot fully justify. Every rule
 * below is enforced before the record can enter the canonical model, and any
 * violation raises KUNDLI_CALCULATION_INCOMPLETE, which the pipeline turns
 * into "no PDF, pdfBuffer: null".
 *
 * Nothing here defaults, coerces or repairs a bad record: an unrecognised
 * system is rejected rather than silently rewritten to PARASHARI, and a
 * PRESENT claim with a false condition is rejected rather than downgraded.
 */

import { KundliError } from './errors';
import type { JyotishSystem, YogaCondition, YogaResult, YogaStatus } from './types';

export const VALID_YOGA_SYSTEMS: JyotishSystem[] = ['PARASHARI', 'JAIMINI', 'KP'];
export const VALID_YOGA_STATUSES: YogaStatus[] = ['PRESENT', 'ABSENT', 'INDETERMINATE', 'NOT_CALCULATED'];

const STABLE_ID = /^YOGA_[A-Z0-9_]+$/;

function reject(index: number, id: unknown, message: string, details: Record<string, unknown> = {}): never {
  throw new KundliError('KUNDLI_CALCULATION_INCOMPLETE', `yoga record invalid: ${message}`, {
    index,
    yogaId: typeof id === 'string' ? id : null,
    ...details,
  });
}

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

function validateConditions(raw: unknown, index: number, id: unknown): YogaCondition[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) reject(index, id, 'conditions is not an array', { received: typeof raw });

  return (raw as unknown[]).map((c, ci) => {
    if (!c || typeof c !== 'object') reject(index, id, `condition ${ci} is not an object`);
    const cond = c as Record<string, unknown>;

    if (!isNonEmptyString(cond.id)) reject(index, id, `condition ${ci} has no id`);
    if (!isNonEmptyString(cond.description)) reject(index, id, `condition ${ci} (${cond.id}) has no description`);

    const s = cond.satisfied;
    if (s !== true && s !== false && s !== null) {
      reject(index, id, `condition ${cond.id} result must be true, false or null`, {
        received: s === undefined ? 'undefined' : String(s),
      });
    }

    const ev = cond.evidence;
    if (!Array.isArray(ev) || ev.length === 0) {
      reject(index, id, `condition ${cond.id} has empty evidence`);
    }
    if (!ev.every((e) => isNonEmptyString(e))) {
      reject(index, id, `condition ${cond.id} has a non-string evidence entry`);
    }

    return { id: cond.id, description: cond.description, satisfied: s, evidence: ev as string[] };
  });
}

/**
 * Validate one yoga record and return the canonical form.
 * Throws KUNDLI_CALCULATED_INCOMPLETE (KUNDLI_CALCULATION_INCOMPLETE) on any
 * violation — it never repairs a record.
 */
export function validateYogaEvaluation(raw: unknown, index: number): YogaResult {
  if (!raw || typeof raw !== 'object') reject(index, null, 'record is not an object');
  const y = raw as Record<string, unknown>;
  const id = y.id;

  /* --- identity ------------------------------------------------------ */
  if (!isNonEmptyString(id)) reject(index, null, 'missing or empty stable id');
  if (!STABLE_ID.test(id)) reject(index, id, 'id is not a stable yoga id (expected YOGA_[A-Z0-9_]+)');
  if (!isNonEmptyString(y.name)) reject(index, id, 'missing or empty name');

  /* --- system: recognised only, never defaulted ---------------------- */
  if (!isNonEmptyString(y.system) || !VALID_YOGA_SYSTEMS.includes(y.system as JyotishSystem)) {
    reject(index, id, 'system is missing or not a recognised Jyotish system', {
      received: y.system ?? null,
      allowed: VALID_YOGA_SYSTEMS,
    });
  }
  const system = y.system as JyotishSystem;

  /* --- status -------------------------------------------------------- */
  if (!isNonEmptyString(y.status) || !VALID_YOGA_STATUSES.includes(y.status as YogaStatus)) {
    reject(index, id, 'status is missing or not a valid yoga status', {
      received: y.status ?? null,
      allowed: VALID_YOGA_STATUSES,
    });
  }
  const status = y.status as YogaStatus;

  if (y.result !== status) {
    reject(index, id, 'result does not match status', { result: y.result ?? null, status });
  }

  /* --- rule text ----------------------------------------------------- */
  if (status !== 'NOT_CALCULATED' && !isNonEmptyString(y.rule)) {
    reject(index, id, `rule text is required for status ${status}`);
  }
  const rule = isNonEmptyString(y.rule) ? y.rule : '';

  /* --- conditions ---------------------------------------------------- */
  const conditions = validateConditions(y.conditions, index, id);

  if (status === 'PRESENT' || status === 'ABSENT' || status === 'INDETERMINATE') {
    if (conditions.length === 0) {
      reject(index, id, `status ${status} requires at least one condition`);
    }
  }

  if (status === 'PRESENT' && !conditions.every((c) => c.satisfied === true)) {
    reject(index, id, 'PRESENT requires every condition to be true', {
      conditions: conditions.map((c) => `${c.id}=${String(c.satisfied)}`),
    });
  }
  if (status === 'ABSENT' && !conditions.some((c) => c.satisfied === false)) {
    reject(index, id, 'ABSENT requires at least one conclusively false condition');
  }
  if (status === 'INDETERMINATE') {
    if (!conditions.some((c) => c.satisfied === null)) {
      reject(index, id, 'INDETERMINATE requires at least one unresolved condition');
    }
    if (conditions.some((c) => c.satisfied === false)) {
      reject(index, id, 'INDETERMINATE is invalid when a condition is conclusively false (logically decisive)');
    }
  }

  /* --- not-calculated reason ----------------------------------------- */
  let notCalculatedReason: string | undefined;
  if (status === 'NOT_CALCULATED') {
    if (!isNonEmptyString(y.notCalculatedReason)) {
      reject(index, id, 'NOT_CALCULATED requires a non-empty reason');
    }
    notCalculatedReason = y.notCalculatedReason;
  }

  /* --- evidence contract --------------------------------------------- */
  // Declared contract: evidenceRefs is a non-empty list of non-empty strings,
  // and for any evaluated status it carries every condition's evidence.
  const refs = y.evidenceRefs;
  if (status !== 'NOT_CALCULATED' || (Array.isArray(refs) && refs.length > 0)) {
    if (!Array.isArray(refs) || refs.length === 0) {
      reject(index, id, 'evidenceRefs must be a non-empty array', { status });
    }
    if (!refs.every((r) => isNonEmptyString(r))) {
      reject(index, id, 'evidenceRefs contains a non-string or empty entry');
    }
  }
  const evidenceRefs: string[] = Array.isArray(refs) ? (refs as string[]) : [];
  const conditionEvidence = conditions.flatMap((c) => c.evidence);
  for (const required of conditionEvidence) {
    if (!evidenceRefs.includes(required)) {
      reject(index, id, 'evidenceRefs does not carry all condition evidence', { missing: required });
    }
  }

  /* --- source registry ----------------------------------------------- */
  const source = y.source;
  if (!source || typeof source !== 'object') {
    reject(index, id, 'missing source-registry entry');
  }
  const src = source as Record<string, unknown>;
  if (src.ruleId !== id) {
    reject(index, id, 'source-registry entry belongs to another rule', { sourceRruleId: src.ruleId ?? null });
  }
  if (!isNonEmptyString(src.adoptedInterpretation)) {
    reject(index, id, 'source-registry entry has no adopted interpretation');
  }
  if (status !== 'NOT_CALCULATED' && src.adoption !== 'ADOPTED') {
    reject(index, id, `status ${status} requires an ADOPTED source-registry entry`, {
      adoption: src.adoption ?? null,
    });
  }

  /* --- inputs --------------------------------------------------------- */
  const rawInputs = (y.inputs ?? {}) as Record<string, unknown>;
  const inputs = {
    planets: Array.isArray(rawInputs.planets) ? (rawInputs.planets as string[]) : [],
    houses: Array.isArray(rawInputs.houses) ? (rawInputs.houses as number[]) : [],
    signs: Array.isArray(rawInputs.signs) ? (rawInputs.signs as string[]) : [],
  };

  return {
    id,
    name: y.name,
    system,
    rule,
    inputs,
    conditions,
    source: source as YogaResult['source'],
    result: status,
    evidenceRefs,
    status,
    notCalculatedReason,
    basis: conditionEvidence,
  };
}
