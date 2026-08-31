/**
 * CosmicTantra — Remedy & Sankalpa Store (localStorage, DPDP-conscious).
 *
 * Everything a devotee records about observances lives ON THE DEVICE:
 * no PII leaves the browser for the free tracker. Keys are shared so
 * multiple surfaces stay consistent:
 *   - darshan's japa taps feed the same streak as the Remedy Tracker.
 */
const REMEDIES_KEY = 'cosmictantra_remedies_v1';
const JAPA_LOG_KEY = 'cosmictantra_japa_log_v1';
const REMINDER_KEY = 'cosmictantra_sandhya_reminder_v1';
const REMINDER_FIRED_KEY = 'cosmictantra_reminder_fired_v1';

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const daysBetween = (fromISO, toISO) =>
  Math.round((new Date(`${toISO}T00:00:00`) - new Date(`${fromISO}T00:00:00`)) / 86400000);

function safeParse(raw, fallback) {
  try {
    const v = raw ? JSON.parse(raw) : null;
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

/* ----------------------------- Remedies ------------------------------ */

export function loadRemedies() {
  return safeParse(localStorage.getItem(REMEDIES_KEY), null);
}

export function saveRemedies(remedies) {
  try { localStorage.setItem(REMEDIES_KEY, JSON.stringify(remedies)); } catch {}
}

/** Starter templates shown when a devotee has no remedies yet. */
export const REMEDY_TEMPLATES = [
  {
    id: 'seed-1',
    name: 'Shani Shanti Anusthan',
    type: 'Pooja',
    mantra: 'ॐ शं शनैश्चराय नमः',
    japaTarget: 108,
    durationDays: 40,
  },
  {
    id: 'seed-2',
    name: '14 Mukhi Rudraksha Dhaaran',
    type: 'Rudraksha',
    mantra: 'ॐ नमः शिवाय',
    japaTarget: 108,
    durationDays: 21,
  },
  {
    id: 'seed-3',
    name: 'Neelam (Blue Sapphire) Dhaaran',
    type: 'Gemstone',
    mantra: 'ॐ शं शनैश्चराय नमः',
    japaTarget: 108,
    durationDays: 40,
  },
];

export function seedRemediesIfEmpty() {
  if (loadRemedies()) return loadRemedies();
  const seeded = REMEDY_TEMPLATES.map((t) => ({
    ...t,
    startDate: todayISO(),
    daysObserved: [],
  }));
  saveRemedies(seeded);
  return seeded;
}

/* ----------------------------- Japa log ------------------------------ */

/** { 'YYYY-MM-DD': totalMantras } */
export function loadJapaLog() {
  return safeParse(localStorage.getItem(JAPA_LOG_KEY), {});
}

export function saveJapaLog(log) {
  try { localStorage.setItem(JAPA_LOG_KEY, JSON.stringify(log)); } catch {}
}

/** Add `amount` mantras for a date (default today). Returns the new log. */
export function logJapa(amount = 1, dateISO = todayISO()) {
  const log = loadJapaLog();
  log[dateISO] = (log[dateISO] ?? 0) + amount;
  saveJapaLog(log);
  return log;
}

export function japaTotals() {
  const log = loadJapaLog();
  const entries = Object.entries(log).map(([date, count]) => ({ date, count }));
  entries.sort((a, b) => a.date.localeCompare(b.date));
  const total = entries.reduce((sum, e) => sum + e.count, 0);

  // Current streak: consecutive days ending today (or yesterday if today is
  // not yet logged — the day is still in progress).
  const iso = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  let streak = 0;
  const startOffset = (log[iso(0)] ?? 0) > 0 ? 0 : -1;
  for (let off = startOffset; off > -3660; off--) {
    if ((log[iso(off)] ?? 0) > 0) streak += 1;
    else break;
  }

  // Best streak over the whole log.
  let best = 0;
  const dates = new Set(entries.map((e) => e.date));
  let run = 0;
  let prev = null;
  for (const e of entries) {
    if (prev && daysBetween(prev, e.date) === 1) run += 1;
    else run = 1;
    if (run > best) best = run;
    prev = e.date;
  }

  // Last 7 days (oldest -> newest) for the mini bar chart.
  const week = [];
  for (let off = -6; off <= 0; off++) {
    const d = iso(off);
    week.push({ date: d, count: log[d] ?? 0 });
  }
  return { total, streak, best, week };
}

/* ------------------------- Sandhya reminder -------------------------- */

export function loadReminder() {
  return safeParse(localStorage.getItem(REMINDER_KEY), null); // { time: '18:30' }
}

export function saveReminder(reminder) {
  try { localStorage.setItem(REMINDER_KEY, JSON.stringify(reminder)); } catch {}
}

export function clearReminder() {
  try { localStorage.removeItem(REMINDER_KEY); } catch {}
}

export function loadReminderFiredDate() {
  return localStorage.getItem(REMINDER_FIRED_KEY) ?? '';
}

export function saveReminderFiredDate(dateISO) {
  try { localStorage.setItem(REMINDER_FIRED_KEY, dateISO); } catch {}
}
