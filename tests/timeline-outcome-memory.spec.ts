import { test, expect } from '@playwright/test';
import { generatePersonalTimeline } from '../src/lib/jyotish/timelineEngine';
import {
  recordPredictionOutcome,
  submitOutcomeFeedback,
  addPanditConsultationNote,
  getPanditNotesForKundli
} from '../src/lib/jyotish/outcomeMemory';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';

test.describe('TRUST-06: Personal Timeline & Outcome Memory Specification', () => {

  const testSnapshot = getCanonicalJyotishSnapshot({
    birthDate: '1869-10-02',
    birthTime: '07:11',
    latitude: 21.6417,
    longitude: 69.6293,
    timezone: 4.6419,
    locationName: 'Porbandar, Gujarat, India'
  });

  test('1. Multi-Tier Personal Timeline Generation & Zoom Levels', () => {
    const lifeTimeline = generatePersonalTimeline('Mahatma Gandhi', testSnapshot, 'LIFE');
    expect(lifeTimeline).toBeDefined();
    expect(lifeTimeline.events.length).toBeGreaterThan(10);

    // Verify Dasha Mahadasha events exist
    const mdEvents = lifeTimeline.events.filter(e => e.category === 'DASHA_MAHADASHA');
    expect(mdEvents.length).toBeGreaterThanOrEqual(7);

    // Verify Antardasha events exist
    const adEvents = lifeTimeline.events.filter(e => e.category === 'DASHA_ANTARDASHA');
    expect(adEvents.length).toBeGreaterThanOrEqual(10);
  });

  test('2. Outcome Memory Immutability: User Feedback without Prediction Mutation', () => {
    const origText = 'Career expansion expected in Jupiter Antardasha';
    const record = recordPredictionOutcome(
      'gandhi-1869',
      'CAREER',
      origText,
      ['EVID-DASHA-JU', 'EVID-D10-10L'],
      { startDate: '1893-01-01', endDate: '1894-06-01' }
    );

    expect(record.id).toContain('OUTCOME_');
    expect(record.originalPredictionText).toBe(origText);
    expect(record.feedback).toBeUndefined();

    // User submits outcome feedback: YES
    const updated = submitOutcomeFeedback(record.id, 'YES', 'Successfully led South African civil rights campaign');
    expect(updated).toBeDefined();
    expect(updated!.originalPredictionText).toBe(origText); // Original prediction text unchanged
    expect(updated!.feedback?.status).toBe('YES');
    expect(updated!.feedback?.userComment).toContain('South African');
  });

  test('3. Structured Pandit Consultation Notes', () => {
    const note = addPanditConsultationNote(
      'gandhi-1869',
      'Pandit Shastri Ji',
      'SCHOLAR_INTERPRETATION',
      'Saturn in 2nd house imparts intense commitment to Satya and Ahimsa.'
    );

    expect(note.id).toContain('PANDIT_NOTE_');
    expect(note.category).toBe('SCHOLAR_INTERPRETATION');

    const notesList = getPanditNotesForKundli('gandhi-1869');
    expect(notesList.some(n => n.id === note.id)).toBe(true);
  });
});
