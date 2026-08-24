import { Clock, Home, Heart, Briefcase, Car, UserCheck, Compass } from 'lucide-react';

export const MUHURAT_EVENTS = [
  {
    id: 'marriage',
    title: 'Vivah (Marriage)',
    desc: 'Alignment of Lagna Shuddhi, avoidance of Vedha, and harmony between bride & groom charts.',
    nature: 'High Complexity',
    status: 'Practitioner Assisted',
    suggestedWindow: 'Upcoming Auspicious Windows: Nov 18, Nov 24, Dec 02 (2026)',
    icon: Heart
  },
  {
    id: 'griha-pravesh',
    title: 'Griha Pravesh (House Warming)',
    desc: 'Purification of Vastu Purusha space during favorable solar transit (Uttarayana preferred).',
    nature: 'Solar & Lunar Harmony',
    status: 'Practitioner Assisted',
    suggestedWindow: 'Favorable Tithis: Shukla Panchami, Saptami, Dashami',
    icon: Home
  },
  {
    id: 'business',
    title: 'Business & Enterprise Launch',
    desc: 'Initiation under fixed or movable Nakshatras aligned with 10th and 11th Bhava lords.',
    nature: 'Enterprise Timing',
    status: 'Practitioner Assisted',
    suggestedWindow: 'Optimal: Pushya, Rohini, Uttara Phalguni with strong Mercury/Jupiter',
    icon: Briefcase
  },
  {
    id: 'vehicle',
    title: 'Vehicle Purchase / Delivery',
    desc: 'Auspicious daytime Horas under Venusian & Solar harmony to ensure safety and longevity.',
    nature: 'Choghadiya & Hora',
    status: 'Deterministic Calculation',
    suggestedWindow: 'Shubh / Amrit Choghadiyas on Wednesday or Friday',
    icon: Car
  },
  {
    id: 'property',
    title: 'Property & Land Registry',
    desc: 'Alignment with Mars and Saturn planetary dignity, avoiding Rikta Tithis (4, 9, 14).',
    nature: 'Bhoomi Karaka Alignment',
    status: 'Practitioner Assisted',
    suggestedWindow: 'Consult Jyotishi for individual Moon-Chandra Bala verification',
    icon: Compass
  },
  {
    id: 'namkaran',
    title: 'Namkaran (Naming Ceremony)',
    desc: 'Conducted on the 11th or 12th day after birth according to the janma Nakshatra syllable.',
    nature: 'Samskara Timing',
    status: 'Deterministic Calculation',
    suggestedWindow: 'Auspicious on Anuradha, Punarvasu, Magha, Uttara Ashadha',
    icon: UserCheck
  }
];
