/**
 * KASHI SAHAYAK CONTEXT CONTRACT (Sprint B.1 §8).
 *
 * Navigation can tell Kashi Sahayak which destination the user is in. This
 * module ONLY defines the contract: a deterministic pathname→domain mapping
 * plus the canonical location. No AI behaviour is added here.
 *
 * Suggested prompts are delivered as translation keys
 * (`context` section of `src/lib/translations.js`) so consumer UI can render
 * them in the active language. The assistant itself is untouched.
 */

import type { ActiveLocation, LocationTruthSource } from '@/lib/location/activeLocation';

export type KashiContextDomain =
  | 'TODAY'
  | 'KUNDLI_OVERVIEW'
  | 'DASHA'
  | 'MATCHING'
  | 'MUHURAT'
  | 'DARSHAN'
  | 'PUJA'
  | 'ASK'
  | 'CONSULT'
  | 'EXPLORE'
  | 'UNKNOWN';

export interface KashiContextPrompt {
  id: string;
  /** Key into the `context` translation section. */
  i18nKey: string;
}

export interface KashiContext {
  domain: KashiContextDomain;
  pathname: string;
  location: ActiveLocation;
  /** Promise-free availability: the UI decides whether to surface prompts. */
  suggestionsEnabled: boolean;
  suggestedPrompts: KashiContextPrompt[];
  source: 'NAVIGATION';
  /** Version the consuming assistant can gate on. */
  contractVersion: 'kashi-context-v1';
}

const DOMAIN_PREFIXES: { domain: KashiContextDomain; prefixes: string[] }[] = [
  { domain: 'ASK', prefixes: ['/ask'] },
  { domain: 'CONSULT', prefixes: ['/astrology', '/consultation', '/admin', '/pandit'] },
  { domain: 'DASHA', prefixes: ['/dasha'] },
  { domain: 'MATCHING', prefixes: ['/kundali-milan', '/milan'] },
  { domain: 'MUHURAT', prefixes: ['/muhurat'] },
  { domain: 'DARSHAN', prefixes: ['/darshan'] },
  { domain: 'PUJA', prefixes: ['/upaya', '/remedy-tracker', '/aarti-stotra', '/store', '/shop'] },
  { domain: 'KUNDLI_OVERVIEW', prefixes: ['/dashboard', '/kundli', '/report', '/profile', '/family', '/onboarding'] },
  { domain: 'TODAY', prefixes: ['/daily', '/panchang', '/calendar', '/my-calendar', '/festivals', '/morning-digest', '/sandhya', '/'] },
  { domain: 'EXPLORE', prefixes: ['/library', '/numerology', '/artifacts'] },
];

const DOMAIN_PROMPTS: Record<KashiContextDomain, KashiContextPrompt[]> = {
  TODAY: [{ id: 'today', i18nKey: 'today' }],
  KUNDLI_OVERVIEW: [{ id: 'kundliOverview', i18nKey: 'kundliOverview' }],
  DASHA: [{ id: 'dasha', i18nKey: 'dasha' }],
  MATCHING: [{ id: 'matching', i18nKey: 'matching' }],
  MUHURAT: [{ id: 'muhurat', i18nKey: 'muhurat' }],
  DARSHAN: [{ id: 'darshan', i18nKey: 'darshan' }],
  PUJA: [{ id: 'puja', i18nKey: 'puja' }],
  ASK: [{ id: 'ask', i18nKey: 'ask' }],
  CONSULT: [{ id: 'consult', i18nKey: 'consult' }],
  EXPLORE: [{ id: 'explore', i18nKey: 'explore' }],
  UNKNOWN: [{ id: 'unknown', i18nKey: 'unknown' }],
};

/**
 * Deterministic, dependency-free pathname→context mapping.
 * `explicitDomain` lets a page (e.g. a Dasha anchor) override later without
 * changing the contract.
 */
export function resolveKashiContext(
  pathname: string,
  location: ActiveLocation,
  explicitDomain?: KashiContextDomain,
): KashiContext {
  const path = (pathname || '/').toLowerCase();
  const domain: KashiContextDomain =
    explicitDomain ??
    DOMAIN_PREFIXES.find((entry) =>
      entry.prefixes.some((p) => path === p || (p !== '/' && path.startsWith(`${p}/`)) || (p === '/' && path === '/')),
    )?.domain ??
    'UNKNOWN';

  return {
    domain,
    pathname,
    location,
    suggestionsEnabled: domain !== 'UNKNOWN',
    suggestedPrompts: DOMAIN_PROMPTS[domain],
    source: 'NAVIGATION',
    contractVersion: 'kashi-context-v1',
  };
}

export type KashiContextLocationKind = 'PROFILE' | 'ACTIVE_CITY' | 'GPS' | 'PERSISTED' | 'NONE';

export function kashiContextLocationSummary(location: ActiveLocation): {
  source: LocationTruthSource;
  name: string | null;
} {
  return {
    source: location.source,
    name: location.status === 'KNOWN' ? location.name : null,
  };
}
