import { NextRequest, NextResponse } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createObservatoryMcpServer } from '@/lib/observatory/mcpServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function corsHeaders(request: Request): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID',
    'Access-Control-Expose-Headers': 'MCP-Session-Id, MCP-Protocol-Version, Content-Type',
    Vary: 'Origin',
  });
  const origin = request.headers.get('origin');
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  return headers;
}

function unauthorized(request: Request): boolean {
  const expected = process.env.OBSERVATORY_MCP_BEARER_TOKEN;
  if (!expected) return false;
  return request.headers.get('authorization') !== `Bearer ${expected}`;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: NextRequest) {
  if (unauthorized(request)) {
    return NextResponse.json({ error: 'MCP authentication required.' }, { status: 401, headers: { ...Object.fromEntries(corsHeaders(request).entries()), 'WWW-Authenticate': 'Bearer' } });
  }

  try {
    const server = createObservatoryMcpServer({ publicBaseUrl: new URL(request.url).origin });
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    const headers = corsHeaders(request);
    response.headers.forEach((value, key) => headers.set(key, value));
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'MCP request failed.' }, { status: 500, headers: corsHeaders(request) });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'This stateless MCP endpoint accepts POST JSON-RPC messages only.' }, { status: 405, headers: { ...Object.fromEntries(corsHeaders(request).entries()), Allow: 'POST, OPTIONS', 'Cache-Control': 'no-store' } });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ error: 'This stateless MCP endpoint does not maintain sessions.' }, { status: 405, headers: { ...Object.fromEntries(corsHeaders(request).entries()), Allow: 'POST, OPTIONS', 'Cache-Control': 'no-store' } });
}
