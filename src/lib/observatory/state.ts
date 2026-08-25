export type TimeMode = 'LIVE' | 'SIMULATION' | 'BIRTH'; export type CoordinateMode = 'HORIZON' | 'EQUATORIAL' | 'ECLIPTIC'; export type ZodiacMode = 'ASTRONOMICAL' | 'SIDEREAL_LAHIRI';
export interface ObservatoryState { timeMode: TimeMode; selectedObject: 'Moon' | null; coordinateMode: CoordinateMode; zodiacMode: ZodiacMode; nakshatraLayer: boolean; }
export const initialObservatoryState: ObservatoryState = { timeMode: 'LIVE', selectedObject: 'Moon', coordinateMode: 'ECLIPTIC', zodiacMode: 'SIDEREAL_LAHIRI', nakshatraLayer: true };
