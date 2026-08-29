/**
 * PROTECTED DOMAIN LOGIC: Vimshottari Dasha Engine
 * Computes 120-year cyclical Vimshottari Mahadashas, Antardashas, and Pratyantardashas
 * from the exact natal Moon longitude and Nakshatra fraction.
 */

export const DASHA_LORDS = [
  { name: 'Ketu', nameHi: 'केतु', years: 7, color: '#ec4899' },
  { name: 'Venus', nameHi: 'शुक्र', years: 20, color: '#f43f5e' },
  { name: 'Sun', nameHi: 'सूर्य', years: 6, color: '#f59e0b' },
  { name: 'Moon', nameHi: 'चन्द्र', years: 10, color: '#38bdf8' },
  { name: 'Mars', nameHi: 'मंगल', years: 7, color: '#ef4444' },
  { name: 'Rahu', nameHi: 'राहु', years: 18, color: '#8b5cf6' },
  { name: 'Jupiter', nameHi: 'गुरु', years: 16, color: '#eab308' },
  { name: 'Saturn', nameHi: 'शनि', years: 19, color: '#64748b' },
  { name: 'Mercury', nameHi: 'बुध', years: 17, color: '#10b981' }
];

export function calculateVimshottariDasha(moonLongitude, birthDateStr, targetDate = new Date()) {
  const [bYear, bMonth, bDay] = birthDateStr.split('-').map(Number);
  const birthDate = new Date(bYear, bMonth - 1, bDay);
  
  // Nakshatra span is 13°20' = 13.333333°
  const nakSpan = 360 / 27;
  const nakIndex = Math.floor(moonLongitude / nakSpan);
  const nakProgressDeg = moonLongitude % nakSpan;
  const nakFractionRemaining = 1 - (nakProgressDeg / nakSpan);
  
  // Starting Dasha lord index
  const startingLordIndex = nakIndex % 9;
  const startingLord = DASHA_LORDS[startingLordIndex];
  
  // Starting Dasha balance in years
  const startingBalanceYears = startingLord.years * nakFractionRemaining;
  
  const mahadashas = [];
  let currentDate = new Date(birthDate);
  
  for (let i = 0; i < 9; i++) {
    const lordIdx = (startingLordIndex + i) % 9;
    const lord = DASHA_LORDS[lordIdx];
    const durationYears = i === 0 ? startingBalanceYears : lord.years;
    
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);
    const msToAdd = durationYears * 365.25 * 24 * 60 * 60 * 1000;
    endDate.setTime(endDate.getTime() + msToAdd);
    
    // Calculate Antardashas (sub-periods) for this Mahadasha
    const antardashas = [];
    let adCurrentDate = new Date(startDate);
    
    for (let j = 0; j < 9; j++) {
      const adLordIdx = (lordIdx + j) % 9;
      const adLord = DASHA_LORDS[adLordIdx];
      const adYears = (lord.years * adLord.years) / 120;
      const adActualYears = i === 0 ? (adYears * nakFractionRemaining) : adYears;
      
      const adStartDate = new Date(adCurrentDate);
      const adEndDate = new Date(adCurrentDate);
      adEndDate.setTime(adEndDate.getTime() + adActualYears * 365.25 * 24 * 60 * 60 * 1000);
      
      // Calculate Pratyantardashas (3rd level sub-periods)
      const pratyantardashas = [];
      let pdCurrentDate = new Date(adStartDate);
      for (let k = 0; k < 9; k++) {
        const pdLordIdx = (adLordIdx + k) % 9;
        const pdLord = DASHA_LORDS[pdLordIdx];
        const pdYears = (adActualYears * pdLord.years) / 120;
        
        const pdStartDate = new Date(pdCurrentDate);
        const pdEndDate = new Date(pdCurrentDate);
        pdEndDate.setTime(pdEndDate.getTime() + pdYears * 365.25 * 24 * 60 * 60 * 1000);
        
        pratyantardashas.push({
          lord: pdLord.name,
          lordHi: pdLord.nameHi,
          startDate: pdStartDate.toISOString().split('T')[0],
          endDate: pdEndDate.toISOString().split('T')[0],
          startFormatted: pdStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          endFormatted: pdEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
        
        pdCurrentDate = new Date(pdEndDate);
      }

      antardashas.push({
        lord: adLord.name,
        lordHi: adLord.nameHi,
        startDate: adStartDate.toISOString().split('T')[0],
        endDate: adEndDate.toISOString().split('T')[0],
        startFormatted: adStartDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        endFormatted: adEndDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        isCurrent: targetDate >= adStartDate && targetDate <= adEndDate,
        pratyantardashas
      });
      
      adCurrentDate = new Date(adEndDate);
    }
    
    const isCurrentMD = targetDate >= startDate && targetDate <= endDate;
    
    mahadashas.push({
      lord: lord.name,
      lordHi: lord.nameHi,
      totalNominalYears: lord.years,
      actualDurationYears: Number(durationYears.toFixed(2)),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      startFormatted: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      endFormatted: endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      color: lord.color,
      isCurrent: isCurrentMD,
      antardashas
    });
    
    currentDate = new Date(endDate);
  }
  
  const currentMD = mahadashas.find(m => m.isCurrent) || mahadashas[0];
  const currentAD = currentMD.antardashas.find(a => a.isCurrent) || currentMD.antardashas[0];
  
  return {
    birthDate: birthDateStr,
    startingBalance: `${startingBalanceYears.toFixed(1)} yrs of ${startingLord.name}`,
    currentMahadasha: currentMD.lord,
    currentAntardasha: currentAD.lord,
    currentPeriodString: `${currentMD.lord} / ${currentAD.lord}`,
    currentPeriodStringHi: `${currentMD.lordHi} / ${currentAD.lordHi}`,
    currentDateRange: `${currentMD.startFormatted} – ${currentMD.endFormatted}`,
    mahadashas
  };
}


/**
 * Backward compatibility: Finds active Dasha period for a reference date
 */
export function getCurrentDasha(dashasOrSchedule, referenceDate = new Date()) {
  const schedule = Array.isArray(dashasOrSchedule) 
    ? dashasOrSchedule 
    : dashasOrSchedule?.mahadashas || [];

  const refMs = referenceDate instanceof Date ? referenceDate.getTime() : new Date(referenceDate).getTime();
  const refStr = new Date(refMs).toISOString().slice(0, 10);

  for (const d of schedule) {
    const startMs = d.startDate instanceof Date ? d.startDate.getTime() : new Date(d.startDate || d.startFormatted).getTime();
    const endMs = d.endDate instanceof Date ? d.endDate.getTime() : new Date(d.endDate || d.endFormatted).getTime();

    if (refMs >= startMs && refMs <= endMs) {
      let currentAntar = null;
      if (Array.isArray(d.antardashas)) {
        for (const ad of d.antardashas) {
          const adStartMs = ad.startDate instanceof Date ? ad.startDate.getTime() : new Date(ad.startDate || ad.startFormatted).getTime();
          const adEndMs = ad.endDate instanceof Date ? ad.endDate.getTime() : new Date(ad.endDate || ad.endFormatted).getTime();
          if (refMs >= adStartMs && refMs <= adEndMs) {
            currentAntar = ad;
            break;
          }
        }
      }

      const percentDone = Math.min(100, Math.max(0, Math.round(((refMs - startMs) / (endMs - startMs)) * 100)));

      return {
        planet: d.lord || d.planet,
        startDate: d.startDate || d.startFormatted,
        endDate: d.endDate || d.endFormatted,
        percentDone,
        antardasha: currentAntar,
        currentPeriodString: `${d.lord || d.planet} - ${currentAntar?.lord || currentAntar?.planet || 'Period'}`
      };
    }
  }

  return schedule[0] || null;
}
