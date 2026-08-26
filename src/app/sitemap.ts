import { MetadataRoute } from 'next';
import { CITIES } from '@/lib/cities';
import { SIGNS } from '@/lib/rashifal';
import { LIBRARY } from '@/lib/libraryContent';
import { UPCOMING_EVENTS } from '@/lib/festivals';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cosmictantra.chiti.tech';
  const now = new Date().toISOString();

  // Public indexable routes only — NEVER include internal ops or practitioner dashboards
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/ask`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/library`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/darshan`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/family`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/my-calendar`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/kundali-milan`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/observatory`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/observatory/ecliptic`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/observatory/timemachine`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/observatory/gochara`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/numerology/name`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/numerology/business-name`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/numerology/mobile-number`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/numerology/baby-names`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ];

  const cityPages: MetadataRoute.Sitemap = CITIES.map(c => ({
    url: `${baseUrl}/panchang/${c.id}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const rashifalPages: MetadataRoute.Sitemap = SIGNS.map(s => ({
    url: `${baseUrl}/rashifal/${s.id}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const libraryPages: MetadataRoute.Sitemap = LIBRARY.map(a => ({
    url: `${baseUrl}/library/${a.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const festivalPages: MetadataRoute.Sitemap = UPCOMING_EVENTS.map(e => ({
    url: `${baseUrl}/festivals/${e.id}`,
    lastModified: now,
    changeFrequency: 'yearly',
    priority: 0.7,
  }));

  return [...staticPages, ...cityPages, ...rashifalPages, ...libraryPages, ...festivalPages];
}
