import { test } from '@playwright/test';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';

test('Compute Bilaspur 1989 Chart', () => {
  const birthInput = {
    birthDate: '1989-05-26',
    birthTime: '02:20:30',
    latitude: 22.0797,
    longitude: 82.1391,
    timezone: 5.5,
    locationName: 'Bilaspur, Chhattisgarh, India'
  };

  const snap = getCanonicalJyotishSnapshot(birthInput);
  console.log('=== BIRTH FOUNDATION ===');
  console.log('Julian Day:', snap.meta.julianDay);
  console.log('Ayanamsha:', snap.meta.ayanamshaName, 'Value:', snap.meta.ayanamshaValue);
  console.log('Lagna:', JSON.stringify(snap.lagna));
  console.log('Panchang:', JSON.stringify(snap.birthPanchang));

  console.log('\n=== PLANETS ===');
  snap.planetsArray.forEach(p => {
    console.log(p.name.padEnd(8), p.rashiName.padEnd(12), p.degreeStr.padEnd(10), 'House:', p.house, 'Retro:', p.isRetrograde, 'Dignity:', p.dignity);
  });

  console.log('\n=== DASHA ===');
  console.log('Starting Balance:', snap.dasha.startingBalance);
  console.log('Current MD/AD:', snap.dasha.currentMahadasha, '/', snap.dasha.currentAntardasha);
  console.log('First 4 Mahadashas:');
  snap.dasha.mahadashas.slice(0, 4).forEach(m => console.log(' ', m.lord, m.startDate, '->', m.endDate));

  console.log('\n=== BALAS ===');
  Object.values(snap.balas!.shadbala).forEach(sb => {
    console.log(sb.planet.padEnd(8), 'Total Rupas:', sb.totalRupas.toFixed(2), 'Sthana:', sb.sthana.totalVirupas.toFixed(1), 'Dig:', sb.dig.totalVirupas.toFixed(1), 'Kala:', sb.kala.totalVirupas.toFixed(1));
  });

  console.log('\n=== VARGAS D9 ===');
  console.log(JSON.stringify(snap.vargas.d9Navamsha, null, 2));
});
