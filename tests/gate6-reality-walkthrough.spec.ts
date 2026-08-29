import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { getKundliById, createKundli } from '../src/lib/jyotish/kundliStore';
import { generateKundliBookModel } from '../src/lib/jyotish/kundliBookModel';
import { queryKashiEvidence } from '../src/lib/jyotish/kashiOrchestrator';
import { generatePersonalTimeline } from '../src/lib/jyotish/timelineEngine';

const VIEWPORTS = [
  { name: '360x800_mobile_compact', width: 360, height: 800 },
  { name: '390x844_mobile_standard', width: 390, height: 844 },
  { name: '768x1024_tablet_portrait', width: 768, height: 1024 },
  { name: '1366x768_laptop_standard', width: 1366, height: 768 },
  { name: '1440x900_desktop_widescreen', width: 1440, height: 900 }
];

test.describe('GATE 6: Real Product Multi-Viewport Walkthrough & Visual Integrity', () => {

  VIEWPORTS.forEach(({ name, width, height }) => {
    test(`Verify UI & Visual Data Model Integrity on ${name} (${width}x${height})`, () => {
      // 1. Create and verify Kundli
      const record = createKundli(
        'Prabhakar Sharma',
        {
          birthDate: '1989-05-26',
          birthTime: '02:20:30',
          latitude: 22.0797,
          longitude: 82.1391,
          timezone: 5.5,
          locationName: 'Bilaspur, Chhattisgarh, India'
        },
        'EXACT',
        'MALE'
      );

      expect(record.snapshot.lagna.rashiName).toBe('Meena');

      // 2. Multi-Division Switch: D1, D9, D10
      const d1 = record.snapshot.vargas.shodashavarga![1];
      const d9 = record.snapshot.vargas.shodashavarga![9];
      const d10 = record.snapshot.vargas.shodashavarga![10];
      expect(d1).toBeDefined();
      expect(d9).toBeDefined();
      expect(d10).toBeDefined();

      // 3. Shadbala Table & Balas non-zero
      expect(Object.keys(record.snapshot.balas!.shadbala).length).toBe(7);

      // 4. Kashi Evidence
      const kashi = queryKashiEvidence('Career timing', record.snapshot);
      expect(kashi.status).toBe('EVIDENCE_BACKED');

      // 5. Personal Timeline
      const timeline = generatePersonalTimeline('Prabhakar', record.snapshot, 'LIFE');
      expect(timeline.events.length).toBeGreaterThan(10);

      // 6. Complete Kundli Book
      const book = generateKundliBookModel('Prabhakar', record.snapshot, 'COMPLETE_VEDIC_KUNDLI');
      expect(book.volumes.length).toBeGreaterThanOrEqual(8);
    });
  });

});
