'use client';

import { AlertTriangle, Camera, ExternalLink, Radio, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  LiveFrameMetadata,
  LiveObservationMode,
  LiveObservationResponse,
  LiveTarget,
  LiveProviderCapability,
} from '@/lib/observatory/live';
import { LIVE_OBSERVATION_ZOOM_THRESHOLD } from '@/lib/observatory/live';

interface LiveObservationPanelProps {
  target: LiveTarget;
  date: Date;
  deepZoom: boolean;
  onResponseChange?: (response: LiveObservationResponse | null) => void;
}

interface AgentStatusPayload {
  status: {
    configured: boolean;
    reachable: boolean;
    protocols: string[];
    equipment: { mount: string; camera: string; dome: string; weather: string };
    note: string;
  };
}

function modeLabel(mode: LiveObservationMode): string {
  switch (mode) {
    case 'near-real-time-public': return 'near-real-time public mission image';
    case 'remote-exposure': return 'queued remote exposure';
    case 'camera-stream': return 'user telescope camera stream';
    case 'archival-reference': return 'archival/reference image';
    default: return mode;
  }
}

function availabilityLabel(provider: LiveProviderCapability): string {
  if (provider.configured && provider.availability === 'public-feed') return 'public adapter';
  if (provider.availability === 'always-on') return 'always available';
  if (provider.availability === 'requires-account') return 'account / program';
  if (provider.availability === 'session-or-link') return 'session or partner link';
  if (provider.availability === 'local-gateway') return 'gateway not connected';
  return 'disabled';
}

function timeLabel(value: string | null, missing = 'not supplied'): string {
  if (!value) return missing;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : missing;
}

function frameField(label: string, value: string) {
  return <div className="rounded-lg border border-white/[0.07] bg-[#070A13] px-2.5 py-2"><dt className="text-[#71809F]">{label}</dt><dd className="mt-1 break-words text-[#DCE2F2]">{value}</dd></div>;
}

export default function LiveObservationPanel({ target, date, deepZoom, onResponseChange }: LiveObservationPanelProps) {
  const [response, setResponse] = useState<LiveObservationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [agentStatus, setAgentStatus] = useState<AgentStatusPayload['status'] | null>(null);

  useEffect(() => {
    setResponse(null);
    setError(null);
    setImageFailed(false);
    onResponseChange?.(null);
  }, [date, deepZoom, onResponseChange, target.kind, target.id]);

  useEffect(() => {
    if (!deepZoom) return undefined;
    const controller = new AbortController();
    const params = new URLSearchParams({ kind: target.kind, id: String(target.id), date: date.toISOString() });
    setLoading(true);
    setError(null);
    setImageFailed(false);
    fetch(`/api/observatory/live?${params.toString()}`, { signal: controller.signal, headers: { accept: 'application/json' } })
      .then(async result => {
        const payload = await result.json() as LiveObservationResponse & { error?: string };
        if (!result.ok) throw new Error(payload.error || `Provider capability request failed (${result.status})`);
        return payload;
      })
      .then(payload => {
        setResponse(payload);
        onResponseChange?.(payload);
      })
      .catch(reason => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : 'Provider capability request failed.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [date, deepZoom, onResponseChange, refreshToken, target.id, target.kind]);

  useEffect(() => {
    if (!deepZoom) {
      setAgentStatus(null);
      return undefined;
    }
    const controller = new AbortController();
    fetch('/api/observatory/agent/status', { signal: controller.signal, headers: { accept: 'application/json' } })
      .then(async result => {
        if (!result.ok) throw new Error(`Agent status request failed (${result.status})`);
        return result.json() as Promise<AgentStatusPayload>;
      })
      .then(payload => setAgentStatus(payload.status))
      .catch(reason => {
        if (!(reason instanceof DOMException && reason.name === 'AbortError')) setAgentStatus(null);
      });
    return () => controller.abort();
  }, [deepZoom, refreshToken]);

  const frame = response?.frame;
  const visibleProviders = response?.providers || [];

  return (
    <section aria-labelledby="live-observation-title" className="mt-4 rounded-2xl border border-[#8B8BF5]/30 bg-[#0B1020] p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.18em] text-[#C4C5FF]"><Radio className="h-3.5 w-3.5" /> Reality layer · provider-backed frames</div>
          <h2 id="live-observation-title" className="mt-1 font-editorial text-2xl font-bold text-[#F4F0E6]">{target.label} · real observation path</h2>
          <p className="mt-2 max-w-3xl text-[10px] leading-relaxed text-[#AAB3D0]">The local stereographic sky remains the calculated instrument. At deeper zoom this server-side adapter checks whether an actual mission frame, remote exposure, or authenticated telescope camera can support the selected target; it never stretches an illustration into a camera feed.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-[#91C7A5]/25 bg-[#102019] px-2.5 py-1.5 font-mono-data text-[9px] font-bold uppercase tracking-[0.1em] text-[#91C7A5]"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#91C7A5]" /> Local calculation active</span>
          {deepZoom && <button type="button" onClick={() => setRefreshToken(value => value + 1)} aria-label="Refresh provider frame metadata" className="rounded-lg border border-white/10 p-2 text-[#BFC7E2] hover:border-[#D4AF37]/60 hover:text-[#F2C65D]"><RefreshCw className="h-3.5 w-3.5" /></button>}
        </div>
      </div>

      {!deepZoom && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.08] bg-[#070A13] p-3 text-[10px] leading-relaxed text-[#A8B2CC]">
          <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F2C65D]" />
          <span><strong className="text-[#F2C65D]">Zoom to {LIVE_OBSERVATION_ZOOM_THRESHOLD.toFixed(2)}×.</strong> The server will then resolve a provider capability for {target.label}. Until that point no external image request is made.</span>
        </div>
      )}

      {deepZoom && loading && <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#070A13] p-4 font-mono-data text-[10px] text-[#B8C1DA]" role="status">Checking allowlisted provider adapters for {target.label}…</div>}
      {deepZoom && error && <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#E19A72]/30 bg-[#24171A] p-3 text-[10px] leading-relaxed text-[#E7B6A5]" role="alert"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}. The local calculated sky is unchanged.</div>}

      {deepZoom && response && (
        <>
          {frame && frame.status === 'available' && frame.imageUrl && !imageFailed ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-[#C4C5FF]/25 bg-[#050710]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] px-3 py-2 font-mono-data text-[9px] uppercase tracking-[0.12em] text-[#B7BEE0]">
                <span><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#F2C65D]" /> {modeLabel(frame.mode)}</span>
                <span className="text-[#7F89A7]">{frame.providerLabel}</span>
              </div>
              <div className="bg-black/30 p-2 sm:p-4">
                <img src={frame.imageUrl} alt={`${frame.providerLabel} frame for ${frame.target.label}; not the local calculated sky`} onError={() => setImageFailed(true)} className="mx-auto max-h-[560px] w-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="border-t border-white/[0.08] px-3 py-2 text-[9px] leading-relaxed text-[#8F99B5]">This image is a separate provider frame. It is not aligned to the local sky projection or evidence that an arbitrary zoom level has optical coverage.</div>
            </div>
          ) : frame && frame.status === 'available' && frame.imageUrl && imageFailed ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#E19A72]/30 bg-[#24171A] p-3 text-[10px] leading-relaxed text-[#E7B6A5]" role="alert"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> The provider metadata resolved, but the image gateway could not load the frame. The local calculated sky is unchanged.</div>
          ) : (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.08] bg-[#070A13] p-3 text-[10px] leading-relaxed text-[#A8B2CC]"><Camera className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F2C65D]" /> No provider-backed frame is available for this target in this deployment. No image is being fabricated; connect an approved remote-telescope account or a server-side user observatory gateway for a personalized optical view.</div>
          )}

          {frame && (
            <dl className="mt-4 grid gap-2 font-mono-data text-[9px] sm:grid-cols-2 lg:grid-cols-4">
              {frameField('Provider', frame.providerLabel)}
              {frameField('Frame ID', frame.frameId)}
              {frameField('Target', `${frame.target.label} · ${frame.target.kind}`)}
              {frameField('Status', `${frame.status} · ${modeLabel(frame.mode)}`)}
              {frameField('Requested time', timeLabel(frame.requestedAtUtc))}
              {frameField('Capture time', timeLabel(frame.capturedAtUtc, 'not supplied by provider'))}
              {frameField('Receive time', timeLabel(frame.receivedAtUtc))}
              {frameField('Wavelength / filter', `${frame.wavelengthLabel || 'not supplied'} · ${frame.filter || 'filter not supplied'}`)}
              {frameField('Exposure', frame.exposureSeconds === null ? 'not supplied' : `${frame.exposureSeconds}s`)}
              {frameField('Pixel scale', frame.pixelScaleArcsecPerPixel === null ? 'not supplied' : `${frame.pixelScaleArcsecPerPixel.toFixed(4)} arcsec/pixel`)}
              {frameField('Processing', frame.processingLevel || 'not supplied')}
              {frameField('Freshness', `${frame.freshness}${frame.staleAfterUtc ? ` · deadline ${timeLabel(frame.staleAfterUtc)}` : ''}`)}
              {frameField('Quality', frame.quality)}
            </dl>
          )}

          {frame && <div className="mt-3 grid gap-3 rounded-xl border border-white/[0.08] bg-[#070A13] p-3 text-[9px] leading-relaxed text-[#8F99B5] sm:grid-cols-2">
            <div><strong className="text-[#C8D0E7]">Attribution:</strong> {frame.attribution}<br /><strong className="text-[#C8D0E7]">License / use:</strong> {frame.license}</div>
            <div><strong className="text-[#C8D0E7]">Provider notes:</strong> {frame.useNotes} {frame.notes.join(' ')}</div>
            {frame.sourceUrl && <a href={frame.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[#F2C65D] hover:underline">Open source metadata ↗ <ExternalLink className="h-3 w-3" /></a>}
          </div>}

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProviders.map(provider => (
              <article key={provider.id} className="rounded-xl border border-white/[0.07] bg-[#070A13] p-3">
                <div className="flex items-start justify-between gap-2"><h3 className="text-xs font-bold text-[#DCE1F0]">{provider.label}</h3><span className="whitespace-nowrap font-mono-data text-[8px] uppercase tracking-[0.08em] text-[#91C7A5]">{availabilityLabel(provider)}</span></div>
                <p className="mt-1 text-[9px] leading-relaxed text-[#7F89A7]">{provider.modes.filter(mode => mode !== 'local-calculation').map(modeLabel).join(' · ')}</p>
                <ul className="mt-2 space-y-1 text-[9px] leading-relaxed text-[#8993B0]">{provider.limitations.slice(0, 2).map(note => <li key={note}>· {note}</li>)}</ul>
              </article>
            ))}
          </div>

          {agentStatus && <article className="mt-3 rounded-xl border border-[#91C7A5]/20 bg-[#102019] p-3 text-[9px] leading-relaxed text-[#B9D8C0]">
            <div className="flex items-center justify-between gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.12em]"><span>Local observatory agent</span><span className={agentStatus.reachable ? 'text-[#91C7A5]' : 'text-[#F2C65D]'}>{agentStatus.reachable ? 'reachable' : agentStatus.configured ? 'configured · no status' : 'not configured'}</span></div>
            <p className="mt-1">{agentStatus.note} {agentStatus.protocols.length ? `Protocols: ${agentStatus.protocols.join(' / ')}.` : ''}</p>
            {agentStatus.configured && <p className="mt-1 font-mono-data text-[8px] text-[#8FA89A]">Mount {agentStatus.equipment.mount} · camera {agentStatus.equipment.camera} · dome {agentStatus.equipment.dome} · weather {agentStatus.equipment.weather}</p>}
          </article>}
        </>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#91C7A5]/20 bg-[#102019] p-3 text-[9px] leading-relaxed text-[#B9D8C0]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#91C7A5]" /> Mount movement, camera exposure, dome, weather, and safety actions are separate control-plane operations. They are disabled by default and require authentication, explicit per-action authorization, provider interlocks, and an audit record; this panel only reads metadata and frames.</div>
    </section>
  );
}
