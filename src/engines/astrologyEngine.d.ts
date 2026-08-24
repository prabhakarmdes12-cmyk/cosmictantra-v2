export interface NakshatraInfo {
  index: number;
  name: string;
  ruler: string;
  pada: number;
}

export interface PlanetPosition {
  longitude: number;
  rasiIndex: number;
  rasiName: string;
  house: number;
  nakshatra: NakshatraInfo;
  isRetrograde: boolean;
  status: string;
}

export interface LagnaInfo {
  longitude: number;
  rasiIndex: number;
  rasiName: string;
  nakshatra: NakshatraInfo;
}

export interface HouseInfo {
  house: number;
  longitude: number;
  rasiIndex: number;
  rasiName: string;
}

export interface KundaliResult {
  lagna: LagnaInfo;
  planets: {
    Sun: PlanetPosition;
    Moon: PlanetPosition;
    Mars: PlanetPosition;
    Mercury: PlanetPosition;
    Jupiter: PlanetPosition;
    Venus: PlanetPosition;
    Saturn: PlanetPosition;
    Rahu: PlanetPosition;
    Ketu: PlanetPosition;
    [key: string]: PlanetPosition;
  };
  houses: HouseInfo[];
}

export function calculateKundali(
  dateStr: string,
  timeStr: string,
  lat: number,
  lon: number,
  tzOffset?: number
): KundaliResult;

export function toJulianDay(date: Date): number;
export function getLahiriAyanamsha(julianDay: number): number;

export const NAKSHATRAS: Array<{ name: string; ruler: string; deity: string; symbol: string }>;
export const PLANETS: Array<{ name: string; symbol: string; sanskrit: string; nature: string }>;
