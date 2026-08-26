'use client';

import { Maximize2, Minus, Plus } from 'lucide-react';
import { MAX_VIEWPORT_SCALE, MIN_VIEWPORT_SCALE, viewportZoomLabel } from '@/lib/astronomy/viewTransform';

export interface CanvasViewControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  label?: string;
}

export default function CanvasViewControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  label = 'Canvas view controls',
}: CanvasViewControlsProps) {
  const atMinimum = zoom <= MIN_VIEWPORT_SCALE;
  const atMaximum = zoom >= MAX_VIEWPORT_SCALE;

  return (
    <div
      className="pointer-events-auto flex items-center gap-1 rounded-xl border border-white/10 bg-[#050812]/90 p-1 font-mono-data shadow-xl backdrop-blur"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={onZoomOut}
        disabled={atMinimum}
        aria-label="Zoom out"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#CBD2E5] transition-colors hover:bg-white/10 hover:text-[#F2C65D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F2C65D] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#CBD2E5]"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <output aria-live="polite" className="min-w-[3.5rem] text-center text-[10px] font-bold text-[#F2C65D]">
        {viewportZoomLabel(zoom)}
      </output>
      <button
        type="button"
        onClick={onZoomIn}
        disabled={atMaximum}
        aria-label="Zoom in"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#CBD2E5] transition-colors hover:bg-white/10 hover:text-[#F2C65D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F2C65D] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#CBD2E5]"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <span className="mx-0.5 h-5 w-px bg-white/10" />
      <button
        type="button"
        onClick={onReset}
        aria-label="Reset canvas view"
        className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[9px] font-bold uppercase tracking-[0.1em] text-[#AAB3CB] transition-colors hover:bg-white/10 hover:text-[#F2C65D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F2C65D]"
      >
        <Maximize2 className="h-3.5 w-3.5" />
        Reset
      </button>
    </div>
  );
}
