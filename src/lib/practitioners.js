/**
 * PRACTITIONER RECORDS & EDITORIAL EDUCATIONAL CONTENT
 * Institutional authenticity — No fabricated 5-star badges or fake consultation counters.
 */

export const PRACTITIONERS = [
  {
    id: 'pt-vidyadhar-shastri',
    name: 'Pt. Vidyadhar Shastri',
    title: 'Senior Vedic Astrologer & Karmakand Scholar',
    lineage: 'Banaras Hindu University (Varanasi Tradition)',
    yearsPractising: 28,
    languages: ['Hindi', 'Sanskrit', 'English'],
    specialisations: ['Dasha Transitions', 'Career & Enterprise Timing', 'Ancestral Remedies'],
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    philosophy: 'Astrology does not replace human initiative (Purushartha); it illuminates the terrain so one can act with clarity rather than fear.',
    featuredVideo: {
      title: 'What exactly is a Mahadasha?',
      duration: '4:15 min',
      description: 'Understanding how large planetary periods shape consciousness, relationships, and priorities.'
    }
  },
  {
    id: 'pt-raghavendra-joshi',
    name: 'Pt. Raghavendra Joshi',
    title: 'Parashari Jyotish & Muhurat Specialist',
    lineage: 'Ujjain Sandipani Ashram Sampradaya',
    yearsPractising: 22,
    languages: ['Hindi', 'Marathi', 'English', 'Gujarati'],
    specialisations: ['Personalised Muhurat', 'Bhava Sphuta Analysis', 'Family Harmony'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    philosophy: 'A true Muhurat is not merely a generic green window on a calendar; it must harmonize with your natal Lagna and active Dasha lord.',
    featuredVideo: {
      title: 'What makes a Muhurat personal?',
      duration: '3:40 min',
      description: 'Why a generally auspicious day can be counterproductive for an incompatible personal Lagna.'
    }
  },
  {
    id: 'dr-arundhati-sharma',
    name: 'Dr. Arundhati Sharma',
    title: 'Jyotish Visharad & Sanskrit Computationalist',
    lineage: 'Sampurnanand Sanskrit University, Varanasi',
    yearsPractising: 18,
    languages: ['Hindi', 'Sanskrit', 'English', 'Bengali'],
    specialisations: ['Nakshatra Archetypes', 'Health & Mind Significations', 'Spiritual Guidance'],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    philosophy: 'Calculations provide the structural facts. Human discernment interprets how those planetary configurations live inside your unique psychological reality.',
    featuredVideo: {
      title: 'What astrology can calculate — and what requires interpretation',
      duration: '5:10 min',
      description: 'The definitive boundary between astronomical computation and interpretive wisdom.'
    }
  }
];

export const EDITORIAL_VIDEOS = [
  {
    id: 'vid-1',
    topic: 'Vimshottari Mechanics',
    title: 'What exactly is a Mahadasha?',
    practitioner: 'Pt. Vidyadhar Shastri',
    duration: '4:15',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    summary: 'Planetary chapters do not cause events mechanically; they determine which mental and karmic themes are sensitized.'
  },
  {
    id: 'vid-2',
    topic: 'Difficult Periods',
    title: 'Does every difficult Dasha mean something bad?',
    practitioner: 'Pt. Vidyadhar Shastri',
    duration: '3:50',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    summary: 'Periods governed by Saturn or Rahu are often the most transformative chapters for discipline, long-term mastery, and resilience.'
  },
  {
    id: 'vid-3',
    topic: 'Time Selection',
    title: 'What makes a Muhurat personal?',
    practitioner: 'Pt. Raghavendra Joshi',
    duration: '3:40',
    thumbnail: 'https://images.unsplash.com/photo-1532767153582-b1a0e5145009?w=600&auto=format&fit=crop&q=80',
    summary: 'Why generic Panchang auspiciousness must be cross-referenced with your natal Tara Bala and Chandra Bala.'
  },
  {
    id: 'vid-4',
    topic: 'Calculation vs Interpretation',
    title: 'Why exact birth time matters to the minute',
    practitioner: 'Dr. Arundhati Sharma',
    duration: '4:30',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    summary: 'How a 4-minute shift alters the Navamsha lagna and shifts sub-period dates by weeks.'
  }
];
