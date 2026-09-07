'use client';

/**
 * WORLD CALENDAR SYSTEMS SELECTOR (WORLD_CALENDAR_SYSTEMS.md)
 * Compact pill + modal to switch the active parallel calendar system
 * (9 systems). Selection persists in localStorage and drives the
 * parallel-date subtitles across the calendar.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Globe, ChevronDown, X, Check } from 'lucide-react';
import {
  WORLD_CALENDAR_SYSTEMS,
  SYSTEM_META_BY_ID,
  WorldCalendarSystemId,
  getWorldCalendarReading,
} from '@/lib/calendar/worldCalendarEngine';

const STORAGE_KEY = 'cosmictantra_calendar_system';

export function readStoredCalendarSystem(): WorldCalendarSystemId {
  if (typeof window === 'undefined') return 'drik';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && SYSTEM_META_BY_ID[raw as WorldCalendarSystemId]) {
      return raw as WorldCalendarSystemId;
    }
  } catch {}
  return 'drik';
}

export function persistCalendarSystem(id: WorldCalendarSystemId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}

interface WorldCalendarSelectorModalProps {
  value: WorldCalendarSystemId;
  onChange: (id: WorldCalendarSystemId) => void;
}

export default function WorldCalendarSelectorModal({ value, onChange }: WorldCalendarSelectorModalProps) {
  const [open, setOpen] = useState(false);
  const active = SYSTEM_META_BY_ID[value] || SYSTEM_META_BY_ID.drik;

  // Live "today" reading in each system (lightweight — no ephemeris round-trip).
  const todayReadings = useMemo(() => {
    const out: Partial<Record<WorldCalendarSystemId, string>> = {};
    try {
      for (const s of WORLD_CALENDAR_SYSTEMS) {
        const r = getWorldCalendarReading(new Date(), s.id);
        out[s.id] = `${r.eraYearLabel} • ${r.monthName}`;
      }
    } catch {}
    return out;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleSelect = (id: WorldCalendarSystemId) => {
    persistCalendarSystem(id);
    onChange(id);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        data-testid="world-calendar-selector"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#121522] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] transition-all cursor-pointer shadow-xs shrink-0 max-w-[190px]"
        title="कैलेंडर प्रणाली बदलें (World Calendar Systems)"
      >
        <Globe className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{active.emoji} {active.nameEn}</span>
        <ChevronDown className="w-3 h-3 shrink-0" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="कैलेंडर प्रणाली चुनें"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:max-w-xl bg-white dark:bg-[#0E101D] rounded-t-3xl sm:rounded-3xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/45 shadow-2xl max-h-[86vh] overflow-y-auto p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
              <div>
                <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white">
                  🌍 कैलेंडर प्रणाली चुनें
                </h3>
                <p className="text-[11px] font-mono-data text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                  9 World Calendar Systems • सभी पठन दृक् गणित (Lahiri) आधारित • Zero hardcoded dates
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-[#78716C] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {WORLD_CALENDAR_SYSTEMS.map((s, idx) => {
                const selected = s.id === value;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelect(s.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      selected
                        ? 'bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 border-[#8E6F1D]/60 dark:border-[#D4AF37]/60 shadow-sm'
                        : 'bg-[#FAF7F2] dark:bg-[#161826] border-black/5 dark:border-white/5 hover:border-[#8E6F1D]/40'
                    }`}
                  >
                    <span className="text-xl leading-none mt-0.5">{s.emoji}</span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1C1917] dark:text-white truncate">
                          {idx + 1}. {s.nameHi}
                        </span>
                        {selected && <Check className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#F0C968] shrink-0" />}
                        {s.isDefault && (
                          <span className="text-[9px] font-mono-data px-1.5 py-0.5 rounded bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#F0C968] font-bold shrink-0">
                            DEFAULT
                          </span>
                        )}
                      </span>
                      <span className="block text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                        {s.nameEn} • {s.region}
                      </span>
                      <span className="block text-[10px] font-mono-data text-[#8E6F1D]/80 dark:text-[#F0C968]/70 mt-0.5">
                        {s.epochNote}
                      </span>
                      {todayReadings[s.id] && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 text-[10px] font-mono-data font-bold text-[#57524A] dark:text-[#D1C9BF]">
                          आज: {todayReadings[s.id]}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
