import type { LiveTarget } from './live/types';

export type ObservatoryAgentProtocol = 'ascom-alpaca' | 'indi';

export interface ObservatoryAgentStatus {
  configured: boolean;
  reachable: boolean;
  protocols: ObservatoryAgentProtocol[];
  endpoint: string | null;
  equipment: {
    mount: 'ready' | 'tracking' | 'parked' | 'unknown' | 'not-reported';
    camera: 'ready' | 'exposing' | 'idle' | 'unknown' | 'not-reported';
    dome: 'safe' | 'open' | 'closed' | 'unknown' | 'not-reported';
    weather: 'safe' | 'unsafe' | 'unknown' | 'not-reported';
  };
  note: string;
}

export interface ObservatoryAgentFrameRequest {
  target: LiveTarget;
  requestedAtUtc: string;
  /** Server-side only; never send this token to browser code. */
  authorization: 'server-gateway';
}

export interface ObservatoryAgentFramePayload {
  frameId: string;
  capturedAtUtc: string | null;
  receivedAtUtc: string | null;
  wavelengthNm?: number | null;
  wavelengthLabel?: string | null;
  filter?: string | null;
  exposureSeconds?: number | null;
  pixelScaleArcsecPerPixel?: number | null;
  processingLevel?: string | null;
  previewPath: string;
  streamPath?: string | null;
  notes?: string[];
}

export interface ObservatoryAgentConfiguration {
  baseUrl: string | null;
  tokenConfigured: boolean;
  protocol: ObservatoryAgentProtocol | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function statusValue(value: unknown, allowed: readonly string[]): string {
  return typeof value === 'string' && allowed.includes(value) ? value : 'unknown';
}

/**
 * Validate a deployment-provided agent URL. No browser input is ever accepted
 * here, which keeps the live route from becoming an arbitrary LAN/SSRF proxy.
 */
function isPrivateAgentHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === 'localhost.localdomain' || host === '::1' || host === '127.0.0.1') return true;
  if (/^10\.(?:\d{1,3}\.){2}\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.(?:\d{1,3}\.)\d{1,3}$/.test(host)) return true;
  const private172 = /^172\.(\d{1,3})\.(?:\d{1,3}\.)\d{1,3}$/.exec(host);
  if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return true;
  return host.endsWith('.local');
}

export function validateAgentBaseUrl(value: string | undefined, production = true): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return null;
    if (url.protocol === 'https:') return url.toString().replace(/\/$/, '');
    // Alpaca/INDI agents commonly use HTTP on a trusted observatory LAN. In
    // production, permit only explicit private/local deployment hosts; a
    // public HTTP URL is never accepted by this boundary.
    if (url.protocol === 'http:' && (!production || isPrivateAgentHost(url.hostname))) return url.toString().replace(/\/$/, '');
    return null;
  } catch {
    return null;
  }
}

export function agentConfiguration(env: Record<string, string | undefined> = process.env, production = process.env.NODE_ENV === 'production'): ObservatoryAgentConfiguration {
  const baseUrl = validateAgentBaseUrl(env.OBSERVATORY_AGENT_URL, production);
  const protocol = env.OBSERVATORY_AGENT_PROTOCOL === 'indi' ? 'indi' : env.OBSERVATORY_AGENT_PROTOCOL === 'ascom-alpaca' ? 'ascom-alpaca' : null;
  return { baseUrl, tokenConfigured: Boolean(env.OBSERVATORY_AGENT_TOKEN), protocol };
}

export function unavailableAgentStatus(configuration: ObservatoryAgentConfiguration = agentConfiguration()): ObservatoryAgentStatus {
  const fullyConfigured = Boolean(configuration.baseUrl && configuration.tokenConfigured && configuration.protocol);
  return {
    configured: fullyConfigured,
    reachable: false,
    protocols: configuration.protocol ? [configuration.protocol] : ['ascom-alpaca', 'indi'],
    endpoint: configuration.baseUrl,
    equipment: { mount: 'not-reported', camera: 'not-reported', dome: 'not-reported', weather: 'not-reported' },
    note: fullyConfigured
      ? 'The server-side agent is configured but has not reported status yet.'
      : 'No authenticated observatory agent is configured. Browser LAN discovery and direct device control are disabled.',
  };
}

export function parseAgentStatus(value: unknown, configuration: ObservatoryAgentConfiguration): ObservatoryAgentStatus | null {
  if (!isRecord(value)) return null;
  const protocols = Array.isArray(value.protocols)
    ? value.protocols.filter((item): item is ObservatoryAgentProtocol => item === 'ascom-alpaca' || item === 'indi')
    : [];
  const equipment = isRecord(value.equipment) ? value.equipment : {};
  return {
    configured: true,
    reachable: value.reachable === true,
    protocols: protocols.length > 0 ? protocols : configuration.protocol ? [configuration.protocol] : [],
    endpoint: configuration.baseUrl,
    equipment: {
      mount: statusValue(equipment.mount, ['ready', 'tracking', 'parked', 'unknown', 'not-reported']) as ObservatoryAgentStatus['equipment']['mount'],
      camera: statusValue(equipment.camera, ['ready', 'exposing', 'idle', 'unknown', 'not-reported']) as ObservatoryAgentStatus['equipment']['camera'],
      dome: statusValue(equipment.dome, ['safe', 'open', 'closed', 'unknown', 'not-reported']) as ObservatoryAgentStatus['equipment']['dome'],
      weather: statusValue(equipment.weather, ['safe', 'unsafe', 'unknown', 'not-reported']) as ObservatoryAgentStatus['equipment']['weather'],
    },
    note: typeof value.note === 'string' ? value.note : 'Agent returned a status response without a note.',
  };
}

export async function fetchObservatoryAgentStatus(
  fetcher: typeof fetch = fetch,
  env: Record<string, string | undefined> = process.env,
): Promise<ObservatoryAgentStatus> {
  const configuration = agentConfiguration(env);
  const unavailable = unavailableAgentStatus(configuration);
  if (!unavailable.configured || !configuration.baseUrl) return unavailable;

  try {
    const response = await fetcher(`${configuration.baseUrl}/v1/status`, {
      headers: { accept: 'application/json', authorization: `Bearer ${env.OBSERVATORY_AGENT_TOKEN}` },
      cache: 'no-store',
    });
    if (!response.ok) return { ...unavailable, note: `Configured agent returned HTTP ${response.status}.` };
    const parsed = parseAgentStatus(await response.json() as unknown, configuration);
    return parsed || { ...unavailable, note: 'Configured agent returned an invalid status payload.' };
  } catch (error) {
    return { ...unavailable, note: `Configured agent is unreachable: ${error instanceof Error ? error.message : 'connection error'}` };
  }
}
