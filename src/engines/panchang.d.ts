export interface PanchangResult {
  date: string;
  tithi: { index: number; name: string; paksha: string; meaning: string };
  nakshatra: { name: string; pada: number; index: number };
  yoga: { name: string; index: number };
  karana: { name: string };
  vara: { day: string; planet: string; color: string; quality: string };
  rahuKala: { start: string; end: string };
  sunrise: string;
  sunset: string;
  personalEnergy?: any;
}

export function calculatePanchang(
  date?: Date,
  latitude?: number,
  longitude?: number,
  tzOffset?: number,
  birthNakshatraIndex?: number | null,
  birthRasiIndex?: number | null
): PanchangResult;
