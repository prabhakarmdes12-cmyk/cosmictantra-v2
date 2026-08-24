import { NakshatraInfo } from './astrologyEngine';

export interface DashaPeriod {
  planet: string;
  years: number;
  startDate: string;
  endDate: string;
  isPassed: boolean;
  isActive: boolean;
}

export interface CurrentDashaInfo {
  planet: string;
  startDate: string;
  endDate: string;
  totalYears: number;
  elapsedYears: number;
  percentDone: number;
}

export function calculateVimshottariDasha(
  moonNakshatra: NakshatraInfo,
  birthDate: Date
): DashaPeriod[];

export function getCurrentDasha(
  dashas: DashaPeriod[],
  currentDate?: Date
): CurrentDashaInfo;
