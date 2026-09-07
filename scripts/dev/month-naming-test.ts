/**
 * Dev-only test (not part of build): determine which Vedic month-naming rule
 * reproduces the confirmed 2026 festival dates, using the engine's exact
 * ephemeris. Run: npx tsx scripts/dev/month-naming-test.ts
 */
import { getLahiriAyanamsha } from '../../src/lib/jyotish/ayanamsha';

function toJD(d: Date): number { return d.getTime() / 86400000 + 2440587.5; }
function norm(x: number): number { return ((x % 360) + 360) % 360; }
function d2r(d: number): number { return d * Math.PI / 180; }
function sunTrop(t: number): number {
  const L0 = 280.46646 + 36000.76983 * t;
  const M = d2r(norm(357.52911 + 35999.05029 * t));
  return norm(L0 + (1.914602 - 0.004817 * t) * Math.sin(M));
}
function moonTrop(t: number): number {
  const L1 = 218.3165 + 481267.8813 * t;
  const Mp = d2r(norm(134.9634 + 477198.8676 * t));
  const D = d2r(norm(297.8502 + 445267.1115 * t));
  return norm(L1 + 6.2886 * Math.sin(Mp) + 1.274 * Math.sin(2 * D - Mp));
}
function sunSid(date: Date): number {
  const jd = toJD(date);
  const t = (jd - 2451545.0) / 36525;
  return norm(sunTrop(t) - getLahiriAyanamsha(jd));
}
function elongation(date: Date): number {
  const jd = toJD(date);
  const t = (jd - 2451545.0) / 36525;
  return norm(moonTrop(t) - sunTrop(t));
}
const SIGNS = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];
const MONTHS = ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna'];

// Find new moons between dates by 1-hour sampling of elongation wrap
function findNewMoons(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  let prev = elongation(start);
  for (let ms = start.getTime() + 3600000; ms <= end.getTime(); ms += 3600000) {
    const cur = elongation(new Date(ms));
    if (prev - cur > 90) out.push(new Date(ms)); // wrap 360→0 = new moon
    prev = cur;
  }
  return out;
}

// Candidate month-naming rules: given a new moon date → month index (0=Chaitra)
const RULES: Record<string, (nmDate: Date) => number> = {
  'R1 NM-sign+1': (nm) => (Math.floor(sunSid(nm) / 30) + 1) % 12,
  'R2 NM-sign  ': (nm) => Math.floor(sunSid(nm) / 30),
  'R3 Purnima  ': (nm) => {
    const p = new Date(nm.getTime() + 14.77 * 86400000);
    return Math.floor(sunSid(p) / 30);
  },
  'R4 transit  ': (nm) => {
    // sign entered between this new moon and the next
    for (let h = 1; h <= 720; h++) {
      const s1 = Math.floor(sunSid(new Date(nm.getTime() + (h - 1) * 3600000)) / 30);
      const s2 = Math.floor(sunSid(new Date(nm.getTime() + h * 3600000)) / 30);
      if (s1 !== s2) return s2;
    }
    return Math.floor(sunSid(nm) / 30);
  },
};

// The month of a given date + whether its tithi is Shukla/Krishna
function monthOf(date: Date, nms: Date[], rule: (d: Date) => number) {
  let current = null as Date | null;
  for (const nm of nms) { if (nm <= date) current = nm; else break; }
  if (!current) return null;
  const M = rule(current);
  const elong = elongation(date);
  const shukla = elong < 180;
  // Shukla paksha = month's own name M; Krishna paksha = named M+1
  const festivalName = shukla ? M : (M + 1) % 12;
  return { M, shukla, festivalName, nmDate: current };
}

// Confirmed 2026 facts: festival → (expected month name per festival's tithi label, expected date)
// Tithi-label month = the month named in the festival's traditional tithi designation.
const FACTS: Array<{ name: string; label: string; monthName: string; dateStr: string; isAmavasya?: boolean }> = [
  { name: 'Makar Sankranti', label: 'Pausha month (solar)', monthName: 'Pausha', dateStr: '2026-01-14' },
  { name: 'Vasant Panchami', label: 'Magha Shukla Panchami', monthName: 'Magha', dateStr: '2026-01-23' },
  { name: 'Mahashivratri', label: 'Magha Krishna Chaturdashi', monthName: 'Magha', dateStr: '2026-02-15' },
  { name: 'Holi', label: 'Phalguna Purnima', monthName: 'Phalguna', dateStr: '2026-03-04' },
  { name: 'Ugadi/Gudi Padwa', label: 'Chaitra Pratipada', monthName: 'Chaitra', dateStr: '2026-03-19' },
  { name: 'Guru Purnima', label: 'Ashadha Purnima', monthName: 'Ashadha', dateStr: '2026-07-29' },
  { name: 'Raksha Bandhan', label: 'Shravana Purnima', monthName: 'Shravana', dateStr: '2026-08-28' },
  { name: 'Krishna Janmashtami', label: 'Bhadrapada Krishna Ashtami', monthName: 'Bhadrapada', dateStr: '2026-09-04' },
  { name: 'Ganesh Chaturthi', label: 'Bhadrapada Shukla Chaturthi', monthName: 'Bhadrapada', dateStr: '2026-09-14' },
  { name: 'Navratri (Pratipada)', label: 'Ashwin Shukla Pratipada', monthName: 'Ashwin', dateStr: '2026-10-11' },
  { name: 'Dussehra', label: 'Ashwin Shukla Dashami', monthName: 'Ashwin', dateStr: '2026-10-20' },
  { name: 'Karwa Chauth', label: 'Kartik Krishna Chaturthi', monthName: 'Kartika', dateStr: '2026-10-29' },
  { name: 'Dhanteras', label: 'Kartik Krishna Trayodashi', monthName: 'Kartika', dateStr: '2026-11-06' },
  { name: 'Diwali', label: 'Kartik Amavasya', monthName: 'Kartika', dateStr: '2026-11-08' },
  { name: 'Bhai Dooj', label: 'Kartik Shukla Dwitiya', monthName: 'Kartika', dateStr: '2026-11-11' },
  { name: 'Chhath', label: 'Kartik Shukla Shashthi', monthName: 'Kartika', dateStr: '2026-11-15' },
  { name: 'Kartik Purnima', label: 'Kartik Purnima', monthName: 'Kartika', dateStr: '2026-11-24' },
];

const nms = findNewMoons(new Date('2025-11-01T00:00:00Z'), new Date('2027-02-01T00:00:00Z'));
console.log('New moons found:', nms.length);
console.log(nms.map((d) => d.toISOString().slice(0, 16)).join(' | '));
console.log();

for (const [ruleName, rule] of Object.entries(RULES)) {
  let ok = 0;
  const failures: string[] = [];
  for (const f of FACTS) {
    const d = new Date(f.dateStr + 'T05:30:00+05:30'); // IST noon-ish
    const info = monthOf(d, nms, rule);
    if (!info) { failures.push(`${f.name}: no month`); continue; }
    const got = MONTHS[info.festivalName];
    if (got === f.monthName) ok++;
    else failures.push(`${f.name}: got ${got} (${MONTHS[info.M]} ${info.shukla ? 'Shukla' : 'Krishna'}), want ${f.monthName}`);
  }
  console.log(`== ${ruleName}: ${ok}/${FACTS.length}`);
  for (const f of failures) console.log('   ✗', f);
}
