import { test, expect } from '@playwright/test';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import { createKundli, getKundliById } from '../src/lib/jyotish/kundliStore';
import { generateKundliBookModel } from '../src/lib/jyotish/kundliBookModel';
import { queryKashiEvidence } from '../src/lib/jyotish/kashiOrchestrator';

test.describe('GATE 5: Failure Resilience & Graceful Degradation Test Suite', () => {

  test('1. Approximate & Unknown Birth Time Confidence Degradation', () => {
    const approx = createKundli(
      'Anand Kumar',
      {
        birthDate: '1992-08-10',
        birthTime: '12:00',
        latitude: 28.6139,
        longitude: 77.2090,
        timezone: 5.5,
        locationName: 'Delhi, India'
      },
      'APPROXIMATE'
    );

    expect(approx).toBeDefined();
    expect(approx.timeConfidence).toBe('APPROXIMATE');
    expect(approx.snapshot.lagna).toBeDefined();
    expect(approx.snapshot.planetsArray.length).toBe(9);

    const unknown = createKundli(
      'Unknown Seeker',
      {
        birthDate: '1985-03-21',
        birthTime: '06:00',
        latitude: 25.3176,
        longitude: 82.9739,
        timezone: 5.5,
        locationName: 'Varanasi, India'
      },
      'UNKNOWN'
    );

    expect(unknown).toBeDefined();
    expect(unknown.timeConfidence).toBe('UNKNOWN');
  });

  test('2. 100% Offline Core: Zero Network Dependency', () => {
    // Override global fetch to guarantee zero HTTP/API calls occur during calculations
    const origFetch = global.fetch;
    let fetchAttempted = false;
    global.fetch = async () => {
      fetchAttempted = true;
      throw new Error('NETWORK_DISABLED: Offline Test Mode');
    };

    try {
      const snap = getCanonicalJyotishSnapshot({
        birthDate: '1989-05-26',
        birthTime: '02:20:30',
        latitude: 22.0797,
        longitude: 82.1391,
        timezone: 5.5,
        locationName: 'Bilaspur, Chhattisgarh, India'
      });

      expect(snap).toBeDefined();
      expect(snap.lagna.rashiName).toBe('Meena');
      expect(snap.balas?.shadbala).toBeDefined();
      expect(fetchAttempted).toBe(false); // Zero network calls made
    } finally {
      global.fetch = origFetch;
    }
  });

  test('3. Corrupted / Boundary Date & Extreme Geodetic Coordinates', () => {
    // Polar location (North Pole 89.9N)
    const polar = getCanonicalJyotishSnapshot({
      birthDate: '2024-06-21',
      birthTime: '12:00',
      latitude: 89.9,
      longitude: 0.0,
      timezone: 0.0,
      locationName: 'North Pole Station'
    });

    expect(polar).toBeDefined();
    expect(polar.lagna).toBeDefined();
    expect(polar.planetsArray.length).toBe(9);

    // Southern Polar location (60.0S)
    const south = getCanonicalJyotishSnapshot({
      birthDate: '2024-12-21',
      birthTime: '12:00',
      latitude: -60.0,
      longitude: 0.0,
      timezone: 0.0,
      locationName: 'Southern Ocean'
    });

    expect(south).toBeDefined();
    expect(south.lagna).toBeDefined();
  });

  test('4. Non-Existent or Invalid ID Graceful Degradation', () => {
    const nullResult = getKundliById('non_existent_random_id_9999');
    expect(nullResult).toBeNull();
  });

});
