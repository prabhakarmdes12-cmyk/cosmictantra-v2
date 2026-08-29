/**
 * OUTCOME MEMORY (PROGRAM 14 / TRUST-06)
 * ======================================
 * Stores predictions and later asks "Did this happen?". Two hard rules:
 *   1. A prediction, once recorded, is IMMUTABLE. Its original text, the chart
 *      state (versions), and the timestamp can never be edited. Outcome feedback
 *      is appended, never overwritten — a genuine audit trail.
 *   2. Outcomes are honest: YES / PARTIALLY / NO / NOT_YET. We store what the
 *      user reports; we never quietly "adjust" a past prediction to look right.
 *
 * localStorage-first, owner-scoped (same model as kundliStore) — no cross-user
 * access. Bound to a Kundli id so a chart carries its own prediction history.
 */

import { getOwnerKey } from './kundliStore.js';

const STORAGE_KEY = 'cosmictantra_outcomes_v1';

export const OUTCOME = {
  YES: 'YES',
  PARTIALLY: 'PARTIALLY',
  NO: 'NO',
  NOT_YET: 'NOT_YET',
};

function readAll() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function writeAll(list) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function frozen(obj) {
  return Object.freeze({ ...obj });
}

/**
 * Record an immutable prediction against a Kundli.
 * @param {object} p { kundliId, text, basis, forWindow, versions }
 */
export function recordPrediction(p) {
  const owner = getOwnerKey();
  const list = readAll();
  const rec = {
    id: `pred_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    ownerKey: owner,
    kundliId: p.kundliId || null,
    // IMMUTABLE core — captured at prediction time
    prediction: {
      text: p.text,
      basis: p.basis || null,          // e.g. evidence refs / dasha lord
      forWindow: p.forWindow || null,  // { start, end } the prediction is about
      versions: p.versions || null,    // engine/ruleset versions at prediction time
      recordedAt: new Date().toISOString(),
    },
    // Appended over time — never rewrites the prediction
    outcomes: [],
  };
  list.unshift(rec);
  writeAll(list);
  return frozen(rec);
}

/** List predictions for a Kundli (owner-scoped). */
export function listPredictions(kundliId) {
  const owner = getOwnerKey();
  return readAll().filter((r) => r.ownerKey === owner && (!kundliId || r.kundliId === kundliId));
}

/**
 * Append an outcome ("Did this happen?"). Does NOT modify the prediction.
 * @param {string} predictionId
 * @param {string} status one of OUTCOME
 * @param {string} note optional
 */
export function recordOutcome(predictionId, status, note) {
  if (!Object.values(OUTCOME).includes(status)) return { ok: false, error: 'INVALID_STATUS' };
  const owner = getOwnerKey();
  const list = readAll();
  const rec = list.find((r) => r.id === predictionId);
  if (!rec) return { ok: false, error: 'NOT_FOUND' };
  if (rec.ownerKey !== owner) return { ok: false, error: 'FORBIDDEN' };
  rec.outcomes.push({ status, note: note || null, recordedAt: new Date().toISOString() });
  writeAll(list);
  return { ok: true, prediction: rec };
}

/** The latest reported outcome for a prediction (or NOT_YET if none). */
export function latestOutcome(rec) {
  if (!rec.outcomes || rec.outcomes.length === 0) return OUTCOME.NOT_YET;
  return rec.outcomes[rec.outcomes.length - 1].status;
}

/** Honest accuracy ledger for a Kundli — counts, never a marketing percentage. */
export function accuracyLedger(kundliId) {
  const preds = listPredictions(kundliId);
  const counts = { YES: 0, PARTIALLY: 0, NO: 0, NOT_YET: 0 };
  for (const p of preds) counts[latestOutcome(p)]++;
  const resolved = counts.YES + counts.PARTIALLY + counts.NO;
  return {
    total: preds.length,
    counts,
    resolved,
    note: resolved === 0
      ? 'No outcomes reported yet — nothing to score. We never claim an accuracy figure without recorded outcomes.'
      : `${counts.YES} confirmed, ${counts.PARTIALLY} partial, ${counts.NO} not confirmed, ${counts.NOT_YET} pending (from ${preds.length} predictions).`,
  };
}

export default { OUTCOME, recordPrediction, listPredictions, recordOutcome, latestOutcome, accuracyLedger };
