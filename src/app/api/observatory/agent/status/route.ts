import { NextRequest, NextResponse } from 'next/server';
import { fetchObservatoryAgentStatus } from '@/lib/observatory/agent';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Read-only server-side bridge status. No browser LAN discovery or device command is performed. */
export async function GET(_request: NextRequest) {
  const status = await fetchObservatoryAgentStatus();
  // Keep an internal/LAN agent URL on the server. The browser receives only a
  // capability/status result and cannot use this route as a LAN discovery API.
  const browserStatus = { ...status, endpoint: status.configured ? 'server-side agent' : null };
  return NextResponse.json({
    schemaVersion: 1,
    status: browserStatus,
    control: {
      browserDirectDeviceAccess: false,
      mountMovement: 'disabled-by-default',
      cameraExposure: 'disabled-by-default',
      domeControl: 'disabled-by-default',
      weatherOverride: 'disabled-by-default',
    },
  }, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
