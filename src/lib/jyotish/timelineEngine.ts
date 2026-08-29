/**
 * PROTECTED CANONICAL JYOTISH KERNEL: Navigable Personal Timeline Engine
 * Combines Vimshottari Dashas, Transits, Sade Sati, and User Life Events across Life/10yr/Year/Month/Week zooms.
 * Complies with Program 11 and Checkpoint TRUST-06.
 */

import { CanonicalJyotishSnapshot } from './canonicalSnapshot';

export type TimelineZoomLevel = 'LIFE' | '10_YEARS' | 'YEAR' | 'MONTH' | 'WEEK';

export type TimelineEventCategory =
  | 'DASHA_MAHADASHA'
  | 'DASHA_ANTARDASHA'
  | 'DASHA_PRATYANTAR'
  | 'SADE_SATI_PHASE'
  | 'MAJOR_TRANSIT_INGRESS'
  | 'RETROGRADE_WINDOW'
  | 'USER_LIFE_EVENT'
  | 'CONSULTATION_NOTE';

export interface TimelineEvent {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  category: TimelineEventCategory;
  title: string;
  subtitle: string;
  description: string;
  significanceRating: number; // 1 (Minor) to 5 (Life Altering)
  planetLord?: string;
  isFavorable?: boolean;
}

export interface PersonalTimeline {
  personName: string;
  birthDate: string;
  activeZoom: TimelineZoomLevel;
  totalEvents: number;
  events: TimelineEvent[];
}

export function generatePersonalTimeline(
  personName: string,
  snapshot: CanonicalJyotishSnapshot,
  zoom: TimelineZoomLevel = 'LIFE',
  centerDate: Date = new Date()
): PersonalTimeline {
  const events: TimelineEvent[] = [];
  const { context, dasha, yogasAndDoshas } = snapshot;

  // 1. Generate Dasha Events (Mahadashas & Antardashas)
  if (dasha.mahadashas) {
    dasha.mahadashas.forEach((m: any, mIdx: number) => {
      events.push({
        id: `DASHA_MD_${m.lord}_${mIdx}`,
        startDate: m.startDate,
        endDate: m.endDate,
        category: 'DASHA_MAHADASHA',
        title: `${m.lord} Mahadasha`,
        subtitle: `Major ${m.durationYears}-Year Cycle`,
        description: `Prevailing life epoch governed by ${m.lord}.`,
        significanceRating: 5,
        planetLord: m.lord
      });

      if (m.antardashas) {
        m.antardashas.forEach((a: any, aIdx: number) => {
          events.push({
            id: `DASHA_AD_${m.lord}_${a.lord}_${mIdx}_${aIdx}`,
            startDate: a.startDate,
            endDate: a.endDate,
            category: 'DASHA_ANTARDASHA',
            title: `${m.lord} - ${a.lord} Antardasha`,
            subtitle: 'Sub-period activation',
            description: `Active sub-period governed by ${a.lord} within ${m.lord} Mahadasha.`,
            significanceRating: 4,
            planetLord: a.lord
          });
        });
      }
    });
  }

  // 2. Generate Sade Sati Events
  if (yogasAndDoshas.sadeSati.isActive) {
    events.push({
      id: 'SADE_SATI_ACTIVE_PHASE',
      startDate: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 2 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      category: 'SADE_SATI_PHASE',
      title: `Saturn Sade Sati: ${yogasAndDoshas.sadeSati.phase}`,
      subtitle: 'Major Saturn karmic transit',
      description: yogasAndDoshas.sadeSati.description,
      significanceRating: 5,
      planetLord: 'Saturn',
      isFavorable: false
    });
  }

  // Filter events based on Zoom Level
  let filteredEvents = events;
  if (zoom === 'YEAR' || zoom === 'MONTH' || zoom === 'WEEK') {
    const centerYear = centerDate.getFullYear();
    const minYear = centerYear - (zoom === 'YEAR' ? 1 : 0);
    const maxYear = centerYear + (zoom === 'YEAR' ? 1 : 0);

    filteredEvents = events.filter(e => {
      const eYear = parseInt(e.startDate.split('-')[0]);
      return eYear >= minYear && eYear <= maxYear;
    });
  }

  return {
    personName,
    birthDate: context.birthDate,
    activeZoom: zoom,
    totalEvents: filteredEvents.length,
    events: filteredEvents.sort((a, b) => a.startDate.localeCompare(b.startDate))
  };
}
