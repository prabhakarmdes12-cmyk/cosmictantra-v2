export type ShellMode = 'public' | 'scholar' | 'presentation' | 'minimal';
export type FooterMode = 'full' | 'minimal' | 'none';
export type RouteStatus = 'LIVE' | 'BETA' | 'PRACTITIONER_ASSISTED' | 'COMING_SOON';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface RouteConfig {
  path: string;
  title: string;
  description: string;
  category: 'Observatory' | 'Guidance' | 'Tools' | 'Library' | 'Scholar' | 'Account' | 'System';
  breadcrumbs: BreadcrumbItem[];
  shellMode: ShellMode;
  footerMode: FooterMode;
  indexable: boolean;
  authRequired: boolean;
  status: RouteStatus;
  roomCharacter: 'observatory' | 'manuscript' | 'instrument' | 'desk' | 'document' | 'sanctuary' | 'presentation';
}

export const ROUTE_REGISTRY: Record<string, RouteConfig> = {
  '/': {
    path: '/',
    title: 'CosmicTantra — Living Vedic Astronomical Observatory',
    description: 'Classical Jyotish ephemeris, location-aware Vedic diurnal time, and verified scholarly written counsel.',
    category: 'Observatory',
    breadcrumbs: [],
    shellMode: 'public',
    footerMode: 'full',
    indexable: true,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'observatory'
  },
  '/daily': {
    path: '/daily',
    title: 'Daily Vedic Weather & Forecast | CosmicTantra',
    description: 'Location-aware daily Panchang weather, auspicious timing score, and shareable 9:16 WhatsApp cards.',
    category: 'Observatory',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Observatory', href: '/' },
      { label: 'Daily Forecast', href: '/daily' }
    ],
    shellMode: 'public',
    footerMode: 'full',
    indexable: true,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'observatory'
  },
  '/numerology/name': {
    path: '/numerology/name',
    title: 'Chaldean Name Numerology Studio | CosmicTantra',
    description: 'Analyze name sound vibration, compound numbers, and destiny alignment using classical Chaldean numerology.',
    category: 'Tools',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Tools', href: '/numerology/name' },
      { label: 'Name Numerology', href: '/numerology/name' }
    ],
    shellMode: 'public',
    footerMode: 'full',
    indexable: true,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'instrument'
  },
  '/aarti-stotra': {
    path: '/aarti-stotra',
    title: 'Aarti & Stotra Sacred Sanskrit Library (50 Texts) | CosmicTantra',
    description: 'Classical Vedic Aartis, Stotras, and Suktas in authentic Devanagari Sanskrit with phonetics and translations.',
    category: 'Library',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Library', href: '/aarti-stotra' },
      { label: 'Aarti & Stotra', href: '/aarti-stotra' }
    ],
    shellMode: 'public',
    footerMode: 'full',
    indexable: true,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'manuscript'
  },
  '/upaya': {
    path: '/upaya',
    title: 'Vedic Upaya & Planetary Remedy Studio | CosmicTantra',
    description: 'Classical planetary remedies, mantra japa sadhana, and verified partner network directory.',
    category: 'Guidance',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Remedies', href: '/upaya' },
      { label: 'Planetary Upaya', href: '/upaya' }
    ],
    shellMode: 'public',
    footerMode: 'full',
    indexable: true,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'manuscript'
  },
  '/remedy-tracker': {
    path: '/remedy-tracker',
    title: 'Daily Upaya & 108-Bead Japa Tracker | CosmicTantra',
    description: 'Track 40-day Sankalpa observances, daily mantra japa streaks, and remedy compliance.',
    category: 'Tools',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Tools', href: '/remedy-tracker' },
      { label: 'Remedy Tracker', href: '/remedy-tracker' }
    ],
    shellMode: 'public',
    footerMode: 'full',
    indexable: true,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'instrument'
  },
  '/family-panchang': {
    path: '/family-panchang',
    title: 'Parivaar Family Panchang & Transits | CosmicTantra',
    description: 'Shared family horoscope, favorable diurnal hours, and auspicious muhurat windows for all members.',
    category: 'Observatory',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Parivaar', href: '/family-panchang' },
      { label: 'Family Panchang', href: '/family-panchang' }
    ],
    shellMode: 'public',
    footerMode: 'full',
    indexable: true,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'observatory'
  },
  '/kundali-milan': {
    path: '/kundali-milan',
    title: 'Ashta-Koota 36-Point Kundali Milan | CosmicTantra',
    description: 'Classical 36-guna Vedic marital compatibility, Mangal Dosha analysis, and planetary harmony evaluation.',
    category: 'Tools',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Tools', href: '/kundali-milan' },
      { label: 'Kundali Milan', href: '/kundali-milan' }
    ],
    shellMode: 'public',
    footerMode: 'full',
    indexable: true,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'instrument'
  },
  '/ask': {
    path: '/ask',
    title: 'Request Scholarly Written Consultation (Fixed ₹501) | CosmicTantra',
    description: 'One focused life question, sub-arcminute ephemeris generation, and verified 24h written folio PDF counsel.',
    category: 'Guidance',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Guidance', href: '/ask' },
      { label: 'Ask One Question', href: '/ask' }
    ],
    shellMode: 'public',
    footerMode: 'full',
    indexable: true,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'document'
  },
  '/report': {
    path: '/report',
    title: 'Vedic Decision Synthesis Written Folio | CosmicTantra',
    description: 'Official archival-grade 4-page written consultation folio PDF with North Indian chart and scholar review.',
    category: 'Guidance',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Guidance', href: '/ask' },
      { label: 'Written Folio', href: '/report' }
    ],
    shellMode: 'public',
    footerMode: 'full',
    indexable: false,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'document'
  },
  '/profile': {
    path: '/profile',
    title: 'Cosmic ID & Account Security | CosmicTantra',
    description: 'Secure consent-based identity managing your Janma Kundalis, family profiles, and consultation folios.',
    category: 'Account',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Account', href: '/profile' },
      { label: 'Cosmic ID', href: '/profile' }
    ],
    shellMode: 'minimal',
    footerMode: 'minimal',
    indexable: false,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'instrument'
  },
  '/dashboard': {
    path: '/dashboard',
    title: 'Scholar Desk & Parivaar Hub | CosmicTantra',
    description: 'Manage family profiles, past consultation folios, and active orders under one unified desk.',
    category: 'Account',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Scholar Desk', href: '/dashboard' }
    ],
    shellMode: 'public',
    footerMode: 'full',
    indexable: false,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'desk'
  },
  '/presentation': {
    path: '/presentation',
    title: 'CosmicTantra for Pandit Ji — Institutional Presentation',
    description: 'Introduction to the Kashi Vidwat Parishad digital ephemeris platform for traditional Vedic scholars.',
    category: 'Scholar',
    breadcrumbs: [],
    shellMode: 'presentation',
    footerMode: 'none',
    indexable: false,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'presentation'
  },
  '/pandit/workspace': {
    path: '/pandit/workspace',
    title: 'Pandit Verification Workbench | CosmicTantra',
    description: 'Verified scholar portal for reviewing incoming cases, editing synthesis, and approving written folios.',
    category: 'Scholar',
    breadcrumbs: [],
    shellMode: 'scholar',
    footerMode: 'none',
    indexable: false,
    authRequired: true,
    status: 'PRACTITIONER_ASSISTED',
    roomCharacter: 'desk'
  },
  '/calendar': {
    path: '/calendar',
    title: 'Monthly Vedic Panchang & Personal Energy Calendar | CosmicTantra',
    description: 'Full-month Vedic calendar with daily Tithi, Nakshatra, Shubh Muhurats, and personal Power & Caution days based on Tara Bala.',
    category: 'Observatory',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Observatory', href: '/' },
      { label: 'Monthly Calendar', href: '/calendar' }
    ],
    shellMode: 'public',
    footerMode: 'full',
    indexable: true,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'observatory'
  },
  '/my-calendar': {
    path: '/my-calendar',
    title: 'My Vedic Calendar — Daily Panchang & Muhurat Alerts',
    description: 'Personalized Vedic calendar with Power & Caution days, Shubh Muhurats, and festivals.',
    category: 'Observatory',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Observatory', href: '/' },
      { label: 'Monthly Calendar', href: '/calendar' }
    ],
    shellMode: 'public',
    footerMode: 'full',
    indexable: true,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'observatory'
  }
};

export function getRouteConfig(pathname: string): RouteConfig {
  if (ROUTE_REGISTRY[pathname]) {
    return ROUTE_REGISTRY[pathname];
  }
  
  // Dynamic route pattern matching
  if (pathname.startsWith('/panchang/')) {
    const city = pathname.replace('/panchang/', '');
    return {
      path: pathname,
      title: `${city.charAt(0).toUpperCase() + city.slice(1)} Panchang Today | CosmicTantra`,
      description: `Location-specific Vedic ephemeris, tithi, nakshatra, and rahu kaal timings for ${city}.`,
      category: 'Observatory',
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Panchang', href: '/' },
        { label: city.toUpperCase(), href: pathname }
      ],
      shellMode: 'public',
      footerMode: 'full',
      indexable: true,
      authRequired: false,
      status: 'LIVE',
      roomCharacter: 'observatory'
    };
  }

  if (pathname.startsWith('/festivals/')) {
    const slug = pathname.replace('/festivals/', '');
    return {
      path: pathname,
      title: `${slug.replace('-', ' ').toUpperCase()} Tithi & Muhurat | CosmicTantra`,
      description: `Astronomical timings, puja vidhi, and tithi calculation for ${slug}.`,
      category: 'Library',
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Festivals', href: '/' },
        { label: slug.replace('-', ' '), href: pathname }
      ],
      shellMode: 'public',
      footerMode: 'full',
      indexable: true,
      authRequired: false,
      status: 'LIVE',
      roomCharacter: 'manuscript'
    };
  }

  // Default fallback
  return {
    path: pathname,
    title: 'CosmicTantra — Vedic Precision. Human Wisdom.',
    description: 'Classical Jyotish astronomical calculations and verified written counsel.',
    category: 'Observatory',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: pathname.replace('/', ''), href: pathname }
    ],
    shellMode: 'public',
    footerMode: 'full',
    indexable: true,
    authRequired: false,
    status: 'LIVE',
    roomCharacter: 'observatory'
  };
}
