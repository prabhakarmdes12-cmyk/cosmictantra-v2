import { KundaliResult } from './astrologyEngine';

export interface Remedy {
  planet: string;
  type: string;
  remedy: string;
}

export function buildSystemPrompt(lang: string, kundali: KundaliResult): string;
export function generateRemedies(kundali: KundaliResult): Remedy[];
