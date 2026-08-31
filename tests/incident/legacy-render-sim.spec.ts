/**
 * LEGACY RENDERER SIMULATION — exact replication of the page-layout logic of
 * MasterKundliReportClient.handleDownloadPDF (as of c0521b6), minus fonts/UI.
 * Purpose: prove the runaway page-count mechanism with the incident input.
 */
import { test, expect } from '@playwright/test';
import { jsPDF } from 'jspdf';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { generateKundliBookModel } from '../../src/lib/jyotish/kundliBookModel';

// jsPDF in Node needs these shims for output
;(globalThis as any).window = globalThis;

// ---- Incident input as the legacy client would have normalized it ----------
const birthState = {
  name: 'Seeker',               // default substituted by client
  birthDate: '1995-06-15',
  birthTime: '10:30',
  latitude: 25.5941,
  longitude: 82.1391,           // default substituted by client (Bilaspur!)
  timezone: 5.5,
  locationName: 'Bilaspur, India'
};

const snapshot = getCanonicalJyotishSnapshot({
  birthDate: birthState.birthDate,
  birthTime: birthState.birthTime,
  latitude: birthState.latitude,
  longitude: birthState.longitude,
  timezone: birthState.timezone,
  locationName: birthState.locationName
});

const book = generateKundliBookModel(birthState.name, snapshot, 'COMPLETE_VEDIC_KUNDLI');

test.describe('LEGACY RENDERER RUNAWAY REPRODUCTION', () => {
  test('replicates the 454-page artifact', () => {
// ---- Replicate the legacy renderer exactly ---------------------------------
const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
const pdfFont = 'helvetica';
const margin = 18;
let y = 20;
let page = 1;
let lineCalls = 0;
let dumpLeaves = 0;

const header = () => {
  doc.setFont(pdfFont, 'normal');
  doc.setFontSize(8);
  doc.text(`CosmicTantra • ${birthState.name}`, margin, 10);
  doc.text(`${page}`, 192, 10, { align: 'right' });
};
const newPage = () => { doc.addPage(); page += 1; y = 22; header(); };
const ensure = (h = 8) => { if (y + h > 278) newPage(); };
const line = (value: any, size = 9, bold = false) => {
  const clean = String(value).replace(/[\u0000-\u001f]/g, '');
  doc.setFont(pdfFont, bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(clean, 174);
  ensure(lines.length * (size * .48) + 3);
  doc.text(lines, margin, y);
  y += lines.length * (size * .48) + 3;
  lineCalls += 1;
};
const title = (value: any) => {
  ensure(13); doc.setFont(pdfFont, 'bold'); doc.setFontSize(13);
  doc.text(value, margin, y); y += 8; y += 5;
};
const section = (value: any) => {
  ensure(12); doc.setFont(pdfFont, 'bold'); doc.setFontSize(10);
  doc.text(value, margin, y); y += 6;
};
const valueLabel = (label: any, value: any) => line(`${label}: ${value ?? '—'}`);

// dump — the legacy recursive walker (unguarded: re-enters duplicated refs)
const dump = (obj: any, prefix = '') => {
  if (obj === null || obj === undefined) return;
  if (typeof obj !== 'object') { line(`${prefix}: ${obj}`); dumpLeaves += 1; return; }
  for (const [k, v] of Object.entries(obj)) {
    dump(v, prefix ? `${prefix}.${k}` : k);
  }
};

header();
doc.text('COSMICTANTRA MASTER KUNDLI', 105, 34, { align: 'center' });
y = 58;
section('Birth details');
valueLabel('Name', birthState.name);
valueLabel('Date and time', `${birthState.birthDate} ${birthState.birthTime}`);
valueLabel('Birth place', birthState.locationName);
valueLabel('Coordinates', `${birthState.latitude.toFixed(4)}°, ${birthState.longitude.toFixed(4)}°`);
valueLabel('UTC', `+${birthState.timezone}`);
section('Calculation standard');
valueLabel('Ayanamsha', `Lahiri / Chitra Paksha (${snapshot.meta.ayanamshaValue.toFixed(4)}°)`);
valueLabel('Engine', snapshot.meta.engineVersion);
valueLabel('Julian Day', snapshot.meta.julianDay.toFixed(5));

newPage(); title('I. Janma Panchang and essentials');
valueLabel('Ascendant', `${snapshot.lagna.rashiName} (${snapshot.lagna.degreeStr})`);
valueLabel('Birth Nakshatra', `${snapshot.birthPanchang.nakshatra.name} • Pada ${snapshot.birthPanchang.nakshatra.pada}`);
valueLabel('Tithi', snapshot.birthPanchang.udayaTithi.fullName);
valueLabel('Masa', snapshot.birthPanchang.masa?.name || 'Vedic');
valueLabel('Yoga', snapshot.birthPanchang.yoga.name);
valueLabel('Karana', snapshot.birthPanchang.karana.name);
section('Rashi chart placements');
snapshot.planetsArray.forEach((p: any) => valueLabel(`${p.name}${p.isRetrograde ? ' (R)' : ''}`, `${p.rashiName} • ${p.degreeStr} • House ${p.house} • ${p.dignity || ''}`));

newPage(); title('II. Vimshottari dasha timeline');
valueLabel('Current period', snapshot.dasha.currentPeriodString);
valueLabel('Date range', snapshot.dasha.currentDateRange);
const dasha = snapshot.dasha;
for (const [key, val] of Object.entries(dasha as any)) {
  if (typeof val === 'string' || typeof val === 'number') valueLabel(key.replace(/([A-Z])/g, ' $1'), val);
}
section('Interpretive book volumes');
book.volumes.forEach((vol: any) => { ensure(10); line(`${vol.volumeNumber}. ${vol.title} — ${vol.sanskritTitle}`, 9, true); line(vol.description || ''); });

newPage(); title('III. Divisional charts and strengths');
['shodashavarga', 'balas', 'ashtakavarga', 'yogas', 'doshas'].forEach((key) => {
  const data = (snapshot as any)[key]; if (!data) return;
  section(key.replace(/([A-Z])/g, ' $1').toUpperCase());
  const d2 = (obj: any, prefix = '') => {
    if (obj === null || obj === undefined) return;
    if (typeof obj !== 'object') { line(`${prefix}: ${obj}`); return; }
    for (const [k, v] of Object.entries(obj).slice(0, 80)) d2(v, prefix ? `${prefix}.${k}` : k);
  };
  d2(data);
});

newPage(); title('IV. Complete technical appendix');
dump(snapshot);
section('Important note');
line('This report presents calculated sidereal positions and traditional interpretive material. It is not a substitute for professional medical, legal, financial, or mental-health advice.');

const out = Buffer.from(doc.output('arraybuffer'));
  require('fs').mkdirSync(require('path').join(process.cwd(),'scratch','forensics'), {recursive:true});
  require('fs').writeFileSync(require('path').join(process.cwd(),'scratch','forensics','legacy_454_pages.pdf'), out);
const metrics = {
  pages: page,
  fileSizeBytes: out.length,
  lineCalls,
  dumpLeaves,
  note: 'pageCount is the legacy renderer output for the incident input'
};
console.log('[legacy-sim]', JSON.stringify(metrics, null, 2));
    expect(page).toBeGreaterThan(400); // reproduces the runaway
  });
});
