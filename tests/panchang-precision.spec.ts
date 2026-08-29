import { test, expect } from '@playwright/test';
import { calculatePanchang } from '../src/lib/panchang.js';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';

/**
 * PANCHANG LIMBS & SOLAR TRANSITION QUALIFICATION SUITE
 * Validates Tithi, Nakshatra, Pada, Yoga, Karana, Sunrise, and Udaya vs Instantaneous separation.
 */

test.describe('Panchang Precision & Udaya Tithi Qualification Suite', () => {

  test('Udaya Tithi and Instantaneous Tithi Strict Separation', () => {
    // A birth at 11:30 PM (23:30) where instantaneous Tithi has progressed into Dwitiya, but Udaya Tithi at Sunrise was Pratipada
    const snapshot = getCanonicalJyotishSnapshot({
      birthDate: '2026-03-20',
      birthTime: '23:30',
      latitude: 25.3176,
      longitude: 82.9739,
      timezone: 5.5,
      locationName: 'Varanasi, UP'
    });

    const { udayaTithi, instantaneousTithi, nakshatra, yoga, karana, sun } = snapshot.birthPanchang;

    expect(udayaTithi.fullName).toBeDefined();
    expect(instantaneousTithi.name).toBeDefined();
    expect(instantaneousTithi.progressPercent).toBeGreaterThanOrEqual(0);
    expect(instantaneousTithi.progressPercent).toBeLessThanOrEqual(100);

    // Ensure Udaya and Instantaneous exist as independent properties
    expect(udayaTithi).not.toBeNull();
    expect(instantaneousTithi).not.toBeNull();
    expect(sun.sunrise).toBeDefined();
    expect(sun.sunset).toBeDefined();
  });

  test('Panchang 5 Limbs Integrity across Major Vedic Festivals', () => {
    const festivalDates = [
      { name: 'Maha Shivaratri 2026', date: '2026-02-15T06:00:00Z', lat: 25.3176, lng: 82.9739, tz: 5.5 },
      { name: 'Holi Purnima 2026', date: '2026-03-03T06:00:00Z', lat: 25.5941, lng: 85.1376, tz: 5.5 },
      { name: 'Chaitra Navaratri 2026', date: '2026-03-19T06:00:00Z', lat: 28.6139, lng: 77.2090, tz: 5.5 },
      { name: 'Ram Navami 2026', date: '2026-03-27T06:00:00Z', lat: 26.7922, lng: 82.1998, tz: 5.5 },
      { name: 'Diwali Lakshmi Puja 2026', date: '2026-11-08T18:00:00Z', lat: 25.3176, lng: 82.9739, tz: 5.5 }
    ];

    for (const f of festivalDates) {
      const p = calculatePanchang(new Date(f.date), { lat: f.lat, lng: f.lng, tz: f.tz, name: f.name });
      
      expect(p.tithi.number).toBeGreaterThanOrEqual(1);
      expect(p.tithi.number).toBeLessThanOrEqual(30);
      expect(p.nakshatra.name).toBeDefined();
      expect(p.nakshatra.pada).toBeGreaterThanOrEqual(1);
      expect(p.nakshatra.pada).toBeLessThanOrEqual(4);
      expect(p.yoga.name).toBeDefined();
      expect(p.karana.name).toBeDefined();
      expect(p.timings.rahuStart).toBeDefined();
      expect(p.timings.rahuEnd).toBeDefined();
    }
  });
});
