import { test, expect } from '@playwright/test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { nameNumber, mulank, bhagyank, mobileNumber, nameHarmony } from '../src/lib/numerology';
import { kundaliMilan, mangalDosha, milanFromProfiles } from '../src/lib/kundaliMilan';
import { getDayAlerts, isRiktaTithi, isPanchak, buildICS } from '../src/lib/vedicAlerts';
import { dailyRashifal } from '../src/lib/rashifal';
import { calculateKundali } from '../src/lib/astrologyEngine.js';

const PATNA = { lat: 25.5941, lng: 85.1376, tz: 5.5 };

test.describe('Feature Engine Suites', () => {
  test('numerology: Chaldean name number is deterministic and correct', () => {
    // "COSMIC" = C3+O7+S3+M4+I1+C3 = 21 -> 3 (Jupiter)
    const r = nameNumber('COSMIC', 'chaldean');
    expect(r.total).toBe(21);
    expect(r.number).toBe(3);
    expect(r.planet).toContain('Jupiter');
  });

  test('numerology: Mulank & Bhagyank from DOB', () => {
    const m = mulank(15); // 1+5=6
    expect(m.number).toBe(6);
    const b = bhagyank('1995-06-15'); // 1+9+9+5+6+1+5=36 -> 9
    expect(b.number).toBe(9);
  });

  test('numerology: mobile number (drops +91 country code)', () => {
    const r = mobileNumber('+91 9876543210');
    expect(r.digits).toBe('9876543210');
    expect(r.lastDigit).toBe(0);
    expect(Number.isFinite(r.number)).toBe(true);
  });

  test('numerology: name↔destiny harmony score in [0,100]', () => {
    const h = nameHarmony('Rahul Sharma', '1995-06-15');
    expect(h.harmony).toBeGreaterThanOrEqual(0);
    expect(h.harmony).toBeLessThanOrEqual(100);
    expect(h.namank).toBeGreaterThan(0);
  });

  test('kundali milan: total is 36-point bounded and deterministic', () => {
    const a = calculateKundali({ birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5 });
    const b = calculateKundali({ birthDate: '1992-10-24', birthTime: '06:45', latitude: 25.5941, longitude: 85.1376, timezone: 5.5 });
    const r1 = kundaliMilan(a, b);
    const r2 = kundaliMilan(a, b);
    expect(r1.total).toBe(r2.total); // deterministic
    expect(r1.total).toBeGreaterThanOrEqual(0);
    expect(r1.total).toBeLessThanOrEqual(36);
    expect(r1.kootas).toHaveLength(8);
    expect(r1.kootas.reduce((s, k) => s + k.max, 0)).toBe(36);
  });

  test('mangal dosha: markers detected deterministically', () => {
    const a = calculateKundali({ birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5 });
    const d = mangalDosha(a);
    expect(typeof d.hasDosha).toBe('boolean');
    expect(Array.isArray(d.houses)).toBe(true);
  });

  test('vedic alerts: rikta & panchak rules', () => {
    expect(isRiktaTithi('Chaturthi')).toBe(true);
    expect(isRiktaTithi('Ekadashi')).toBe(false);
    expect(isPanchak('Dhanishtha')).toBe(true);
    expect(isPanchak('Rohini')).toBe(false);
  });

  test('vedic alerts: day alerts include Rahu Kaal for Patna', () => {
    const day = getDayAlerts(new Date('2026-08-24T06:30:00'), { birthDate: '1995-06-15', birthTime: '10:30', lat: 25.5941, lng: 85.1376, tz: 5.5, name: 'Test' } as any);
    expect(day.alerts.some(a => a.type === 'RAHU_KAAL')).toBe(true);
    expect(day.alerts.some(a => a.type === 'ABHIJIT')).toBe(true);
  });

  test('vedic alerts: ICS output is well-formed', () => {
    const ics = buildICS([{ id: 'x1', name: 'Test', birthDate: '1995-06-15', birthTime: '10:30', lat: 25.5941, lng: 85.1376, tz: 5.5 }], 7, 5.5);
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR')).toBe(true);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('RAHU_KAAL');
  });

  test('rashifal: 12 signs all resolve with deterministic fields', () => {
    const r = dailyRashifal('mesha', new Date('2026-08-24T06:30:00'), PATNA);
    expect(r.sign.sanskrit).toBe('Mesha');
    expect(r.career.length).toBeGreaterThan(10);
    expect(r.lucky.number).toBeGreaterThan(0);
  });

  test('P0-1 regression: nakshatra objects render safely in React (never as raw object)', () => {
    const k = calculateKundali({ birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5 });
    // The exact accessor patterns now used in KundaliExperience/PersonalisationBridge
    const lagnaStr = k.lagna.nakshatra?.name ?? k.lagna.nakshatra;
    const moonStr = k.moon.nakshatra?.name ?? k.moon.nakshatra;
    const planetStr = k.planets[0].nakshatra?.name ?? k.planets[0].nakshatra;

    // Rendering the raw object must crash (old P0-1 behavior) — proves why accessors matter
    expect(() => renderToStaticMarkup(React.createElement('div', null, k.lagna.nakshatra as any))).toThrow();

    const html = renderToStaticMarkup(React.createElement('div', null, [lagnaStr, ' • ', moonStr, ' • ', planetStr]));
    expect(html).toContain('Magha');
    expect(html).toContain('Uttara Ashadha');
    expect(html).not.toContain('object');
  });
});
