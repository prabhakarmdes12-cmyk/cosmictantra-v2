import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { calculateCanonicalBody, type CanonicalBodyName } from '@/lib/astronomy/canonicalBodies';
import { planObservation } from '@/lib/astronomy/observation';
import {
  allLiveProviderCapabilities,
  createLiveObservationResponse,
  fetchSolarFrame,
  liveProviderCapabilitiesFor,
  normalizeLiveTarget,
  type LiveObservationResponse,
  type LiveTarget,
} from './live';
import { DEFAULT_OBSERVATORY_SAFETY_POLICY, evaluateObservationAction, safetyPolicySummary } from './live/safety';

export const OBSERVATORY_MCP_SERVER_NAME = 'cosmictantra-observatory';
export const OBSERVATORY_MCP_SERVER_VERSION = '0.1.0';

export interface ObservatoryMcpServerOptions {
  /** Absolute origin used only to turn internal frame paths into fetchable HTTP URLs for an MCP client. */
  publicBaseUrl?: string;
}

function textResult(value: unknown, isError = false) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }], ...(isError ? { isError: true } : {}) };
}

function validDate(value?: string): Date | null {
  const date = value ? new Date(value) : new Date();
  return Number.isFinite(date.getTime()) ? date : null;
}

function resolveTarget(kind: string, id: string): LiveTarget | null {
  return normalizeLiveTarget(kind, id);
}

function withAbsoluteTransportUrls(response: LiveObservationResponse, baseUrl?: string): LiveObservationResponse {
  if (!baseUrl || !response.frame) return response;
  const frame = response.frame;
  return {
    ...response,
    frame: {
      ...frame,
      imageUrl: frame.imageUrl ? new URL(frame.imageUrl, baseUrl).toString() : null,
      tilesUrlTemplate: frame.tilesUrlTemplate ? new URL(frame.tilesUrlTemplate, baseUrl).toString() : null,
    },
  };
}

export function createObservatoryMcpServer(options: ObservatoryMcpServerOptions = {}): McpServer {
  const server = new McpServer({ name: OBSERVATORY_MCP_SERVER_NAME, version: OBSERVATORY_MCP_SERVER_VERSION });

  server.registerTool('resolve_target', {
    title: 'Resolve an Observatory target',
    description: 'Validate a known planet, catalogue star, constellation, or provider event id before planning or asking for a frame.',
    inputSchema: {
      kind: z.enum(['planet', 'star', 'constellation', 'event']),
      id: z.string().min(1).max(100),
    },
  }, async ({ kind, id }) => {
    const target = resolveTarget(kind, id);
    return target ? textResult({ target, providers: liveProviderCapabilitiesFor(target) }) : textResult({ error: 'Unsupported or unknown Observatory target.' }, true);
  });

  server.registerTool('get_observatory_status', {
    title: 'Get Observatory provider status',
    description: 'Return capability and safety metadata. This is read-only and does not move equipment or request an exposure.',
  }, async () => textResult({
    server: OBSERVATORY_MCP_SERVER_NAME,
    providers: allLiveProviderCapabilities(),
    safety: safetyPolicySummary(),
    transport: {
      mcp: 'control and context plane for metadata, planning, and explicitly authorized operations',
      frames: 'ordinary HTTP/CDN/object storage; WebSocket/SSE for status; WebRTC only for a true low-latency camera stream',
      warning: 'MCP is not used as the high-throughput image/video transport.',
    },
  }));

  server.registerTool('get_latest_frame', {
    title: 'Get provider frame metadata',
    description: 'Resolve the newest allowlisted provider frame for a target. Returns metadata and an HTTP transport URL, never image bytes through MCP.',
    inputSchema: {
      kind: z.enum(['planet', 'star', 'constellation', 'event']),
      id: z.string().min(1).max(100),
      requestedAtUtc: z.string().datetime().optional(),
    },
  }, async ({ kind, id, requestedAtUtc }) => {
    const target = resolveTarget(kind, id);
    if (!target) return textResult({ error: 'Unsupported or unknown Observatory target.' }, true);
    const date = validDate(requestedAtUtc);
    if (!date) return textResult({ error: 'requestedAtUtc must be a valid ISO instant.' }, true);
    const instant = date.toISOString();
    let response = createLiveObservationResponse(target, instant, null, []);
    if (target.kind === 'planet' && target.id === 'Sun') {
      const result = await fetchSolarFrame(target, instant);
      response = createLiveObservationResponse(target, instant, result.frame, result.notices);
    } else {
      response.notices.push('No public arbitrary-target frame is enabled for this target; use an approved remote telescope or authenticated local gateway adapter.');
    }
    return textResult(withAbsoluteTransportUrls(response, options.publicBaseUrl));
  });

  server.registerTool('explain_frame_provenance', {
    title: 'Explain frame provenance',
    description: 'Explain provider, licensing, capture, processing, and local-calculation boundaries for a selected provider.',
    inputSchema: { provider: z.string().min(1).max(80) },
  }, async ({ provider }) => {
    const match = allLiveProviderCapabilities().find(item => item.id === provider);
    return match ? textResult(match) : textResult({ error: 'Unknown Observatory provider.' }, true);
  });

  server.registerTool('plan_observation', {
    title: 'Plan a local observation',
    description: 'Return the existing transparent approximate local horizon cue for a physical graha. Rahu and Ketu remain mathematical nodes and do not receive physical rise/set output.',
    inputSchema: {
      body: z.enum(['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']),
      epochUtc: z.string().datetime(),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    },
  }, async ({ body, epochUtc, latitude, longitude }) => {
    const date = validDate(epochUtc);
    if (!date) return textResult({ error: 'epochUtc must be a valid ISO instant.' }, true);
    const canonical = calculateCanonicalBody(body as CanonicalBodyName, date);
    return textResult({
      target: { kind: 'planet', id: canonical.body, label: canonical.body },
      plan: planObservation(date, { latitude, longitude }, canonical.body),
      note: 'This uses the local deterministic approximation and inherits the Observatory qualification limits; it is not a precision almanac.',
    });
  });

  server.registerTool('request_exposure', {
    title: 'Request a telescope exposure',
    description: 'Reserved control-plane seam. Disabled by default; no mount, dome, weather, or camera action can be dispatched through this deployment.',
    inputSchema: {
      kind: z.enum(['planet', 'star', 'event']),
      id: z.string().min(1).max(100),
      action: z.literal('camera.exposure'),
      explicitUserAuthorization: z.boolean(),
      actorId: z.string().optional(),
      auditRequestId: z.string().optional(),
    },
  }, async ({ kind, id, explicitUserAuthorization, actorId, auditRequestId }) => {
    const target = resolveTarget(kind, id);
    if (!target) return textResult({ error: 'Unsupported or unknown telescope target.' }, true);
    const decision = evaluateObservationAction(DEFAULT_OBSERVATORY_SAFETY_POLICY, {
      action: 'camera.exposure',
      target,
      explicitUserAuthorization,
      actorId,
      auditRequestId,
    });
    return textResult({ accepted: false, decision, safety: safetyPolicySummary(), note: 'This is a locked seam. No image request or hardware command was sent.' }, true);
  });

  server.registerResource('live-provider-capabilities', 'observatory://live-provider-capabilities', {
    title: 'Observatory live provider capabilities',
    description: 'Capability matrix and control-plane boundary for live/reference imaging.',
    mimeType: 'application/json',
  }, async uri => ({
    contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify({ providers: allLiveProviderCapabilities(), safety: safetyPolicySummary() }, null, 2) }],
  }));

  return server;
}
