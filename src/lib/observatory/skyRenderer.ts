import type { ObserverLocation, ObservatoryTime } from '@/lib/astronomy/types';
export type SkyLayer = 'horizon' | 'labels' | 'constellations' | 'nakshatras';
export interface SkyRenderer { initialize(container: HTMLElement): Promise<void>; destroy(): void; setObserver(observer: ObserverLocation): void; setTime(time: ObservatoryTime): void; setCamera(camera: { altitude: number; azimuth: number; fov: number }): void; setLayerVisibility(layer: SkyLayer, visible: boolean): void; selectObject(id: string | null): void; getSelectedObject(): string | null; projectCoordinate(coordinate: { longitude: number; latitude: number }): { x: number; y: number } | null; }
/** Placeholder adapter boundary. Stellarium is intentionally not bundled until licence approval is recorded. */
export class StellariumSkyRenderer implements SkyRenderer {
  async initialize(): Promise<void> { throw new Error('Stellarium renderer is disabled pending licence approval.'); }
  destroy() {} setObserver() {} setTime() {} setCamera() {} setLayerVisibility() {} selectObject() {} getSelectedObject() { return null; } projectCoordinate() { return null; }
}
export const OBSERVATORY_RENDERER = process.env.NEXT_PUBLIC_OBSERVATORY_RENDERER || 'internal';
