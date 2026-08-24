import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://cosmictantra.chiti.tech';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/astrology/', '/pandit/'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Applebot', 'Google-Extended'],
        allow: '/',
        disallow: ['/api/', '/admin/', '/astrology/', '/pandit/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
