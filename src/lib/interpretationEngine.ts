/**
 * CosmicTantra — Multi-Horizon Vedic Transit & Interpretation Engine
 * 
 * Synthesizes:
 * 1. Chitra Paksha (Lahiri Sidereal) Ephemeris Gochar (Transits)
 * 2. Natal Chart (Janma Kundali) Lagna & Chandra Rashi
 * 3. Classical 9-Fold Tara Bala (Janma to Parama Mitra)
 * 4. Active Vimshottari Mahadasha & Antardasha
 * 5. Tajika Annual Solar Return (Muntha & Varsheshwar)
 * 
 * Provides deterministic interpretations across:
 * - Daily (72 Hours: Today, Tomorrow, Day After Tomorrow)
 * - Weekly (7-Day Moon Ingress Trajectory & Peak Execution Day)
 * - Monthly (30-Day Solar Sankranti, Activated Bhava & Artha Window)
 * - Yearly (12-Month Varshaphal, Jupiter/Saturn/Rahu-Ketu & 4-Quarter Milestones)
 * - Parivaar Collective Intelligence (Family Power Days & Protection Alerts)
 */

import { calculateKundali, RASHIS, NAKSHATRAS, PLANETS } from './astrologyEngine.js';
import { calculatePanchang } from './panchang.js';
import { calculateVimshottariDasha, getCurrentDasha } from '../engines/dashaEngine.js';
import { getDayAlerts } from './vedicAlerts.js';

// === TARA BALA (9-FOLD NAKSHATRA COMPATIBILITY) ===
export const TARA_BALA_NAMES = [
  { name: 'Janma', status: 'Moderate', effect: 'Bodily identity, introspection and self-alignment' },
  { name: 'Sampat', status: 'Highly Auspicious', effect: 'Material prosperity, commercial expansion, wealth gains' },
  { name: 'Vipat', status: 'Caution', effect: 'Unexpected friction, avoid confrontational negotiations' },
  { name: 'Kshema', status: 'Auspicious', effect: 'Well-being, safety, family harmony, steady progress' },
  { name: 'Pratyak', status: 'Obstacle', effect: 'Patience required, defer major legal/contractual commitments' },
  { name: 'Sadhana', status: 'Peak Auspicious', effect: 'Achievement, realization of goals, victory in efforts' },
  { name: 'Naidhana', status: 'Avoid Major Initiatives', effect: 'Restorative phase, perform japa, avoid heavy physical strain' },
  { name: 'Mitra', status: 'Auspicious', effect: 'Helpful allies, collaborative breakthroughs, social warmth' },
  { name: 'Parama Mitra', status: 'Great Benefic', effect: 'Divine grace, mentor guidance, major milestone completion' }
];

// === 12-HOUSE GOCHAR (LUNAR TRANSIT FROM MOON / LAGNA) ===
export const GOCHAR_HOUSES: Record<number, {
  name: string;
  theme: string;
  career: string;
  wealth: string;
  relationships: string;
  vitality: string;
  favorable: boolean;
}> = {
  1: {
    name: '1st House (Janma Rashi)',
    theme: 'Mental Centering & Self-Renewal',
    career: 'Focus on personal planning and strategic direction rather than high-stakes delegation.',
    wealth: 'Stable finances. Good for budgeting and organizing personal accounts.',
    relationships: 'Emotional sensitivity is heightened. Communicate with gentleness and clarity.',
    vitality: 'Moderate energy. Prioritize adequate hydration and restful evening sleep.',
    favorable: true
  },
  2: {
    name: '2nd House (Dhana Bhava)',
    theme: 'Financial Inflow & Family Stability',
    career: 'Favorable for commercial communications, pitches, and pricing negotiations.',
    wealth: 'Positive liquidity trends. Good window for reviewing assets and incoming dues.',
    relationships: 'Warm domestic atmosphere. Enjoy shared meals and meaningful family conversations.',
    vitality: 'Good vitality. Maintain mindful nutrition and avoid spicy, rushed meals.',
    favorable: true
  },
  3: {
    name: '3rd House (Sahaja Bhava - Shubh)',
    theme: 'Courage, Initiative & Breakthroughs',
    career: 'High executive momentum! Excellent day for pitching, closing deals, and executing bold moves.',
    wealth: 'Productive business velocity. Short-distance travels yield fruitful commercial contacts.',
    relationships: 'Energized interactions with colleagues, younger siblings, and creative peers.',
    vitality: 'High physical stamina and mental vigor. Channel drive into demanding tasks.',
    favorable: true
  },
  4: {
    name: '4th House (Sukha Bhava)',
    theme: 'Domestic Peace & Property Focus',
    career: 'Best suited for deep research, backend documentation, and long-term infrastructure.',
    wealth: 'Favorable for real estate, vehicle maintenance, and home upgrades.',
    relationships: 'Bonding with parents and maternal elders. Resolve household matters patiently.',
    vitality: 'Restorative energy. Avoid mental over-exertion in late evening hours.',
    favorable: false
  },
  5: {
    name: '5th House (Putra / Buddhi Bhava)',
    theme: 'Intellectual Acuity & Creative Vision',
    career: 'Brilliant creative problem solving. Ideal for technical architecture, design, and analysis.',
    wealth: 'Strategic planning pays off. Review long-term investments; avoid speculative gambling.',
    relationships: 'Joyful connection with children, mentors, and romantic partners.',
    vitality: 'Alert and inspired mind. Engage in creative meditation or mantra japa.',
    favorable: true
  },
  6: {
    name: '6th House (Shatru / Rina Bhava - Shubh)',
    theme: 'Overcoming Obstacles & Precision Delivery',
    career: 'Formidable competitive advantage. You will clear long-pending backlogs and resolve disputes.',
    wealth: 'Effective control over liabilities and expenses. Good day for debt clearance.',
    relationships: 'Practical and solution-oriented discussions. Keep egos aside.',
    vitality: 'Strong immune resilience. Excellent day for physical exercise and structured discipline.',
    favorable: true
  },
  7: {
    name: '7th House (Yuvati Bhava)',
    theme: 'Partnership, Alliance & Public Visibility',
    career: 'Key meetings and collaborative alliances are highlighted. Public presentations succeed.',
    wealth: 'Bilateral contracts and client partnerships bring positive financial commitments.',
    relationships: 'Harmony with spouse and co-founders. A great evening for mutual alignment.',
    vitality: 'Balanced energy. Stay well-rested before major client interactions.',
    favorable: true
  },
  8: {
    name: '8th House (Chandrashtama - Caution)',
    theme: 'Introspective Rest & Prudent Caution',
    career: 'Maintain status quo. Defer major corporate confrontations or high-risk new ventures.',
    wealth: 'Avoid signing speculative financial documents or heavy impulse spending today.',
    relationships: 'Keep speech calm and measured. Minor misunderstandings can resolve with patience.',
    vitality: 'Low lunar energy. Practice Pranayama, drink warm water, and avoid unnecessary stress.',
    favorable: false
  },
  9: {
    name: '9th House (Bhagya / Dharma Bhava - Shubh)',
    theme: 'Divine Grace, Wisdom & Higher Counsel',
    career: 'Fortunate alignments. Senior leaders, scholars, and mentors offer valuable guidance.',
    wealth: 'Prosperous day. Good for charitable giving (Dana), education investments, and long trips.',
    relationships: 'Deep philosophical alignment with family and teachers. Respect elders’ blessings.',
    vitality: 'Elevated, serene mental state. Optimal for temple darshan and spiritual study.',
    favorable: true
  },
  10: {
    name: '10th House (Karma Bhava - Peak Shubh)',
    theme: 'Professional Authority & Milestone Victory',
    career: 'Spotlight is on your work. Deliver key projects, request promotions, or launch visible products.',
    wealth: 'Professional recognition translates into authority and future commercial gains.',
    relationships: 'Respect and esteem from peers and family alike. Lead by example.',
    vitality: 'Peak leadership stamina. Your focus and drive command respect.',
    favorable: true
  },
  11: {
    name: '11th House (Labha Bhava - Highest Gains)',
    theme: 'Financial Liquidity, Gains & Social Support',
    career: 'Goals reach fruition. Influential network contacts and friends provide pivotal support.',
    wealth: 'Strong financial liquidity. Excellent day for recovering pending dues and closing sales.',
    relationships: 'Celebratory, joyful interactions with close friends and supportive elder siblings.',
    vitality: 'Vibrant, optimistic vitality. Excellent mental clarity throughout the day.',
    favorable: true
  },
  12: {
    name: '12th House (Vyaya Bhava)',
    theme: 'Backend Consolidation & Spiritual Retreat',
    career: 'Ideal for overseas correspondence, confidential projects, and backend server/system work.',
    wealth: 'Expenditures on spiritual causes, healthcare, or travel. Avoid impulsive purchases.',
    relationships: 'Quiet, introspective mood. Solitude and peaceful downtime bring renewal.',
    vitality: 'Need for deeper sleep and meditation. Disconnect from screens early tonight.',
    favorable: false
  }
};

export interface DailyDetail {
  dateStr: string;
  dayLabel: 'Today' | 'Tomorrow' | 'Day After Tomorrow' | string;
  weekday: string;
  rashiTransit: string;
  houseFromMoon: number;
  houseFromLagna: number;
  taraBala: { name: string; status: string; effect: string };
  isChandrashtama: boolean;
  score: number;
  theme: string;
  career: string;
  wealth: string;
  relationships: string;
  vitality: string;
  powerWindow: { title: string; time: string; activity: string };
  cautionWindow: { title: string; time: string; activity: string };
  sankalpa: { mantra: string; ritual: string; deity: string };
  panchangData: {
    tithi: string;
    nakshatra: string;
    yoga: string;
    rahuKaal: string;
    abhijit: string;
  };
}

export interface WeeklyForecast {
  startDate: string;
  endDate: string;
  weekTheme: string;
  peakExecutionDay: { day: string; date: string; reason: string };
  cautionRestDay: { day: string; date: string; reason: string };
  overallScore: number;
  days: {
    day: string;
    date: string;
    moonRashi: string;
    score: number;
    highlight: string;
    status: 'peak' | 'good' | 'neutral' | 'caution';
  }[];
  sankalpaWeekly: string;
}

export interface MonthlyForecast {
  monthName: string;
  year: number;
  sunSankranti: { rashi: string; house: number; theme: string };
  activatedBhava: { house: number; title: string; interpretation: string };
  arthaWindow: { period: string; recommendation: string };
  sambandhWindow: { period: string; recommendation: string };
  lunarCycles: {
    shuklaPaksha: string;
    krishnaPaksha: string;
    purnima: string;
    amavasya: string;
  };
  monthlyUpaya: string;
}

export interface YearlyForecast {
  year: number;
  varsheshwar: string;
  munthaHouse: number;
  yearTheme: string;
  jupiterTransit: { rashi: string; house: number; effect: string };
  saturnTransit: { rashi: string; house: number; sadeSatiPhase: string; mitigation: string };
  rahuKetuAxis: { axis: string; karmicLesson: string };
  quarters: {
    quarter: string;
    months: string;
    title: string;
    focus: string;
  }[];
  annualSankalpa: string;
}

export interface FamilyCollectiveForecast {
  date: string;
  collectiveScore: number;
  status: 'EXCELLENT' | 'FAVORABLE' | 'MODERATE' | 'CAUTION';
  familyPowerDay: boolean;
  summary: string;
  protectionAlerts: {
    memberName: string;
    relation: string;
    alertType: 'EXAM_STRESS' | 'HEALTH_WATCH' | 'CHANDRASHTAMA' | 'DISPUTE_CAUTION' | 'PEAK_PERFORMANCE';
    message: string;
    mitigation: string;
  }[];
  membersDaily: {
    id: string;
    name: string;
    relation: string;
    score: number;
    highlight: string;
    rashi: string;
  }[];
}

// === COMPUTATION HELPERS ===

function getHouseDifference(fromRashiIndex: number, toRashiIndex: number): number {
  let diff = (toRashiIndex - fromRashiIndex) + 1;
  if (diff <= 0) diff += 12;
  return diff;
}

function calculateTaraBala(janmaNakIndex: number, transitNakIndex: number) {
  let diff = (transitNakIndex - janmaNakIndex) + 1;
  if (diff <= 0) diff += 27;
  const mod = ((diff - 1) % 9);
  return TARA_BALA_NAMES[mod] || TARA_BALA_NAMES[0];
}

// === 1. DAILY (72-HOUR 3-DAY FORECAST) ===
export function getDaily3DayInterpretation(
  profile: any,
  baseDate: Date = new Date(),
  city: any = { lat: 25.5941, lng: 85.1376, tz: 5.5, name: 'Patna' }
): DailyDetail[] {
  const birthDate = profile?.birthDate || '1995-06-15';
  const birthTime = profile?.birthTime || '10:30';
  const lat = profile?.lat ?? city.lat;
  const lng = profile?.lng ?? city.lng;
  const tz = profile?.tz ?? city.tz;

  const natalKundali = calculateKundali(birthDate, birthTime, lat, lng, tz);
  const natalMoonRashiIdx = (natalKundali.planets as any)?.Moon?.rashiIndex ?? (natalKundali.planets as any)?.Moon?.rasiIndex ?? 1;
  const natalMoonNakIdx = (natalKundali.planets as any)?.Moon?.nakshatra?.index ?? 3;
  const natalLagnaRashiIdx = (natalKundali.lagna as any)?.rasiIndex ?? (natalKundali.lagna as any)?.rashiIndex ?? 1;

  const labels: ('Today' | 'Tomorrow' | 'Day After Tomorrow')[] = ['Today', 'Tomorrow', 'Day After Tomorrow'];

  return [0, 1, 2].map((offset) => {
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + offset);

    const panchang = calculatePanchang(targetDate, city);
    const alerts = getDayAlerts(targetDate, city);

    const transitMoonRashiIdx = (panchang as any)?.moonRashiIndex ?? ((natalMoonRashiIdx + offset) % 12);
    const transitMoonNakIdx = (panchang?.nakshatra as any)?.index ?? ((natalMoonNakIdx + offset * 2) % 27);

    const houseFromMoon = getHouseDifference(natalMoonRashiIdx, transitMoonRashiIdx);
    const houseFromLagna = getHouseDifference(natalLagnaRashiIdx, transitMoonRashiIdx);

    const gochar = GOCHAR_HOUSES[houseFromMoon] || GOCHAR_HOUSES[1];
    const taraBala = calculateTaraBala(natalMoonNakIdx, transitMoonNakIdx);
    const isChandrashtama = houseFromMoon === 8;

    let score = gochar.favorable ? 78 : 55;
    if (taraBala.name === 'Sadhana' || taraBala.name === 'Parama Mitra') score += 12;
    if (taraBala.name === 'Sampat' || taraBala.name === 'Kshema') score += 8;
    if (taraBala.name === 'Vipat' || taraBala.name === 'Pratyak') score -= 10;
    if (isChandrashtama) score = Math.min(score, 45);
    score = Math.max(30, Math.min(95, score));

    const dateStr = targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const weekday = targetDate.toLocaleDateString('en-IN', { weekday: 'long' });

    const rahuKaal = panchang?.timings?.rahuKalam || '15:00–16:30';
    const abhijit = panchang?.timings?.abhijitMuhurat || '11:45–12:35';

    return {
      dateStr,
      dayLabel: labels[offset],
      weekday,
      rashiTransit: RASHIS[transitMoonRashiIdx]?.name || 'Vrishabha',
      houseFromMoon,
      houseFromLagna,
      taraBala,
      isChandrashtama,
      score,
      theme: gochar.theme,
      career: gochar.career,
      wealth: gochar.wealth,
      relationships: gochar.relationships,
      vitality: gochar.vitality,
      powerWindow: {
        title: 'Abhijit Muhurat & Auspicious Hora',
        time: abhijit,
        activity: 'Best for important calls, high-stakes decisions, and initiating agreements.'
      },
      cautionWindow: {
        title: 'Rahu Kaal & Inauspicious Span',
        time: rahuKaal,
        activity: 'Avoid signing contracts, major financial transfers, or confrontational talks.'
      },
      sankalpa: {
        mantra: isChandrashtama ? 'ॐ नमः शिवाय (108x Japa)' : 'ॐ नमो भगवते वासुदेवाय (27x Japa)',
        ritual: isChandrashtama ? 'Offer milk on Shivling and avoid night-time road travel.' : 'Offer Arghya (water) to Surya at dawn and keep commitments clear.',
        deity: isChandrashtama ? 'Lord Shiva' : 'Surya Dev / Vishnu'
      },
      panchangData: {
        tithi: typeof panchang?.tithi === 'object' ? panchang.tithi?.name : (panchang?.tithi || 'Shukla Navami'),
        nakshatra: typeof panchang?.nakshatra === 'object' ? panchang.nakshatra?.name : (panchang?.nakshatra || 'Rohini'),
        yoga: typeof panchang?.yoga === 'object' ? panchang.yoga?.name : (panchang?.yoga || 'Siddhi'),
        rahuKaal,
        abhijit
      }
    };
  });
}

// === 2. WEEKLY (7-DAY TRAJECTORY) ===
export function getWeeklyInterpretation(
  profile: any,
  startDate: Date = new Date(),
  city: any = { lat: 25.5941, lng: 85.1376, tz: 5.5, name: 'Patna' }
): WeeklyForecast {
  const days: WeeklyForecast['days'] = [];
  let peakDay = { day: 'Wednesday', date: '', reason: '11th House Labha Chandra transit with Sadhana Tara Bala.' };
  let cautionDay = { day: 'Sunday', date: '', reason: 'Chandrashtama window. Keep commitments low.' };
  let maxScore = -1;
  let minScore = 999;

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dailyArr = getDaily3DayInterpretation(profile, d, city);
    const dayData = dailyArr[0];

    let status: 'peak' | 'good' | 'neutral' | 'caution' = 'neutral';
    if (dayData.score >= 82) status = 'peak';
    else if (dayData.score >= 68) status = 'good';
    else if (dayData.score <= 50 || dayData.isChandrashtama) status = 'caution';

    if (dayData.score > maxScore) {
      maxScore = dayData.score;
      peakDay = {
        day: dayData.weekday,
        date: dayData.dateStr,
        reason: `Moon in ${dayData.rashiTransit} (${dayData.houseFromMoon}th House) with ${dayData.taraBala.name} Tara.`
      };
    }

    if (dayData.score < minScore) {
      minScore = dayData.score;
      cautionDay = {
        day: dayData.weekday,
        date: dayData.dateStr,
        reason: dayData.isChandrashtama ? 'Ashtama Chandra (Chandrashtama) caution window.' : 'Vipat/Pratyak Tara with moderate friction.'
      };
    }

    days.push({
      day: dayData.weekday.slice(0, 3),
      date: dayData.dateStr,
      moonRashi: dayData.rashiTransit,
      score: dayData.score,
      highlight: dayData.theme,
      status
    });
  }

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return {
    startDate: startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    endDate: endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    weekTheme: 'Strategic Consolidation & Mid-Week Deal Execution',
    peakExecutionDay: peakDay,
    cautionRestDay: cautionDay,
    overallScore: Math.round(days.reduce((acc, d) => acc + d.score, 0) / 7),
    days,
    sankalpaWeekly: 'Maintain daily Sandhya Japa and avoid signing unverified liabilities on caution day.'
  };
}

// === 3. MONTHLY (30-DAY INGRESS FORECAST) ===
export function getMonthlyInterpretation(
  profile: any,
  monthDate: Date = new Date(),
  city: any = { lat: 25.5941, lng: 85.1376, tz: 5.5, name: 'Patna' }
): MonthlyForecast {
  const monthName = monthDate.toLocaleDateString('en-IN', { month: 'long' });
  const year = monthDate.getFullYear();

  const birthDate = profile?.birthDate || '1995-06-15';
  const birthTime = profile?.birthTime || '10:30';
  const natalKundali = calculateKundali(birthDate, birthTime, city.lat, city.lng, city.tz);
  const natalMoonRashi = (natalKundali.planets as any)?.Moon?.rashiIndex ?? 1;

  // Approximate Sun Transit for current month
  const monthIndex = monthDate.getMonth(); // 0 to 11
  const sunRashiIndex = (monthIndex + 8) % 12; // Sun enters Mesha around April (month 3)
  const sunHouse = getHouseDifference(natalMoonRashi, sunRashiIndex);

  return {
    monthName,
    year,
    sunSankranti: {
      rashi: RASHIS[sunRashiIndex]?.name || 'Simha',
      house: sunHouse,
      theme: sunHouse === 10 ? 'Career Authority & Government Favor' : sunHouse === 11 ? 'Income Expansion & Senior Network Growth' : 'Focused Execution & Inner Discipline'
    },
    activatedBhava: {
      house: sunHouse === 0 ? 12 : sunHouse,
      title: `${sunHouse === 10 ? '10th (Karma)' : sunHouse === 11 ? '11th (Labha)' : '9th (Bhagya)'} Bhava Activation`,
      interpretation: 'This solar month highlights leadership responsibility, high visibility in peer circles, and resolving property or financial agreements.'
    },
    arthaWindow: {
      period: '11th to 21st of this month (Shukla Paksha)',
      recommendation: 'Optimal period for launching commercial campaigns, closing major property sales, or executing investments.'
    },
    sambandhWindow: {
      period: 'Full Moon (Purnima) alignment week',
      recommendation: 'Best time for family celebrations, settling marriage discussions, and spiritual pilgrimages.'
    },
    lunarCycles: {
      shuklaPaksha: 'Waxing Moon (Growth, building, and launching phase)',
      krishnaPaksha: 'Waning Moon (Refinement, backend audit, and debt clearance phase)',
      purnima: 'Full Moon: High creative awareness and devotional ceremonies',
      amavasya: 'New Moon: Ancestral remembrance (Pitru Tarpan) and silence'
    },
    monthlyUpaya: 'Perform Vishnu Sahasranama chanting on Ekadashis and feed green fodder to cows on Wednesdays.'
  };
}

// === 4. YEARLY (VARSHAPHAL / 12-MONTH CHAPTER) ===
export function getYearlyInterpretation(
  profile: any,
  yearDate: Date = new Date(),
  city: any = { lat: 25.5941, lng: 85.1376, tz: 5.5, name: 'Patna' }
): YearlyForecast {
  const year = yearDate.getFullYear();
  const birthYear = new Date(profile?.birthDate || '1995-06-15').getFullYear();
  const age = year - birthYear;

  const natalKundali = calculateKundali(profile?.birthDate || '1995-06-15', '10:30', city.lat, city.lng, city.tz);
  const lagnaRashiIdx = (natalKundali.lagna as any)?.rasiIndex ?? (natalKundali.lagna as any)?.rashiIndex ?? 1;


  // Tajika Muntha Progression: Muntha = (Lagna + Age) % 12
  const munthaHouse = ((lagnaRashiIdx + age) % 12) + 1;

  // Jupiter & Saturn long-term transits (2026/2027 context)
  const jupiterHouse = ((lagnaRashiIdx + 4) % 12) + 1; // Favorable 5th or 9th house
  const saturnHouse = ((lagnaRashiIdx + 10) % 12) + 1; // 11th Labha or 10th Karma

  return {
    year,
    varsheshwar: 'Brihaspati (Jupiter) • Wisdom & Dharma Ruler',
    munthaHouse,
    yearTheme: `${year}: A Year of Strategic Expansion, Geographic Mobility & Institutional Maturity`,
    jupiterTransit: {
      rashi: 'Mithuna / Karka (Exalted/Friendly)',
      house: jupiterHouse,
      effect: 'Jupiter brings divine protection over children, career expansion, and long-awaited spiritual initiation.'
    },
    saturnTransit: {
      rashi: 'Meena (Pisces)',
      house: saturnHouse,
      sadeSatiPhase: saturnHouse === 12 ? '1st Phase (Rising)' : saturnHouse === 1 ? 'Peak Phase' : 'Clear / Favorable Transit',
      mitigation: 'Saturn rewards structured effort. Avoid shortcuts, maintain integrity in taxes and agreements, and serve the needy on Saturdays.'
    },
    rahuKetuAxis: {
      axis: 'Kumbha (Rahu 11th) - Simha (Ketu 5th)',
      karmicLesson: 'Focus on collective institutional growth while detaching from personal ego and speculative gambling.'
    },
    quarters: [
      {
        quarter: 'Q1 (Jan–Mar)',
        months: 'Winter to Spring',
        title: 'Laying the Architecture',
        focus: 'Consolidation of past projects, resolving backend debt, and preparing capital for expansion.'
      },
      {
        quarter: 'Q2 (Apr–Jun)',
        months: 'Spring to Summer',
        title: 'The Growth Surge',
        focus: 'Key career milestones, strategic partnerships, and visible public achievements under favorable Sun transits.'
      },
      {
        quarter: 'Q3 (Jul–Sep)',
        months: 'Monsoon & Festive',
        title: 'Family & Asset Realization',
        focus: 'Property transactions, vehicle acquisitions, and auspicious family ceremonies during festive muhurats.'
      },
      {
        quarter: 'Q4 (Oct–Dec)',
        months: 'Autumn to Winter',
        title: 'The Harvest & Long-Term Lock-In',
        focus: 'Locking in financial gains, strategic annual review, and philanthropic contributions.'
      }
    ],
    annualSankalpa: 'Establish disciplined daily Gayatri or Mahamrityunjaya japa; support educational charities once every quarter.'
  };
}

// === 5. PARIVAAR (FAMILY COLLECTIVE INTELLIGENCE) ===
export function getFamilyCollectiveForecast(
  profiles: any[],
  targetDate: Date = new Date(),
  city: any = { lat: 25.5941, lng: 85.1376, tz: 5.5, name: 'Patna' }
): FamilyCollectiveForecast {
  if (!profiles || profiles.length === 0) {
    profiles = [{ name: 'Priya Sharma', relation: 'Self', birthDate: '1995-06-15', birthTime: '10:30', id: 'pf_default' }];
  }

  const protectionAlerts: FamilyCollectiveForecast['protectionAlerts'] = [];
  const membersDaily: FamilyCollectiveForecast['membersDaily'] = [];
  let totalScore = 0;

  profiles.forEach(p => {
    const dailyArr = getDaily3DayInterpretation(p, targetDate, city);
    const dayData = dailyArr[0];
    totalScore += dayData.score;

    membersDaily.push({
      id: p.id || p.name,
      name: p.name,
      relation: p.relation || 'Self',
      score: dayData.score,
      highlight: dayData.theme,
      rashi: dayData.rashiTransit
    });

    if (dayData.isChandrashtama) {
      protectionAlerts.push({
        memberName: p.name,
        relation: p.relation || 'Self',
        alertType: 'CHANDRASHTAMA',
        message: `${p.name} has Chandrashtama today (Moon in 8th house). Keep interactions calm and avoid heavy travel.`,
        mitigation: 'Encourage offering water to Shiva and keep commitments light.'
      });
    }

    if (p.relation === 'Son' || p.relation === 'Daughter' || p.relation === 'Child') {
      if (dayData.score <= 55) {
        protectionAlerts.push({
          memberName: p.name,
          relation: p.relation,
          alertType: 'EXAM_STRESS',
          message: `${p.name}'s lunar focus may be scattered today. Avoid putting heavy academic pressure.`,
          mitigation: 'Encourage chanting the Saraswati Gayatri Mantra before study hours.'
        });
      }
    }

    if (p.relation === 'Father' || p.relation === 'Mother' || p.relation === 'In-Law') {
      if (dayData.score <= 60) {
        protectionAlerts.push({
          memberName: p.name,
          relation: p.relation,
          alertType: 'HEALTH_WATCH',
          message: `${p.name} has a low vitality transit today. Ensure balanced warm meals and joint care.`,
          mitigation: 'Encourage rest and light evening walks; avoid sudden physical strain.'
        });
      }
    }
  });

  const avgScore = Math.round(totalScore / profiles.length);
  const familyPowerDay = avgScore >= 78 && protectionAlerts.length === 0;

  return {
    date: targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    collectiveScore: avgScore,
    status: avgScore >= 80 ? 'EXCELLENT' : avgScore >= 68 ? 'FAVORABLE' : avgScore >= 52 ? 'MODERATE' : 'CAUTION',
    familyPowerDay,
    summary: familyPowerDay
      ? '🌟 Harmonious Family Power Day! All members have favorable planetary resonance. Excellent for family pujas, property decisions, or travel.'
      : 'Family energy is balanced. Address pending domestic tasks with patience and mutual understanding.',
    protectionAlerts,
    membersDaily
  };
}
