import type { LiveTarget } from './types';

export type ObservatoryAction = 'mount.slew' | 'camera.exposure' | 'dome.open' | 'weather.override';

export interface ObservatorySafetyPolicy {
  mountControlEnabled: boolean;
  exposureRequestsEnabled: boolean;
  domeControlEnabled: boolean;
  weatherOverrideEnabled: boolean;
  requireExplicitUserAuthorization: true;
  requireAuthenticatedActor: true;
  requireAuditLog: true;
}

export const DEFAULT_OBSERVATORY_SAFETY_POLICY: ObservatorySafetyPolicy = {
  mountControlEnabled: false,
  exposureRequestsEnabled: false,
  domeControlEnabled: false,
  weatherOverrideEnabled: false,
  requireExplicitUserAuthorization: true,
  requireAuthenticatedActor: true,
  requireAuditLog: true,
};

export interface ObservationActionRequest {
  action: ObservatoryAction;
  target: LiveTarget;
  actorId?: string;
  explicitUserAuthorization?: boolean;
  auditRequestId?: string;
}

export interface ObservationActionDecision {
  allowed: boolean;
  code: 'DISABLED_BY_DEFAULT' | 'AUTHORIZATION_REQUIRED' | 'AUDIT_ID_REQUIRED' | 'ALLOWED';
  reason: string;
}

function actionEnabled(policy: ObservatorySafetyPolicy, action: ObservatoryAction): boolean {
  if (action === 'mount.slew') return policy.mountControlEnabled;
  if (action === 'camera.exposure') return policy.exposureRequestsEnabled;
  if (action === 'dome.open') return policy.domeControlEnabled;
  return policy.weatherOverrideEnabled;
}

export function evaluateObservationAction(
  policy: ObservatorySafetyPolicy,
  request: ObservationActionRequest,
): ObservationActionDecision {
  if (!actionEnabled(policy, request.action)) {
    return { allowed: false, code: 'DISABLED_BY_DEFAULT', reason: `${request.action} is disabled by the Observatory safety policy.` };
  }
  if (!request.actorId || !request.explicitUserAuthorization) {
    return { allowed: false, code: 'AUTHORIZATION_REQUIRED', reason: 'An authenticated actor and explicit per-action user authorization are required.' };
  }
  if (!request.auditRequestId) {
    return { allowed: false, code: 'AUDIT_ID_REQUIRED', reason: 'A durable audit request id is required before a hardware action can be dispatched.' };
  }
  return { allowed: true, code: 'ALLOWED', reason: 'Policy checks passed; a provider adapter must still perform its own safety/interlock checks.' };
}

export function safetyPolicySummary(policy: ObservatorySafetyPolicy = DEFAULT_OBSERVATORY_SAFETY_POLICY): string[] {
  return [
    `Mount movement: ${policy.mountControlEnabled ? 'enabled by deployment policy' : 'disabled by default'}.`,
    `Camera exposure requests: ${policy.exposureRequestsEnabled ? 'enabled by deployment policy' : 'disabled by default'}.`,
    `Dome control: ${policy.domeControlEnabled ? 'enabled by deployment policy' : 'disabled by default'}.`,
    `Weather overrides: ${policy.weatherOverrideEnabled ? 'enabled by deployment policy' : 'disabled by default'}.`,
    'Every hardware action requires explicit user authorization, an authenticated actor, and an audit record.',
  ];
}
