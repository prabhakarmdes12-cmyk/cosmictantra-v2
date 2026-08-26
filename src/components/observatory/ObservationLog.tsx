'use client';

import Link from 'next/link';
import { Download, NotebookPen, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ObserverLocation } from '@/lib/astronomy/projection';
import type { ObservationPlan } from '@/lib/astronomy/observation';
import {
  createObservationLogEntry,
  MAX_OBSERVATION_LOG_ENTRIES,
  observationLogToCsv,
  OBSERVATION_LOG_STORAGE_KEY,
  parseObservationLog,
  serializeObservationLog,
  type ObservationLogDraft,
  type ObservationLogEntry,
} from '@/lib/astronomy/observationLog';

interface ObservationLogProps {
  date: Date;
  observer: ObserverLocation;
  cityId: string;
  cityName: string;
  timezoneOffsetHours: number;
  selectedPlan: ObservationPlan;
  rashiName: string;
  nakshatraName: string;
  pada: number;
  moonPhaseName: string;
}

type StorageState = 'loading' | 'ready' | 'unavailable';

function localTimestamp(value: string, timezoneOffsetHours: number): string {
  const date = new Date(new Date(value).getTime() + timezoneOffsetHours * 60 * 60 * 1000);
  const offset = timezoneOffsetHours === 0 ? 'UTC' : `UTC${timezoneOffsetHours > 0 ? '+' : ''}${timezoneOffsetHours}`;
  return `${date.toISOString().slice(0, 10)} · ${date.toISOString().slice(11, 16)} ${offset}`;
}

function offsetLabel(timezoneOffsetHours: number): string {
  return timezoneOffsetHours === 0 ? 'UTC' : `UTC${timezoneOffsetHours > 0 ? '+' : ''}${timezoneOffsetHours}`;
}

function newEntryId(): string {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `observation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function reopenHref(entry: ObservationLogEntry): string {
  const params = new URLSearchParams({ city: entry.cityId, time: entry.observedAt, planet: entry.body });
  return `/observatory?${params.toString()}`;
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ObservationLog({
  date,
  observer,
  cityId,
  cityName,
  timezoneOffsetHours,
  selectedPlan,
  rashiName,
  nakshatraName,
  pada,
  moonPhaseName,
}: ObservationLogProps) {
  const [entries, setEntries] = useState<ObservationLogEntry[]>([]);
  const [note, setNote] = useState('');
  const [markObserved, setMarkObserved] = useState(Boolean(selectedPlan.horizontal));
  const [storageState, setStorageState] = useState<StorageState>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      setEntries(parseObservationLog(window.localStorage.getItem(OBSERVATION_LOG_STORAGE_KEY)));
      setStorageState('ready');
    } catch {
      setStorageState('unavailable');
    }
  }, []);

  useEffect(() => {
    setMarkObserved(Boolean(selectedPlan.horizontal));
  }, [date, selectedPlan.body.body, selectedPlan.horizontal]);

  useEffect(() => {
    if (storageState !== 'ready') return;
    try {
      window.localStorage.setItem(OBSERVATION_LOG_STORAGE_KEY, serializeObservationLog(entries));
    } catch {
      setStorageState('unavailable');
    }
  }, [entries, storageState]);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2400);
  };

  const saveEntry = () => {
    const horizontal = selectedPlan.horizontal;
    const draft: ObservationLogDraft = {
      observedAt: date.toISOString(),
      cityId,
      cityName,
      observer: { ...observer },
      timezoneOffsetHours,
      body: selectedPlan.body.body,
      source: selectedPlan.body.source,
      physicalSky: Boolean(horizontal),
      altitudeDeg: horizontal?.altitudeDeg ?? null,
      azimuthDeg: horizontal?.azimuthDeg ?? null,
      direction: selectedPlan.direction,
      altitudeBand: selectedPlan.altitudeBand,
      tropicalLongitude: selectedPlan.body.tropicalLongitude,
      siderealLongitude: selectedPlan.body.siderealLongitude,
      rashi: rashiName,
      nakshatra: nakshatraName,
      pada,
      lunarSeparationDeg: selectedPlan.lunarSeparationDeg,
      moonPhase: moonPhaseName,
      status: horizontal && markObserved ? 'observed' : 'planned',
      note,
    };
    const entry = createObservationLogEntry(draft, newEntryId(), new Date().toISOString());
    setEntries(current => [entry, ...current].slice(0, MAX_OBSERVATION_LOG_ENTRIES));
    setNote('');
    flash(storageState === 'ready' ? 'Saved to this browser' : 'Added for this session; browser storage is unavailable');
  };

  const removeEntry = (id: string) => {
    setEntries(current => current.filter(entry => entry.id !== id));
    flash('Entry removed');
  };

  const clearEntries = () => {
    if (entries.length === 0 || !window.confirm('Clear the observation log stored in this browser?')) return;
    setEntries([]);
    flash('Observation log cleared');
  };

  const exportJson = () => {
    if (entries.length === 0) return;
    downloadFile('cosmictantra-observation-log.json', `${JSON.stringify(entries, null, 2)}\n`, 'application/json');
    flash('JSON log downloaded');
  };

  const exportCsv = () => {
    if (entries.length === 0) return;
    downloadFile('cosmictantra-observation-log.csv', `${observationLogToCsv(entries)}\n`, 'text/csv');
    flash('CSV log downloaded');
  };

  const physicalSky = Boolean(selectedPlan.horizontal);

  return (
    <article className="rounded-2xl border border-[#D4AF37]/25 bg-[#0B1020] p-5" aria-labelledby="observation-log-title">
      <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]"><NotebookPen className="h-3.5 w-3.5" /> Personal field log</div>
          <h3 id="observation-log-title" className="mt-1 font-editorial text-2xl font-bold text-[#F4F0E6]">Keep the observation, not just the number.</h3>
          <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-[#9DA8C1]">Save a reproducible snapshot of this city, instant, target and coordinate context. The log stays in this browser; it is not uploaded or synced.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportJson} disabled={entries.length === 0} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 font-mono-data text-[10px] font-bold text-[#C9D0E5] transition-colors hover:border-[#D4AF37]/60 hover:text-[#F2C65D] disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-3.5 w-3.5" /> JSON</button>
          <button type="button" onClick={exportCsv} disabled={entries.length === 0} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 font-mono-data text-[10px] font-bold text-[#C9D0E5] transition-colors hover:border-[#D4AF37]/60 hover:text-[#F2C65D] disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-3.5 w-3.5" /> CSV</button>
          <button type="button" onClick={clearEntries} disabled={entries.length === 0} className="rounded-xl border border-[#E19A72]/25 px-3 py-2 font-mono-data text-[10px] font-bold text-[#D89B80] transition-colors hover:border-[#E19A72]/60 disabled:cursor-not-allowed disabled:opacity-40">Clear</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.35fr_auto] lg:items-end">
        <div className="rounded-xl border border-white/[0.08] bg-[#070A14] p-3 font-mono-data text-[10px]">
          <div className="text-[#7F89A7]">Snapshot target</div>
          <div className="mt-1 text-sm font-bold text-[#E8ECF7]">{selectedPlan.body.body} · {cityName}</div>
          <div className="mt-1 text-[#A7B1CB]">{localTimestamp(date.toISOString(), timezoneOffsetHours)} · {rashiName} · {nakshatraName} pada {pada}</div>
          <div className="mt-2 text-[#7F89A7]">{physicalSky ? `${selectedPlan.horizontal?.altitudeDeg.toFixed(1)}° altitude · ${selectedPlan.direction} · ${selectedPlan.altitudeBand}` : 'Coordinate study only · no physical sky position'}</div>
        </div>
        <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#9DA6C4]">
          Field note <span className="font-normal normal-case tracking-normal text-[#68738F]">optional, up to 1,200 characters</span>
          <textarea value={note} maxLength={1200} onChange={event => setNote(event.target.value)} rows={3} placeholder="What did you notice? Add seeing conditions, equipment, or a Jyotish study question." className="mt-2 block w-full resize-y rounded-xl border border-white/10 bg-[#050710] px-3 py-2.5 text-xs font-normal normal-case tracking-normal text-[#F0F1F8] outline-none placeholder:text-[#68738F] focus:border-[#D4AF37]" />
        </label>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 font-mono-data text-[10px] text-[#C6CDDF]">
            <input type="checkbox" checked={markObserved} disabled={!physicalSky} onChange={event => setMarkObserved(event.target.checked)} className="accent-[#D4AF37]" />
            Mark as observed
          </label>
          <button type="button" onClick={saveEntry} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D4AF37] px-4 py-3 font-mono-data text-[10px] font-bold uppercase tracking-[0.12em] text-[#080A12] transition-colors hover:bg-[#F2C65D]">Save {physicalSky ? 'observation' : 'study note'}</button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono-data text-[9px] text-[#707A98]">
        <span>{entries.length} / {MAX_OBSERVATION_LOG_ENTRIES} saved entries · timestamps retain the selected fixed offset ({offsetLabel(timezoneOffsetHours)}).</span>
        <span aria-live="polite" className="text-[#91C7A5]">{storageState === 'loading' ? 'Loading local log…' : storageState === 'unavailable' ? 'Browser storage unavailable · session only' : message || 'Local-only notebook'}</span>
      </div>

      {entries.length > 0 && (
        <ol className="mt-4 space-y-2" aria-label="Saved observation entries">
          {entries.map(entry => (
            <li key={entry.id} className="rounded-xl border border-white/[0.08] bg-[#070A14] p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-mono-data text-[10px]">
                    <strong className="text-[#E3E8F5]">{entry.body}</strong>
                    <span className={`rounded-full border px-2 py-0.5 text-[8px] uppercase tracking-wider ${entry.status === 'observed' ? 'border-[#91C7A5]/30 text-[#91C7A5]' : 'border-[#F2C65D]/30 text-[#F2C65D]'}`}>{entry.status}</span>
                    {!entry.physicalSky && <span className="text-[#E19A72]">mathematical node study</span>}
                  </div>
                  <div className="mt-1 font-mono-data text-[9px] text-[#7F89A7]">{entry.cityName} · {localTimestamp(entry.observedAt, entry.timezoneOffsetHours)} · {entry.rashi} · {entry.nakshatra} pada {entry.pada}</div>
                  <div className="mt-2 text-[10px] leading-relaxed text-[#B2BBD0]">{entry.physicalSky ? `${entry.altitudeDeg?.toFixed(1)}° altitude · ${entry.direction} · ${entry.altitudeBand}` : 'No physical altitude or azimuth recorded for Rahu/Ketu.'}{entry.note ? ` · ${entry.note}` : ''}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={reopenHref(entry)} className="rounded-lg border border-white/10 px-2.5 py-1.5 font-mono-data text-[9px] font-bold uppercase tracking-wider text-[#C9D0E5] hover:border-[#D4AF37]/60 hover:text-[#F2C65D]">Reopen</Link>
                  <button type="button" onClick={() => removeEntry(entry.id)} aria-label={`Remove ${entry.body} observation from ${entry.cityName}`} className="rounded-lg border border-white/10 p-2 text-[#9CA6BF] hover:border-[#E19A72]/60 hover:text-[#E19A72]"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
