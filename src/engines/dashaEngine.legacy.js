/**
 * CosmicTantra V34 — Vimshottari Dasha & Life Timeline Engine
 * Calculates 120-year Vimshottari Mahadashas, Antardashas,
 * Karma timelines, and major planetary period predictions
 */

export const DASHA_LORDS = [
  { lord: 'Ketu', years: 7 },
  { lord: 'Venus', years: 20 },
  { lord: 'Sun', years: 6 },
  { lord: 'Moon', years: 10 },
  { lord: 'Mars', years: 7 },
  { lord: 'Rahu', years: 18 },
  { lord: 'Jupiter', years: 16 },
  { lord: 'Saturn', years: 19 },
  { lord: 'Mercury', years: 17 },
];

export const TOTAL_DASHA_YEARS = 120;

export function calculateVimshottariDasha(moonNakshatra, birthDate) {
  const nakDegree = moonNakshatra.degree;
  const elapsedFraction = nakDegree / 13.3333;

  const firstLordName = moonNakshatra.ruler;
  const firstLordIndex = DASHA_LORDS.findIndex(d => d.lord === firstLordName);
  const firstLordMaxYears = DASHA_LORDS[firstLordIndex].years;

  const firstLordRemainingYears = firstLordMaxYears * (1 - elapsedFraction);

  const dashas = [];
  let currentStart = new Date(birthDate);

  const firstEnd = new Date(currentStart);
  firstEnd.setFullYear(firstEnd.getFullYear() + Math.floor(firstLordRemainingYears));
  const remainingDays = Math.round((firstLordRemainingYears % 1) * 365.25);
  firstEnd.setDate(firstEnd.getDate() + remainingDays);

  const firstAntar = calculateAntardashas(firstLordName, currentStart, firstEnd);

  dashas.push({
    planet: firstLordName,
    startDate: currentStart.toISOString().slice(0, 10),
    endDate: firstEnd.toISOString().slice(0, 10),
    durationYears: parseFloat(firstLordRemainingYears.toFixed(2)),
    antardashas: firstAntar,
  });

  currentStart = new Date(firstEnd);

  for (let i = 1; i < 9; i++) {
    const lordIdx = (firstLordIndex + i) % 9;
    const lordInfo = DASHA_LORDS[lordIdx];

    const dashaEnd = new Date(currentStart);
    dashaEnd.setFullYear(dashaEnd.getFullYear() + lordInfo.years);

    const antardashas = calculateAntardashas(lordInfo.lord, currentStart, dashaEnd);

    dashas.push({
      planet: lordInfo.lord,
      startDate: currentStart.toISOString().slice(0, 10),
      endDate: dashaEnd.toISOString().slice(0, 10),
      durationYears: lordInfo.years,
      antardashas,
    });

    currentStart = new Date(dashaEnd);
  }

  return dashas;
}

export function calculateAntardashas(mahadashaPlanet, startDate, endDate) {
  const mIndex = DASHA_LORDS.findIndex(d => d.lord === mahadashaPlanet);
  const mYears = DASHA_LORDS[mIndex].years;
  const totalDurationMs = endDate.getTime() - startDate.getTime();

  const antardashas = [];
  let currentStart = new Date(startDate);

  for (let i = 0; i < 9; i++) {
    const aIndex = (mIndex + i) % 9;
    const aLordInfo = DASHA_LORDS[aIndex];
    const fraction = (mYears * aLordInfo.years) / (120 * mYears);
    const durationMs = totalDurationMs * (aLordInfo.years / 120);

    const aEnd = new Date(currentStart.getTime() + durationMs);

    antardashas.push({
      planet: aLordInfo.lord,
      startDate: currentStart.toISOString().slice(0, 10),
      endDate: aEnd.toISOString().slice(0, 10),
      durationMonths: parseFloat(((aLordInfo.years * mYears) / 10).toFixed(1)),
    });

    currentStart = new Date(aEnd);
  }

  return antardashas;
}

export function getCurrentDasha(dashas, referenceDate = new Date()) {
  const refStr = referenceDate.toISOString().slice(0, 10);
  for (const dasha of dashas) {
    if (refStr >= dasha.startDate && refStr <= dasha.endDate) {
      let currentAntar = null;
      for (const antar of dasha.antardashas) {
        if (refStr >= antar.startDate && refStr <= antar.endDate) {
          currentAntar = antar;
          break;
        }
      }
      const startMs = new Date(dasha.startDate).getTime();
      const endMs = new Date(dasha.endDate).getTime();
      const refMs = referenceDate.getTime();
      const percentDone = Math.min(100, Math.max(0, Math.round(((refMs - startMs) / (endMs - startMs)) * 100)));

      return {
        planet: dasha.planet,
        startDate: dasha.startDate,
        endDate: dasha.endDate,
        percentDone,
        antardasha: currentAntar,
      };
    }
  }
  return dashas[0] || null;
}

export default {
  calculateVimshottariDasha,
  getCurrentDasha,
  calculateAntardashas,
  DASHA_LORDS,
};
