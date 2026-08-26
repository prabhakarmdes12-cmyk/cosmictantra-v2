/**
 * Display-only camera transforms for dense Observatory canvases.
 *
 * The transform changes how a calculated scene is viewed. It never changes
 * the underlying time, observer, coordinate frame, or ephemeris values.
 */

export interface ViewportTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface ViewportPoint {
  x: number;
  y: number;
}

export const DEFAULT_VIEWPORT_TRANSFORM: ViewportTransform = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

export const MIN_VIEWPORT_SCALE = 1;
export const MAX_VIEWPORT_SCALE = 4;

export function clampViewportTransform(
  transform: ViewportTransform,
  width: number,
  height: number,
): ViewportTransform {
  const scale = Math.max(MIN_VIEWPORT_SCALE, Math.min(MAX_VIEWPORT_SCALE, transform.scale));
  // Keep the horizon/planisphere recoverable. A small extra margin lets a
  // user inspect an edge without allowing the scene to disappear completely.
  const maxX = Math.max(0, Math.min(width, height) * 0.48 * (scale - 1) + width * 0.08);
  const maxY = Math.max(0, Math.min(width, height) * 0.48 * (scale - 1) + height * 0.08);
  return {
    scale,
    offsetX: Math.max(-maxX, Math.min(maxX, Number.isFinite(transform.offsetX) ? transform.offsetX : 0)),
    offsetY: Math.max(-maxY, Math.min(maxY, Number.isFinite(transform.offsetY) ? transform.offsetY : 0)),
  };
}

export function applyViewportTransform(
  point: ViewportPoint,
  width: number,
  height: number,
  transform: ViewportTransform,
): ViewportPoint {
  const cx = width / 2;
  const cy = height / 2;
  return {
    x: cx + (point.x - cx) * transform.scale + transform.offsetX,
    y: cy + (point.y - cy) * transform.scale + transform.offsetY,
  };
}

export function zoomViewportAt(
  current: ViewportTransform,
  nextScale: number,
  focusPoint: ViewportPoint,
  width: number,
  height: number,
): ViewportTransform {
  const safeScale = Math.max(MIN_VIEWPORT_SCALE, Math.min(MAX_VIEWPORT_SCALE, nextScale));
  const cx = width / 2;
  const cy = height / 2;
  const ratio = safeScale / current.scale;
  const relativeX = focusPoint.x - cx - current.offsetX;
  const relativeY = focusPoint.y - cy - current.offsetY;
  return clampViewportTransform({
    scale: safeScale,
    offsetX: focusPoint.x - cx - relativeX * ratio,
    offsetY: focusPoint.y - cy - relativeY * ratio,
  }, width, height);
}

export function viewportZoomLabel(scale: number): string {
  return `${Math.round(scale * 100)}%`;
}
