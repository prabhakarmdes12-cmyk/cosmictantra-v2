/**
 * PROTECTED CANONICAL JYOTISH KERNEL: Outcome Memory & Pandit Notes System
 * Records user outcomes (YES/PARTIALLY/NO/NOT_YET) without altering original predictions,
 * and maintains structured Pandit consultation notes.
 * Complies with Programs 12, 13 and Checkpoint TRUST-06.
 */

export type OutcomeFeedbackStatus = 'YES' | 'PARTIALLY' | 'NO' | 'NOT_YET';

export interface OutcomeRecord {
  id: string;
  kundliId: string;
  predictionTopic: string;
  originalPredictionText: string;
  originalEvidenceIds: string[];
  predictionTimeWindow: { startDate: string; endDate: string };
  recordedAt: string;
  feedback?: {
    status: OutcomeFeedbackStatus;
    userComment?: string;
    feedbackSubmittedAt: string;
  };
}

export type PanditNoteCategory =
  | 'CALCULATED_FACT'
  | 'SCHOLAR_INTERPRETATION'
  | 'USER_REPORTED_FACT'
  | 'TRADITIONAL_REMEDY'
  | 'FOLLOW_UP';

export interface PanditConsultationNote {
  id: string;
  kundliId: string;
  panditName: string;
  category: PanditNoteCategory;
  noteText: string;
  createdAt: string;
}

const OUTCOME_STORE: Map<string, OutcomeRecord> = new Map();
const PANDIT_NOTE_STORE: Map<string, PanditConsultationNote[]> = new Map();

/**
 * Records an immutable prediction with evidence IDs.
 */
export function recordPredictionOutcome(
  kundliId: string,
  predictionTopic: string,
  originalPredictionText: string,
  originalEvidenceIds: string[],
  timeWindow: { startDate: string; endDate: string }
): OutcomeRecord {
  const id = `OUTCOME_${Date.now().toString(36).toUpperCase()}`;
  const record: OutcomeRecord = {
    id,
    kundliId,
    predictionTopic,
    originalPredictionText,
    originalEvidenceIds,
    predictionTimeWindow: timeWindow,
    recordedAt: new Date().toISOString()
  };

  OUTCOME_STORE.set(id, record);
  return record;
}

/**
 * Submits user outcome feedback without modifying original prediction text.
 */
export function submitOutcomeFeedback(
  outcomeId: string,
  status: OutcomeFeedbackStatus,
  userComment: string = ''
): OutcomeRecord | null {
  const existing = OUTCOME_STORE.get(outcomeId);
  if (!existing) return null;

  existing.feedback = {
    status,
    userComment,
    feedbackSubmittedAt: new Date().toISOString()
  };

  return existing;
}

/**
 * Adds a structured Pandit consultation note.
 */
export function addPanditConsultationNote(
  kundliId: string,
  panditName: string,
  category: PanditNoteCategory,
  noteText: string
): PanditConsultationNote {
  const id = `PANDIT_NOTE_${Date.now().toString(36).toUpperCase()}`;
  const note: PanditConsultationNote = {
    id,
    kundliId,
    panditName,
    category,
    noteText,
    createdAt: new Date().toISOString()
  };

  const list = PANDIT_NOTE_STORE.get(kundliId) || [];
  list.push(note);
  PANDIT_NOTE_STORE.set(kundliId, list);

  return note;
}

export function getPanditNotesForKundli(kundliId: string): PanditConsultationNote[] {
  return PANDIT_NOTE_STORE.get(kundliId) || [];
}
