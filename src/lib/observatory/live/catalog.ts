import { CANONICAL_BODY_NAMES, type CanonicalBodyName } from '@/lib/astronomy/canonicalBodies';
import { constellationDisplayName, constellationIds } from '@/lib/astronomy/celestialCatalog';
import { STARS } from '@/lib/astronomy/stars';
import type {
  LiveObservationResponse,
  LiveProviderCapability,
  LiveTarget,
  LiveTargetKind,
  LocalSkyCalculationDescriptor,
} from './types';
import type { LiveObservationMode, LiveProviderId } from './types';

const PHYSICAL_BODIES = CANONICAL_BODY_NAMES.filter(body => body !== 'Rahu' && body !== 'Ketu');

const PROVIDER_CATALOG: readonly LiveProviderCapability[] = [
  {
    id: 'local-sky',
    label: 'CosmicTantra local calculation',
    modes: ['local-calculation'],
    targetKinds: ['planet', 'star', 'constellation', 'event'],
    availability: 'always-on',
    requiresAuthentication: false,
    configured: true,
    sourceUrl: 'workspace:src/lib/astronomy/',
    attribution: 'CosmicTantra Observatory source modules',
    license: 'Repository terms apply to the local calculation code.',
    limitations: ['Calculated display instrument only; not a camera frame.', 'The local ephemeris is intentionally low precision and the faint context field is illustrative.'],
  },
  {
    id: 'nasa-sdo',
    label: 'NASA Solar Dynamics Observatory',
    modes: ['near-real-time-public', 'archival-reference'],
    targetKinds: ['planet'],
    targetIds: ['Sun'],
    availability: 'public-feed',
    requiresAuthentication: false,
    configured: true,
    sourceUrl: 'https://sdo.gsfc.nasa.gov/data/dataaccess.php',
    attribution: 'NASA/SDO AIA data; served through the Observatory adapter.',
    license: 'NASA media/data use and SDO/Helioviewer attribution terms must be reviewed for the intended redistribution.',
    limitations: ['Sun only.', 'AIA 171 Å is extreme-ultraviolet mission imagery, not a visible-light view from the selected city.', 'Browse cadence and availability can vary during maneuvers or outages.'],
  },
  {
    id: 'helioviewer',
    label: 'Helioviewer solar image service',
    modes: ['near-real-time-public', 'archival-reference'],
    targetKinds: ['planet'],
    targetIds: ['Sun'],
    availability: 'public-feed',
    requiresAuthentication: false,
    configured: true,
    sourceUrl: 'https://api.helioviewer.org/docs/v2/',
    attribution: 'Helioviewer Project with NASA/SDO source imagery.',
    license: 'Provider and mission attribution, API terms, and redistribution limits must be checked before commercial mirroring.',
    limitations: ['Solar data only; it is not a targetable arbitrary-star or planet camera.', 'A returned frame is a provider image at its capture time, not the local sky projection at the requested zoom.'],
  },
  {
    id: 'las-cumbres-observatory',
    label: 'Las Cumbres Observatory',
    modes: ['remote-exposure', 'archival-reference'],
    targetKinds: ['planet', 'star', 'event'],
    targetIds: [...PHYSICAL_BODIES, ...STARS.map(star => star.id)],
    availability: 'requires-account',
    requiresAuthentication: true,
    configured: false,
    sourceUrl: 'https://lco.global/documentation/',
    attribution: 'Las Cumbres Observatory and the relevant observation program.',
    license: 'Account, proposal, archive, and data-use terms apply; do not mirror products without checking them.',
    limitations: ['Requests are scheduled exposures, not an instant arbitrary-target video feed.', 'Production integration needs credentials, quota, scheduling, status polling, and archive-policy review.'],
  },
  {
    id: 'microobservatory',
    label: 'NASA/Harvard MicroObservatory',
    modes: ['remote-exposure', 'archival-reference'],
    targetKinds: ['planet', 'star', 'event'],
    availability: 'requires-account',
    requiresAuthentication: false,
    configured: false,
    sourceUrl: 'https://mo-www.cfa.harvard.edu/OWN/astrophoto/index.html',
    attribution: 'NASA/Harvard MicroObservatory and its participating mission/education partners.',
    license: 'Education service terms and asset-specific reuse conditions must be verified.',
    limitations: ['Queued requests are captured during suitable observing windows and delivered later.', 'Not suitable for claiming a live view at the moment a user zooms.'],
  },
  {
    id: 'virtual-telescope',
    label: 'Virtual Telescope Project',
    modes: ['remote-exposure', 'camera-stream', 'archival-reference'],
    targetKinds: ['planet', 'star', 'event'],
    availability: 'session-or-link',
    requiresAuthentication: false,
    configured: false,
    sourceUrl: 'https://www.virtualtelescope.eu/webtv/',
    attribution: 'Virtual Telescope Project and the session photographer/operator.',
    license: 'Session recording, image, logo, and commercial-use terms require provider permission.',
    limitations: ['Availability is session/event driven; no assumed open arbitrary-target API.', 'A link or approved partner integration is safer than scraping or hotlinking a broadcast.'],
  },
  {
    id: 'ascom-alpaca',
    label: 'User-owned telescope via ASCOM Alpaca',
    modes: ['camera-stream', 'remote-exposure'],
    targetKinds: ['planet', 'star', 'event'],
    availability: 'local-gateway',
    requiresAuthentication: true,
    configured: false,
    sourceUrl: 'https://ascom-standards.org/Documentation/Index.htm',
    attribution: 'User-owned equipment and its camera/mount data sources.',
    license: 'User equipment, camera driver, and any embedded imagery retain their own rights.',
    limitations: ['Requires a trusted observatory agent; browser code must not discover or control arbitrary LAN devices.', 'Mount, camera, dome, weather, and safety actions are disabled until explicitly authorized and audited.'],
  },
  {
    id: 'indi',
    label: 'User-owned telescope via INDI gateway',
    modes: ['camera-stream', 'remote-exposure'],
    targetKinds: ['planet', 'star', 'event'],
    availability: 'local-gateway',
    requiresAuthentication: true,
    configured: false,
    sourceUrl: 'https://www.indigo-astronomy.org/faq.html',
    attribution: 'User-owned equipment and the configured INDI driver stack.',
    license: 'User equipment, driver, and captured-image rights remain with their respective owners.',
    limitations: ['Requires an authenticated server-side bridge or sidecar, commonly on a Raspberry Pi/Linux host.', 'INDI/Alpaca control is a control plane; image bytes should use HTTP/object storage/WebRTC as appropriate.'],
  },
];

function isCanonicalBody(value: string): value is CanonicalBodyName {
  return (CANONICAL_BODY_NAMES as readonly string[]).includes(value);
}

function canonicalBody(value: string): CanonicalBodyName | null {
  const trimmed = value.trim();
  return CANONICAL_BODY_NAMES.find(body => body.toLowerCase() === trimmed.toLowerCase()) || null;
}

function validEventId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/.test(value);
}

export function normalizeLiveTarget(kind: string | undefined, id: string | undefined): LiveTarget | null {
  if (!kind || !id) return null;
  const value = id.trim();
  if (!value || value.length > 100) return null;

  if (kind === 'planet') {
    const body = canonicalBody(value);
    if (!body) return null;
    return { kind: 'planet', id: body, label: body };
  }

  if (kind === 'star') {
    const star = STARS.find(item => item.id.toLowerCase() === value.toLowerCase() || item.name.toLowerCase() === value.toLowerCase());
    return star ? { kind: 'star', id: star.id, label: star.name } : null;
  }

  if (kind === 'constellation') {
    return constellationIds().includes(value) ? { kind: 'constellation', id: value, label: constellationDisplayName(value) } : null;
  }

  if (kind === 'event') {
    return validEventId(value) ? { kind: 'event', id: value, label: value } : null;
  }

  return null;
}

export function allLiveProviderCapabilities(): LiveProviderCapability[] {
  return PROVIDER_CATALOG.map(provider => ({ ...provider, modes: [...provider.modes], targetKinds: [...provider.targetKinds], targetIds: provider.targetIds ? [...provider.targetIds] : undefined, limitations: [...provider.limitations] }));
}

function providerMatchesTarget(provider: LiveProviderCapability, target: LiveTarget): boolean {
  if (!provider.targetKinds.includes(target.kind)) return false;
  if (!provider.targetIds || provider.targetIds.length === 0) return true;
  return provider.targetIds.includes(target.id);
}

export function providerSupportsTarget(providerId: LiveProviderId, target: LiveTarget): boolean {
  const provider = PROVIDER_CATALOG.find(item => item.id === providerId);
  return Boolean(provider && providerMatchesTarget(provider, target));
}

export function liveProviderCapabilitiesFor(target: LiveTarget): LiveProviderCapability[] {
  return allLiveProviderCapabilities().filter(provider => providerMatchesTarget(provider, target));
}

export function localSkyDescriptor(target: LiveTarget, requestedAtUtc: string): LocalSkyCalculationDescriptor {
  const sourcePath = target.kind === 'planet'
    ? 'src/lib/astronomy/canonicalBodies.ts'
    : target.kind === 'star'
      ? 'src/lib/astronomy/stars.ts'
      : 'src/lib/astronomy/projection.ts';
  return {
    schemaVersion: 1,
    provider: 'local-sky',
    label: 'Local calculated sky',
    mode: 'local-calculation',
    status: 'active',
    target,
    requestedAtUtc,
    sourcePath,
    note: 'This is the deterministic local stereographic instrument. Zoom changes display geometry only; it never turns the local calculation into a camera frame.',
  };
}

export function createLiveObservationResponse(target: LiveTarget, requestedAtUtc: string, frame: LiveObservationResponse['frame'] = null, notices: string[] = []): LiveObservationResponse {
  return {
    schemaVersion: 1,
    target,
    requestedAtUtc,
    localCalculation: localSkyDescriptor(target, requestedAtUtc),
    providers: liveProviderCapabilitiesFor(target),
    frame,
    notices,
  };
}

export function targetIsPhysicalBody(target: LiveTarget): boolean {
  return target.kind === 'planet' && isCanonicalBody(target.id) && target.id !== 'Rahu' && target.id !== 'Ketu';
}
