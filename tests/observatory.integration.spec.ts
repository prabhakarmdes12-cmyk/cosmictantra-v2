import { test, expect } from '@playwright/test';
import { NextRequest } from 'next/server';
import { GET as liveGet } from '../src/app/api/observatory/live/route';
import { POST as hardwarePost } from '../src/app/api/observatory/live/request/route';
import { OPTIONS as mcpOptions, POST as mcpPost } from '../src/app/api/observatory/mcp/route';

function request(path: string, init?: ConstructorParameters<typeof NextRequest>[1]): NextRequest {
  return new NextRequest(`http://localhost${path}`, init);
}

test.describe('Observatory HTTP boundary integration', () => {
  test('live route returns a local-only contract for an unsupported external target', async () => {
    const response = await liveGet(request('/api/observatory/live?kind=star&id=sirius&date=2026-08-25T00%3A00%3A00.000Z'));
    expect(response.status).toBe(200);
    const payload = await response.json() as { target: { id: string }; frame: unknown; localCalculation: { mode: string }; notices: string[] };
    expect(payload.target.id).toBe('sirius');
    expect(payload.localCalculation.mode).toBe('local-calculation');
    expect(payload.frame).toBeNull();
    expect(payload.notices.join(' ')).toContain('No public provider-backed frame');
  });

  test('live route rejects unknown targets before any provider request', async () => {
    const response = await liveGet(request('/api/observatory/live?kind=planet&id=not-a-planet&date=2026-08-25T00%3A00%3A00.000Z'));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain('Unsupported live-observation target');
  });

  test('hardware route remains locked even with explicit request fields', async () => {
    const response = await hardwarePost(request('/api/observatory/live/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'planet', id: 'Jupiter', action: 'camera.exposure', explicitUserAuthorization: true, actorId: 'student-1', auditRequestId: 'audit-1' }),
    }));
    expect(response.status).toBe(403);
    const payload = await response.json() as { accepted: boolean; decision: { code: string }; safety: { enabled: boolean; message: string } };
    expect(payload.accepted).toBe(false);
    expect(payload.decision.code).toBe('DISABLED_BY_DEFAULT');
    expect(payload.safety.enabled).toBe(false);
    expect(payload.safety.message).toContain('No mount, camera, dome, or weather command');
  });

  test('stateless MCP initialize uses JSON transport and exposes the Observatory server identity', async () => {
    const response = await mcpPost(request('/api/observatory/mcp', {
      method: 'POST',
      headers: { accept: 'application/json, text/event-stream', 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'qualification-test', version: '1.0.0' },
        },
      }),
    }));
    expect(response.status).toBe(200);
    const payload = await response.json() as { result: { protocolVersion: string; serverInfo: { name: string } } };
    expect(payload.result.protocolVersion).toBe('2025-06-18');
    expect(payload.result.serverInfo.name).toBe('cosmictantra-observatory');
  });

  test('MCP CORS preflight does not create a session', async () => {
    const response = await mcpOptions(request('/api/observatory/mcp', { method: 'OPTIONS', headers: { origin: 'https://example.test' } }));
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    expect(response.headers.get('mcp-session-id')).toBeNull();
  });
});
