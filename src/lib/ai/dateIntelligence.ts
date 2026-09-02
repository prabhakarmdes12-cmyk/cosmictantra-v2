/**
 * CONVERSATIONAL DATE INTELLIGENCE & TEMPORAL CONTEXT ENGINE
 * -----------------------------------------------------------------------------
 * Manages ConversationPanchangContext, multi-turn date threads, and deterministic
 * resolution of natural language temporal references (Hindi, Hinglish, English).
 */

import { LocationCoordinates, DEFAULT_LOCATION, resolveLocation } from '../panchangFactBundle';
import { findNextSpecificObservance } from '../panchang/nearbySacredDays';

export interface ConversationPanchangContext {
  referenceDate: string; // YYYY-MM-DD
  location: LocationCoordinates;
  source: 'COSMIC_NOW' | 'USER_SELECTED' | 'USER_MENTIONED' | 'KUNDLI_BIRTH_DATE';
  conversationalFocus?: {
    type: 'DATE' | 'TITHI' | 'NAKSHATRA' | 'MUHURTA' | 'FAST_FESTIVAL' | 'DASHA' | 'KUNDLI' | 'RAHUKAAL' | 'ABHIJIT';
    entityId?: string;
    lastIntent?: string;
  };
  previousReferenceDate?: string;
  activeReportId?: string;
  profileName?: string;
  kundliSummary?: any;
}

export interface DateResolutionResult {
  resolvedDate: string; // YYYY-MM-DD
  resolvedDateObj: Date;
  dateChanged: boolean;
  resolvedLocation: LocationCoordinates;
  locationChanged: boolean;
  inheritedIntent?: string;
  isComparison?: boolean;
  comparisonDate?: string;
  observanceEntity?: string;
}

const MONTHS_MAP: Record<string, number> = {
  'jan': 0, 'january': 0, 'जनवरी': 0,
  'feb': 1, 'february': 1, 'फ़रवरी': 1, 'फरवरी': 1,
  'mar': 2, 'march': 2, 'मार्च': 2,
  'apr': 3, 'april': 3, 'अप्रैल': 3,
  'may': 4, 'मई': 4,
  'jun': 5, 'june': 5, 'जून': 5,
  'jul': 6, 'july': 6, 'जुलाई': 6,
  'aug': 7, 'august': 7, 'अगस्त': 7,
  'sep': 8, 'sept': 8, 'september': 8, 'सितंबर': 8, 'सितम्बर': 8,
  'oct': 9, 'october': 9, 'अक्टूबर': 9,
  'nov': 10, 'november': 10, 'नवंबर': 10, 'नवम्बर': 10,
  'dec': 11, 'december': 11, 'दिसंबर': 11, 'दिसम्बर': 11
};

const WEEKDAYS_MAP: Record<string, number> = {
  'रविवार': 0, 'रवि': 0, 'itwar': 0, 'sun': 0, 'sunday': 0,
  'सोमवार': 1, 'सोम': 1, 'somwar': 1, 'mon': 1, 'monday': 1,
  'मंगलवार': 2, 'मंगल': 2, 'mangalwar': 2, 'tue': 2, 'tuesday': 2,
  'बुधवार': 3, 'बुध': 3, 'budhwar': 3, 'wed': 3, 'wednesday': 3,
  'गुरुवार': 4, 'गुरु': 4, 'बृहस्पतिवार': 4, 'brihaspativar': 4, 'thu': 4, 'thursday': 4,
  'शुक्रवार': 5, 'शुक्र': 5, 'shukrawar': 5, 'fri': 5, 'friday': 5,
  'शनिवार': 6, 'शनि': 6, 'shaniwar': 6, 'sat': 6, 'saturday': 6
};

/**
 * Format a Date to YYYY-MM-DD
 */
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses relative & absolute date expressions from user query against current context.
 */
export function resolveConversationalDate(
  queryRaw: string,
  context?: Partial<ConversationPanchangContext>
): DateResolutionResult {
  const query = (queryRaw || '').toLowerCase().trim();
  const today = new Date();
  const todayStr = formatDateISO(today);

  const baseDateStr = context?.referenceDate || todayStr;
  const baseDate = new Date(`${baseDateStr}T12:00:00`);
  let activeLocation = resolveLocation(context?.location || DEFAULT_LOCATION);
  let locationChanged = false;

  // Check if location is explicitly mentioned in query (e.g. "काशी में", "धनबाद का", "in Delhi")
  if (query.includes('varanasi') || query.includes('काशी') || query.includes('वाराणसी')) {
    activeLocation = resolveLocation('Varanasi, UP');
    locationChanged = true;
  } else if (query.includes('dhanbad') || query.includes('धनबाद')) {
    activeLocation = resolveLocation('Dhanbad, JH');
    locationChanged = true;
  } else if (query.includes('ranchi') || query.includes('राँची') || query.includes('रांची')) {
    activeLocation = resolveLocation('Ranchi, JH');
    locationChanged = true;
  } else if (query.includes('patna') || query.includes('पटना')) {
    activeLocation = resolveLocation('Patna, BR');
    locationChanged = true;
  } else if (query.includes('delhi') || query.includes('दिल्ली')) {
    activeLocation = resolveLocation('New Delhi, DL');
    locationChanged = true;
  } else if (query.includes('mumbai') || query.includes('मुम्बई') || query.includes('मुंबई')) {
    activeLocation = resolveLocation('Mumbai, MH');
    locationChanged = true;
  } else if (query.includes('kolkata') || query.includes('कोलकाता')) {
    activeLocation = resolveLocation('Kolkata, WB');
    locationChanged = true;
  } else if (query.includes('ujjain') || query.includes('उज्जैन')) {
    activeLocation = resolveLocation('Ujjain, MP');
    locationChanged = true;
  } else if (query.includes('haridwar') || query.includes('हरिद्वार')) {
    activeLocation = resolveLocation('Haridwar, UK');
    locationChanged = true;
  }

  let targetDate = new Date(baseDate);
  let dateChanged = false;
  let isComparison = false;
  let comparisonDate: string | undefined = undefined;
  let observanceEntity: string | undefined = undefined;
  let inheritedIntent: string | undefined = undefined;

  // 1. Comparison phrases: "आज और कल में", "compare today and tomorrow", "एक दिन पहले बेहतर है?"
  if (
    query.includes('और कल में') || query.includes('today and tomorrow') ||
    query.includes('कौन बेहतर') || query.includes('better day') ||
    query.includes('एक दिन पहले बेहतर') || query.includes('एक दिन बाद बेहतर')
  ) {
    isComparison = true;
    if (query.includes('एक दिन पहले बेहतर')) {
      const prev = new Date(baseDate.getTime() - 86400000);
      comparisonDate = formatDateISO(prev);
      targetDate = baseDate;
    } else {
      const next = new Date(baseDate.getTime() + 86400000);
      comparisonDate = formatDateISO(next);
      targetDate = baseDate;
    }
    return {
      resolvedDate: formatDateISO(targetDate),
      resolvedDateObj: targetDate,
      dateChanged: false,
      resolvedLocation: activeLocation,
      locationChanged,
      isComparison: true,
      comparisonDate
    };
  }

  // 2. Specific Next Observances: "अगली एकादशी", "अगला प्रदोष", "अगली पूर्णिमा", etc.
  if (query.includes('अगली एकादशी') || query.includes('next ekadashi') || query.includes('एकादशी कब')) {
    const nextObs = findNextSpecificObservance(today, 'EKADASHI', activeLocation);
    if (nextObs) {
      targetDate = nextObs.dateObj;
      dateChanged = true;
      observanceEntity = 'EKADASHI';
      return {
        resolvedDate: formatDateISO(targetDate),
        resolvedDateObj: targetDate,
        dateChanged: true,
        resolvedLocation: activeLocation,
        locationChanged,
        observanceEntity: 'EKADASHI'
      };
    }
  }

  if (query.includes('अगली पूर्णिमा') || query.includes('next purnima') || query.includes('पूर्णिमा कब')) {
    const nextObs = findNextSpecificObservance(today, 'PURNIMA', activeLocation);
    if (nextObs) {
      targetDate = nextObs.dateObj;
      dateChanged = true;
      observanceEntity = 'PURNIMA';
      return {
        resolvedDate: formatDateISO(targetDate),
        resolvedDateObj: targetDate,
        dateChanged: true,
        resolvedLocation: activeLocation,
        locationChanged,
        observanceEntity: 'PURNIMA'
      };
    }
  }

  if (query.includes('अगला प्रदोष') || query.includes('next pradosh') || query.includes('प्रदोष कब')) {
    const nextObs = findNextSpecificObservance(today, 'PRADOSH', activeLocation);
    if (nextObs) {
      targetDate = nextObs.dateObj;
      dateChanged = true;
      observanceEntity = 'PRADOSH';
      return {
        resolvedDate: formatDateISO(targetDate),
        resolvedDateObj: targetDate,
        dateChanged: true,
        resolvedLocation: activeLocation,
        locationChanged,
        observanceEntity: 'PRADOSH'
      };
    }
  }

  if (query.includes('अगली अमावस्या') || query.includes('next amavasya') || query.includes('अमावस्या कब')) {
    const nextObs = findNextSpecificObservance(today, 'AMAVASYA', activeLocation);
    if (nextObs) {
      targetDate = nextObs.dateObj;
      dateChanged = true;
      observanceEntity = 'AMAVASYA';
      return {
        resolvedDate: formatDateISO(targetDate),
        resolvedDateObj: targetDate,
        dateChanged: true,
        resolvedLocation: activeLocation,
        locationChanged,
        observanceEntity: 'AMAVASYA'
      };
    }
  }

  if (query.includes('शिवरात्रि कब') || query.includes('next shivaratri') || query.includes('अगली शिवरात्रि')) {
    const nextObs = findNextSpecificObservance(today, 'SHIVARATRI', activeLocation);
    if (nextObs) {
      targetDate = nextObs.dateObj;
      dateChanged = true;
      observanceEntity = 'SHIVARATRI';
      return {
        resolvedDate: formatDateISO(targetDate),
        resolvedDateObj: targetDate,
        dateChanged: true,
        resolvedLocation: activeLocation,
        locationChanged,
        observanceEntity: 'SHIVARATRI'
      };
    }
  }

  // 3. Follow-up shortcut: "और कल?", "कल वाला", "कल का", "tomorrow"
  if (
    query === 'और कल?' || query === 'और कल' || query.startsWith('और कल') ||
    query === 'कल?' || query.includes('कल वाला') || query.includes('कल का') ||
    query.includes('tomorrow')
  ) {
    targetDate = new Date(baseDate.getTime() + 86400000);
    dateChanged = true;
    // Preserve last focus intent (e.g. Rahukaal, Tithi, etc.)
    inheritedIntent = context?.conversationalFocus?.lastIntent || 'GET_RAHUKAAL';
    return {
      resolvedDate: formatDateISO(targetDate),
      resolvedDateObj: targetDate,
      dateChanged: true,
      resolvedLocation: activeLocation,
      locationChanged,
      inheritedIntent
    };
  }

  // 4. "परसों", "day after tomorrow"
  if (query.includes('परसों') || query.includes('day after tomorrow')) {
    targetDate = new Date(baseDate.getTime() + 2 * 86400000);
    dateChanged = true;
    inheritedIntent = context?.conversationalFocus?.lastIntent;
    return {
      resolvedDate: formatDateISO(targetDate),
      resolvedDateObj: targetDate,
      dateChanged: true,
      resolvedLocation: activeLocation,
      locationChanged,
      inheritedIntent
    };
  }

  // 5. "एक दिन पहले", "one day before", "yesterday"
  if (query.includes('एक दिन पहले') || query.includes('1 day before') || query.includes('पिछले दिन') || query.includes('yesterday')) {
    targetDate = new Date(baseDate.getTime() - 86400000);
    dateChanged = true;
    inheritedIntent = context?.conversationalFocus?.lastIntent;
    return {
      resolvedDate: formatDateISO(targetDate),
      resolvedDateObj: targetDate,
      dateChanged: true,
      resolvedLocation: activeLocation,
      locationChanged,
      inheritedIntent
    };
  }

  // 6. "एक दिन बाद", "1 day after", "अगले दिन"
  if (query.includes('एक दिन बाद') || query.includes('1 day after') || query.includes('अगले दिन')) {
    targetDate = new Date(baseDate.getTime() + 86400000);
    dateChanged = true;
    inheritedIntent = context?.conversationalFocus?.lastIntent;
    return {
      resolvedDate: formatDateISO(targetDate),
      resolvedDateObj: targetDate,
      dateChanged: true,
      resolvedLocation: activeLocation,
      locationChanged,
      inheritedIntent
    };
  }

  // 7. "आज", "today"
  if (query.includes('आज') || query.includes('today')) {
    targetDate = today;
    dateChanged = baseDateStr !== todayStr;
    return {
      resolvedDate: todayStr,
      resolvedDateObj: today,
      dateChanged,
      resolvedLocation: activeLocation,
      locationChanged
    };
  }

  // 8. "उसी दिन", "उस दिन", "that day", "same day"
  if (query.includes('उस दिन') || query.includes('उसी दिन') || query.includes('that day') || query.includes('same day')) {
    return {
      resolvedDate: baseDateStr,
      resolvedDateObj: baseDate,
      dateChanged: false,
      resolvedLocation: activeLocation,
      locationChanged
    };
  }

  // 9. Named Weekdays (e.g. "अगले सोमवार", "इस रविवार", "शनिवार को")
  for (const [wName, wDayIdx] of Object.entries(WEEKDAYS_MAP)) {
    if (query.includes(wName)) {
      const currentDayIdx = baseDate.getDay();
      let diffDays = (wDayIdx - currentDayIdx + 7) % 7;
      if (diffDays === 0 && (query.includes('अगले') || query.includes('next'))) {
        diffDays = 7;
      } else if (diffDays === 0) {
        diffDays = 0;
      }
      targetDate = new Date(baseDate.getTime() + diffDays * 86400000);
      dateChanged = true;
      return {
        resolvedDate: formatDateISO(targetDate),
        resolvedDateObj: targetDate,
        dateChanged: true,
        resolvedLocation: activeLocation,
        locationChanged
      };
    }
  }

  // 10. Explicit Date Parsing: "5 सितंबर", "5th September", "12 August 2026", "2026-09-05"
  // Format: YYYY-MM-DD
  const isoMatch = query.match(/\b(202[0-9])-([0-1][0-9])-([0-3][0-9])\b/);
  if (isoMatch) {
    targetDate = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T12:00:00`);
    return {
      resolvedDate: isoMatch[0],
      resolvedDateObj: targetDate,
      dateChanged: isoMatch[0] !== baseDateStr,
      resolvedLocation: activeLocation,
      locationChanged
    };
  }

  // Format: "5 सितंबर" or "5 september" or "5th sep 2026"
  for (const [mName, mIdx] of Object.entries(MONTHS_MAP)) {
    if (query.includes(mName)) {
      const dayMatch = query.match(new RegExp(`(\\d{1,2})\\s*(?:th|st|nd|rd)?\\s*(?:${mName})|(?:${mName})\\s*(\\d{1,2})`));
      if (dayMatch) {
        const dNum = parseInt(dayMatch[1] || dayMatch[2], 10);
        if (dNum >= 1 && dNum <= 31) {
          const yearMatch = query.match(/\b(202[4-9])\b/);
          const yNum = yearMatch ? parseInt(yearMatch[1], 10) : today.getFullYear();
          targetDate = new Date(yNum, mIdx, dNum, 12, 0, 0);
          const formatted = formatDateISO(targetDate);
          return {
            resolvedDate: formatted,
            resolvedDateObj: targetDate,
            dateChanged: formatted !== baseDateStr,
            resolvedLocation: activeLocation,
            locationChanged
          };
        }
      }
    }
  }

  // Default: retain existing reference date and location
  return {
    resolvedDate: baseDateStr,
    resolvedDateObj: baseDate,
    dateChanged: false,
    resolvedLocation: activeLocation,
    locationChanged
  };
}
