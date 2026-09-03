/**
 * COSMICTANTRA NAVIGATION MODEL — single source of truth for the five
 * primary destinations, their children, and the mobile bottom bar.
 *
 * Invariants (enforced by `scripts/validate-navigation.ts`, which the
 * navigation-hardening Playwright suite runs):
 *
 *   CT_UX_INV_001 — NO PRIMARY OR SECONDARY NAVIGATION ITEM MAY LINK TO A
 *                   ROUTE THAT DOES NOT RESOLVE.
 *
 *   The model below is PURE DATA: it carries no JSX, no React, no astrology
 *   logic. The layout components render it; the validator imports it and
 *   checks every `href` against the real filesystem route inventory.
 *
 *   CT_UX_INV_002 — PRESENTATION COMPONENTS MAY NOT MANUFACTURE
 *                   ASTROLOGICAL FACTS. This module carries routes and copy
 *                   only. Astrological content belongs in
 *                   `src/lib/presentation/kundliOverviewAdapter.ts` and must
 *                   originate from engine structures.
 *
 * D10 / Ashtakavarga / Shadbala / Ephemeris deliberately have NO href here.
 * They are documented as non-clickable metadata in
 * `src/lib/navigation/navigationMetadata.ts`.
 */

export type PrimaryDestinationId = 'TODAY' | 'MY_KUNDLI' | 'ASK' | 'CONSULT' | 'EXPLORE';

export type NavIconKey =
  | 'sun'
  | 'compass'
  | 'sparkles'
  | 'user'
  | 'flame'
  | 'calendar'
  | 'library'
  | 'map'
  | 'rings'
  | 'clock'
  | 'temple'
  | 'observatory'
  | 'scroll'
  | 'gem'
  | 'layers'
  | 'file'
  | 'profile'
  | 'moon'
  | 'languages'
  | 'question'
  | 'users';

export interface NavigationChildLink {
  id: string;
  /** Translation key inside the `navigation` dictionary (section, key). */
  labelKey: string;
  labelHiKey: string;
  descriptionKey: string;
  href: string;
  icon: NavIconKey;
  /** Presentational badge; never a promise about capabilities. */
  badge?: { key: string };
}

export interface PrimaryDestination {
  id: PrimaryDestinationId;
  labelKey: string;
  labelHiKey: string;
  descriptionKey: string;
  descriptionHiKey: string;
  href: string | null;
  icon: NavIconKey;
  /**
   * `true` when this destination is a menu (EXPLORE). A menu destination must
   * NOT silently navigate; it toggles disclosure of `children`.
   */
  isMenu: boolean;
  /**
   * Children shown inside the destination's disclosure. Consumed by both the
   * desktop primary bar and the mobile bottom-navigation sheet.
   */
  children: NavigationChildLink[];
}

export interface MobileNavItem {
  id: PrimaryDestinationId;
  labelKey: string;
  labelHiKey: string;
  href: string | null;
  icon: NavIconKey;
  /** ASK is rendered centre-stage on mobile. */
  isAsk: boolean;
}

/* ------------------------------------------------------------------ */
/* The five primary destinations                                       */
/* ------------------------------------------------------------------ */

export const PRIMARY_DESTINATIONS: PrimaryDestination[] = [
  {
    id: 'TODAY',
    labelKey: 'today',
    labelHiKey: 'todayHi',
    descriptionKey: 'todayDescription',
    descriptionHiKey: 'todayDescriptionHi',
    href: '/daily',
    icon: 'sun',
    isMenu: false,
    children: [
      {
        id: 'observatory',
        labelKey: 'observatory',
        labelHiKey: 'observatoryHi',
        descriptionKey: 'observatoryDescription',
        href: '/observatory',
        icon: 'observatory',
      },
      {
        id: 'familyPanchang',
        labelKey: 'familyPanchang',
        labelHiKey: 'familyPanchangHi',
        descriptionKey: 'familyPanchangDescription',
        href: '/family-panchang',
        icon: 'users',
      },
    ],
  },
  {
    id: 'MY_KUNDLI',
    labelKey: 'myKundli',
    labelHiKey: 'myKundliHi',
    descriptionKey: 'myKundliDescription',
    descriptionHiKey: 'myKundliDescriptionHi',
    href: '/report',
    icon: 'compass',
    isMenu: false,
    children: [
      {
        id: 'masterKundliReport',
        labelKey: 'masterKundliReport',
        labelHiKey: 'masterKundliReportHi',
        descriptionKey: 'masterKundliReportDescription',
        href: '/report',
        icon: 'file',
      },
      {
        id: 'cosmicId',
        labelKey: 'cosmicId',
        labelHiKey: 'cosmicIdHi',
        descriptionKey: 'cosmicIdDescription',
        href: '/profile',
        icon: 'profile',
      },
    ],
  },
  {
    id: 'ASK',
    labelKey: 'ask',
    labelHiKey: 'askHi',
    descriptionKey: 'askDescription',
    descriptionHiKey: 'askDescriptionHi',
    href: '/ask',
    icon: 'sparkles',
    isMenu: false,
    children: [],
  },
  {
    id: 'CONSULT',
    labelKey: 'consult',
    labelHiKey: 'consultHi',
    descriptionKey: 'consultDescription',
    descriptionHiKey: 'consultDescriptionHi',
    href: '/astrology/practitioners',
    icon: 'user',
    isMenu: false,
    children: [
      {
        id: 'writtenConsultation',
        labelKey: 'writtenConsultation',
        labelHiKey: 'writtenConsultationHi',
        descriptionKey: 'writtenConsultationDescription',
        href: '/ask',
        icon: 'scroll',
      },
    ],
  },
  {
    id: 'EXPLORE',
    labelKey: 'explore',
    labelHiKey: 'exploreHi',
    descriptionKey: 'exploreDescription',
    descriptionHiKey: 'exploreDescriptionHi',
    href: null,
    icon: 'flame',
    isMenu: true,
    children: [
      {
        id: 'darshanPuja',
        labelKey: 'darshanPuja',
        labelHiKey: 'darshanPujaHi',
        descriptionKey: 'darshanPujaDescription',
        href: '/darshan',
        icon: 'temple',
      },
      {
        id: 'vedicCalendar',
        labelKey: 'vedicCalendar',
        labelHiKey: 'vedicCalendarHi',
        descriptionKey: 'vedicCalendarDescription',
        href: '/calendar',
        icon: 'calendar',
      },
      {
        id: 'kundliMilan',
        labelKey: 'kundliMilan',
        labelHiKey: 'kundliMilanHi',
        descriptionKey: 'kundliMilanDescription',
        href: '/kundali-milan',
        icon: 'rings',
      },
      {
        id: 'personalMuhurat',
        labelKey: 'personalMuhurat',
        labelHiKey: 'personalMuhuratHi',
        descriptionKey: 'personalMuhuratDescription',
        href: '/muhurat/personalized',
        icon: 'clock',
      },
      {
        id: 'vedicLibrary',
        labelKey: 'vedicLibrary',
        labelHiKey: 'vedicLibraryHi',
        descriptionKey: 'vedicLibraryDescription',
        href: '/library',
        icon: 'library',
      },
      {
        id: 'aartiStotra',
        labelKey: 'aartiStotra',
        labelHiKey: 'aartiStotraHi',
        descriptionKey: 'aartiStotraDescription',
        href: '/aarti-stotra',
        icon: 'scroll',
      },
      {
        id: 'upayaStudio',
        labelKey: 'upayaStudio',
        labelHiKey: 'upayaStudioHi',
        descriptionKey: 'upayaStudioDescription',
        href: '/upaya',
        icon: 'gem',
      },
      {
        id: 'remedyTracker',
        labelKey: 'remedyTracker',
        labelHiKey: 'remedyTrackerHi',
        descriptionKey: 'remedyTrackerDescription',
        href: '/remedy-tracker',
        icon: 'moon',
      },
    ],
  },
];

/** Preserve `users` type-safety by aliasing (lucide icon map lives in UI). */
export const MOBILE_BOTTOM_NAV_ITEMS: MobileNavItem[] = [
  {
    id: 'TODAY',
    labelKey: 'todayMobile',
    labelHiKey: 'todayMobileHi',
    href: '/daily',
    icon: 'sun',
    isAsk: false,
  },
  {
    id: 'MY_KUNDLI',
    labelKey: 'kundliMobile',
    labelHiKey: 'kundliMobileHi',
    href: '/report',
    icon: 'compass',
    isAsk: false,
  },
  {
    id: 'ASK',
    labelKey: 'askMobile',
    labelHiKey: 'askMobileHi',
    href: '/ask',
    icon: 'sparkles',
    isAsk: true,
  },
  {
    id: 'CONSULT',
    labelKey: 'consultMobile',
    labelHiKey: 'consultMobileHi',
    href: '/astrology/practitioners',
    icon: 'user',
    isAsk: false,
  },
  {
    id: 'EXPLORE',
    labelKey: 'exploreMobile',
    labelHiKey: 'exploreMobileHi',
    href: null,
    icon: 'flame',
    isAsk: false,
  },
];

/* ------------------------------------------------------------------ */
/* Active-destination resolution                                       */
/* ------------------------------------------------------------------ */

/** Path prefixes that identify each destination, in priority order. */
const DESTINATION_PATH_PREFIXES: { id: PrimaryDestinationId; prefixes: string[] }[] = [
  { id: 'ASK', prefixes: ['/ask'] },
  { id: 'CONSULT', prefixes: ['/astrology', '/consultation', '/pandit'] },
  { id: 'MY_KUNDLI', prefixes: ['/dashboard', '/kundli', '/kundali-milan', '/report', '/milan', '/profile', '/family'] },
  { id: 'TODAY', prefixes: ['/daily', '/panchang', '/calendar', '/my-calendar', '/festivals', '/morning-digest', '/sandhya'] },
  { id: 'EXPLORE', prefixes: ['/darshan', '/aarti-stotra', '/upaya', '/remedy-tracker', '/store', '/library', '/muhurat', '/numerology', '/artifacts'] },
];

/** Which destination owns the given pathname (null on unknown routes). */
export function resolvePrimaryDestination(pathname: string): PrimaryDestinationId | null {
  const path = (pathname || '/').toLowerCase();
  if (path === '/' || path === '') return 'TODAY';
  for (const entry of DESTINATION_PATH_PREFIXES) {
    if (entry.prefixes.some((p) => path === p || path.startsWith(`${p}/`))) {
      return entry.id;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Link enumeration (used by layout components AND by the validator)   */
/* ------------------------------------------------------------------ */

export interface NavigationLinkRecord {
  source: string;
  href: string;
  /** True when the link only exists inside the mobile bottom bar. */
  mobileOnly?: boolean;
}

/**
 * Every navigable href the new navigation can emit. The validator checks
 * each one against the filesystem route inventory (CT_UX_INV_001).
 */
export function getAllNavigationHrefs(): NavigationLinkRecord[] {
  const links: NavigationLinkRecord[] = [];
  for (const dest of PRIMARY_DESTINATIONS) {
    if (dest.href) links.push({ source: `primary:${dest.id}`, href: dest.href });
    for (const child of dest.children) {
      links.push({ source: `primary:${dest.id}:child:${child.id}`, href: child.href });
    }
  }
  for (const item of MOBILE_BOTTOM_NAV_ITEMS) {
    if (item.href) links.push({ source: `mobile:${item.id}`, href: item.href, mobileOnly: true });
  }
  return links;
}

/**
 * Forbidden dead targets from the previous sprint. They must never appear as
 * hrefs anywhere in consumer navigation (see `scripts/validate-navigation.ts`).
 */
export const REMOVED_DEAD_ROUTES = [
  '/kundli/d10',
  '/kundli/ashtakavarga',
  '/kundli/shadbala',
  '/kundli/ephemeris',
] as const;
