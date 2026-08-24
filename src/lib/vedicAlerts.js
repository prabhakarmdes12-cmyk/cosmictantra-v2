/**
 * CosmicTantra — Personal Vedic Calendar & Alerts Engine
 *
 * Turns the deterministic panchang/dasha/festival engines into a per-member
 * "do / avoid" calendar: Rahu Kaal, Yamaganda, Gulika, Abhijit, Panchak,
 * Rikta Tithis, festival observances, Janma Nakshatra days and Dasha
 * transitions. Also emits an ICS feed (Google/Apple calendar subscription).
 */

import { calculatePanchang } from './panchang.js';
import { calculateVimshottariDasha } from './dashaEngine.js';
import { UPCOMING_EVENTS } from './festivals.js';
import { calculateKundali } from './astrologyEngine.js';

export const TITHI_ORDER = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami',
  'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi',
  'Purnima / Amavasya',
];

const PANCHAK_NAKSHATRAS = ['Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];

const TITHI_MAP = TITHI_ORDER.reduce((acc, name, i) => {
  acc[name] = (i % 15) + 1;
  return acc;
}, {});

const RIKTA_TITHIS = new Set([4, 9, 14]);

function pad(n) {
  return String(n).padStart(2, '0');
}

export function isoLocal(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dayKey(date) {
  return isoLocal(date);
}

export function profileCity(profile = {}) {
  return {
    lat: profile.lat ?? 25.5941,
    lng: profile.lng ?? 85.1376,
    tz: profile.tz ?? 5.5,
    name: profile.birthCity || 'Patna',
  };
}

function parseEventDate(dateStr) {
  const d = new Date(`${dateStr}, 12:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function isPanchak(nakshatraName) {
  return PANCHAK_NAKSHATRAS.includes(nakshatraName);
}

export function tithiNumber(tithiName) {
  return TITHI_MAP[tithiName] || 0;
}

export function isRiktaTithi(tithiName) {
  const n = tithiNumber(tithiName);
  return n > 0 && RIKTA_TITHIS.has(n);
}

/**
 * Alerts for a single day. Returns { date, alerts: [...], summary }.
 * alert.level: 'avoid' | 'favor' | 'info'
 */
export function getDayAlerts(date, profile = null) {
  const city = profileCity(profile);
  const panchang = calculatePanchang(new Date(date), city);
  const alerts = [];

  const tithi = panchang.tithi?.name ?? panchang.tithi;
  const nakshatra = panchang.nakshatra?.name ?? panchang.nakshatra;

  if (panchang?.timings?.rahuKalam) {
    alerts.push({
      level: 'avoid',
      type: 'RAHU_KAAL',
      title: 'Rahu Kaal',
      detail: panchang.timings.rahuKalam,
      start: panchang.timings.rahuStart,
      end: panchang.timings.rahuEnd,
    });
  }
  if (panchang?.timings?.yamaganda) {
    alerts.push({
      level: 'avoid',
      type: 'YAMAGANDA',
      title: 'Yamaganda',
      detail: panchang.timings.yamaganda,
      start: panchang.timings.yamaStart,
      end: panchang.timings.yamaEnd,
    });
  }
  if (panchang?.timings?.gulikaKalam) {
    alerts.push({
      level: 'avoid',
      type: 'GULIKA',
      title: 'Gulika Kaal',
      detail: panchang.timings.gulikaKalam,
      start: panchang.timings.gulikaStart,
      end: panchang.timings.gulikaEnd,
    });
  }
  if (panchang?.timings?.abhijitMuhurat) {
    alerts.push({
      level: 'favor',
      type: 'ABHIJIT',
      title: 'Abhijit Muhurat',
      detail: panchang.timings.abhijitMuhurat,
      start: panchang.timings.abhijitStart,
      end: panchang.timings.abhijitEnd,
    });
  }

  if (isRiktaTithi(tithi)) {
    alerts.push({
      level: 'avoid',
      type: 'RIKTA_TITHI',
      title: `Rikta Tithi — ${tithi} (${tithiNumber(tithi)}th lunar day)`,
      detail: 'Avoid starting property registrations, big purchases, and major beginnings.',
    });
  }

  if (isPanchak(nakshatra)) {
    alerts.push({
      level: 'avoid',
      type: 'PANCHAK',
      title: 'Panchak Active',
      detail: 'Avoid house construction, roof work and long-distance funeral-related travel while Moon transits Panchak.',
    });
  }

  for (const ev of UPCOMING_EVENTS) {
    const d = parseEventDate(ev.dateStr);
    if (d && isoLocal(d) === isoLocal(new Date(date))) {
      alerts.push({
        level: 'favor',
        type: 'FESTIVAL',
        title: ev.name,
        detail: `${ev.tithi} • ${ev.pujaMuhurat || ''} • ${ev.significance || ''}`.trim(),
      });
    }
  }

  // Personal rules (only when a profile exists)
  let kundali = null;
  if (profile?.birthDate) {
    try {
      kundali = calculateKundali({
        birthDate: profile.birthDate,
        birthTime: profile.birthTime || '12:00',
        latitude: profile.lat ?? 25.5941,
        longitude: profile.lng ?? 85.1376,
        timezone: profile.tz ?? 5.5,
        locationName: profile.birthCity || 'Custom Location',
      });
    } catch {
      kundali = null;
    }
  }

  if (kundali) {
    const janmaNak = kundali.moon?.nakshatra?.name;
    if (janmaNak && nakshatra === janmaNak) {
      alerts.push({
        level: 'favor',
        type: 'JANMA_NAKSHATRA',
        title: `${janmaNak} — Your Janma Nakshatra Day`,
        detail: 'A personally powerful day for mantra, seva and fresh beginnings.',
      });
    }

    try {
      const dashaList = calculateVimshottariDasha(kundali.moon.nakshatra, new Date(`${profile.birthDate}T12:00:00`));
      const today = isoLocal(new Date(date));
      for (const md of dashaList) {
        if (md.startDate === today) {
          alerts.push({
            level: 'info',
            type: 'DASHA_TRANSITION',
            title: `${md.planet} Mahadasha Begins`,
            detail: `A new 120-year Vimshottari chapter starts today for ${profile.name || 'this profile'}.`,
          });
        }
      }
    } catch {
      // dasha engine best-effort
    }
  }

  const favor = alerts.filter(a => a.level === 'favor').length;
  const avoid = alerts.filter(a => a.level === 'avoid').length;
  const summary = avoid > 0
    ? `${avoid} caution window${avoid > 1 ? 's' : ''} · ${favor} favorable window${favor !== 1 ? 's' : ''}`
    : `${favor} favorable window${favor !== 1 ? 's' : ''} · no major cautions`;

  return { date: isoLocal(new Date(date)), alerts, favor, avoid, summary };
}

/**
 * Month of day-alerts for a profile.
 */
export function getMonthAlerts(profile, year, monthIndex) {
  const days = [];
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    days.push(getDayAlerts(new Date(d), profile));
  }
  return days;
}

/**
 * ICS feed builder — subscribable to Google/Apple calendar.
 * Covers every member's alerts for `days` starting today.
 */
export function buildICS(profiles, days = 60, tzOffsetHours = 5.5) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CosmicTantra//Vedic Alerts//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CosmicTantra Vedic Alerts',
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];

  const now = new Date(Date.now() + (5.5 * 3600 * 1000));
  const stamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const push = (uid, start, end, title, desc) => {
    const fmt = (d) => {
      const t = new Date(d.getTime() + tzOffsetHours * 3600 * 1000);
      return t.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}@cosmictantra`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${fmt(start)}`);
    lines.push(`DTEND:${fmt(end)}`);
    lines.push(`SUMMARY:${escapeIcs(title)}`);
    lines.push(`DESCRIPTION:${escapeIcs(desc)}`);
    lines.push('END:VEVENT');
  };

  for (const profile of profiles || []) {
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const day = getDayAlerts(d, profile);
      const who = profile.name || 'Profile';
      const whoId = (profile.id || 'x').replace(/[^a-zA-Z0-9]/g, '');
      for (const a of day.alerts) {
        const start = a.start ? new Date(a.start) : null;
        const end = a.end ? new Date(a.end) : null;
        if (start && end) {
          push(`${whoId}-${day.date}-${a.type}`, start, end, `${a.title} (${who})`, `${a.detail} • ${a.level.toUpperCase()}`);
        } else {
          const allDayStart = new Date(d);
          allDayStart.setHours(0, 0, 0, 0);
          const allDayEnd = new Date(allDayStart);
          allDayEnd.setDate(allDayEnd.getDate() + 1);
          push(`${whoId}-${day.date}-${a.type}`, allDayStart, allDayEnd, `${a.title} (${who})`, a.detail || a.level.toUpperCase());
        }
      }
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeIcs(s) {
  return String(s || '').replace(/([\\,;])/g, '\\$1').replace(/\n/g, '\\n');
}
