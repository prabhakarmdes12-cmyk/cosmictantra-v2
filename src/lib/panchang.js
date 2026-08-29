import { calculateCelestialEphemeris } from './jyotish/celestialEngine';
/**
 * PROTECTED DOMAIN LOGIC: Panchang Deterministic Astronomical Engine
 * Calculates Tithi, Nakshatra, Yoga, Karana, Sunrise, Sunset, Rahu Kaal,
 * Yamaganda, Gulika, Abhijit Muhurat, Moon Phase, and Vedic Horas.
 */

const NAKSHATRAS = [
  { name: 'Ashwini', lord: 'Ketu', deity: 'Ashwini Kumaras', symbol: "Horse's Head" },
  { name: 'Bharani', lord: 'Venus', deity: 'Yama', symbol: 'Yoni' },
  { name: 'Krittika', lord: 'Sun', deity: 'Agni', symbol: 'Razor / Flame' },
  { name: 'Rohini', lord: 'Moon', deity: 'Brahma', symbol: 'Cart / Chariot' },
  { name: 'Mrigashira', lord: 'Mars', deity: 'Soma', symbol: "Deer's Head" },
  { name: 'Ardra', lord: 'Rahu', deity: 'Rudra', symbol: 'Teardrop' },
  { name: 'Punarvasu', lord: 'Jupiter', deity: 'Aditi', symbol: 'Bow and Quiver' },
  { name: 'Pushya', lord: 'Saturn', deity: 'Brihaspati', symbol: 'Flower / Cow Udder' },
  { name: 'Ashlesha', lord: 'Mercury', deity: 'Sarpas', symbol: 'Coiled Serpent' },
  { name: 'Magha', lord: 'Ketu', deity: 'Pitris', symbol: 'Royal Throne' },
  { name: 'Purva Phalguni', lord: 'Venus', deity: 'Bhaga', symbol: 'Front Legs of Bed' },
  { name: 'Uttara Phalguni', lord: 'Sun', deity: 'Aryaman', symbol: 'Back Legs of Bed' },
  { name: 'Hasta', lord: 'Moon', deity: 'Savitr', symbol: 'Open Hand' },
  { name: 'Chitra', lord: 'Mars', deity: 'Tvashtar', symbol: 'Bright Jewel' },
  { name: 'Swati', lord: 'Rahu', deity: 'Vayu', symbol: 'Young Shoot / Coral' },
  { name: 'Vishakha', lord: 'Jupiter', deity: 'Indragni', symbol: 'Triumphal Arch' },
  { name: 'Anuradha', lord: 'Saturn', deity: 'Mitra', symbol: 'Lotus / Staff' },
  { name: 'Jyeshtha', lord: 'Mercury', deity: 'Indra', symbol: 'Circular Amulet / Earring' },
  { name: 'Mula', lord: 'Ketu', deity: 'Nirriti', symbol: 'Tied Roots' },
  { name: 'Purva Ashadha', lord: 'Venus', deity: 'Apas', symbol: "Elephant's Tusk / Fan" },
  { name: 'Uttara Ashadha', lord: 'Sun', deity: 'Vishwadevas', symbol: 'Small Bed / Tusk' },
  { name: 'Shravana', lord: 'Moon', deity: 'Vishnu', symbol: 'Three Footprints / Ear' },
  { name: 'Dhanishta', lord: 'Mars', deity: 'Eight Vasus', symbol: 'Flute / Drum' },
  { name: 'Shatabhisha', lord: 'Rahu', deity: 'Varuna', symbol: '100 Physicians / Empty Circle' },
  { name: 'Purva Bhadrapada', lord: 'Jupiter', deity: 'Aja Ekapada', symbol: 'Two Front Legs of Bed' },
  { name: 'Uttara Bhadrapada', lord: 'Saturn', deity: 'Ahirbudhnya', symbol: 'Two Back Legs of Bed' },
  { name: 'Revati', lord: 'Mercury', deity: 'Pushan', symbol: 'Pair of Fish / Drum' }
];

const TITHIS = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya'
];

const YOGAS = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana',
  'Atiganda', 'Sukarma', 'Dhriti', 'Shoola', 'Ganda',
  'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
  'Indra', 'Vaidhriti'
];

const MOVABLE_KARANAS = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];

export const LUNAR_MASA_DATA = [
  { en: 'Chaitra', hi: 'चैत्र', sk: 'चैत्र' },
  { en: 'Vaishakha', hi: 'वैशाख', sk: 'वैशाख' },
  { en: 'Jyeshtha', hi: 'ज्येष्ठ', sk: 'ज्येष्ठ' },
  { en: 'Ashadha', hi: 'आषाढ़', sk: 'आषाढ' },
  { en: 'Shravana', hi: 'श्रावण', sk: 'श्रावण' },
  { en: 'Bhadrapada', hi: 'भाद्रपद', sk: 'भाद्रपद' },
  { en: 'Ashwin', hi: 'आश्विन', sk: 'आश्विन' },
  { en: 'Kartika', hi: 'कार्तिक', sk: 'कार्तिक' },
  { en: 'Margashirsha', hi: 'मार्गशीर्ष', sk: 'मार्गशीर्ष' },
  { en: 'Pausha', hi: 'पौष', sk: 'पौष' },
  { en: 'Magha', hi: 'माघ', sk: 'माघ' },
  { en: 'Phalguna', hi: 'फाल्गुन', sk: 'फाल्गुन' }
];

export const RITU_DATA = [
  { en: 'Vasanta (Spring)', hi: 'वसन्त ऋतु', sk: 'वसन्त ऋतौ' },
  { en: 'Grishma (Summer)', hi: 'ग्रीष्म ऋतु', sk: 'ग्रीष्म ऋतौ' },
  { en: 'Varsha (Monsoon)', hi: 'वर्षा ऋतु', sk: 'वर्षा ऋतौ' },
  { en: 'Sharad (Autumn)', hi: 'शरद ऋतु', sk: 'शरद् ऋतौ' },
  { en: 'Hemanta (Pre-Winter)', hi: 'हेमन्त ऋतु', sk: 'हेमन्त ऋतौ' },
  { en: 'Shishira (Winter)', hi: 'शिशिर ऋतु', sk: 'शिशिर ऋतौ' }
];

// Approximate Julian Day from Gregorian Date
function getJulianDate(date) {
  const time = date.getTime();
  return (time / 86400000) + 2440587.5;
}

// Lahiri Ayanamsha for epoch (approx 24.16° in 2026)
function getLahiriAyanamsha(jd) {
  const t = (jd - 2451545.0) / 36525;
  return 23.856 + (1.396 * t);
}

// Approximate Tropical Sun Longitude
function getSunLongitude(jd) {
  const d = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * d) % 360;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g * Math.PI / 180) + 0.020 * Math.sin(2 * g * Math.PI / 180)) % 360;
  return (L + 360) % 360;
}

// Approximate Tropical Moon Longitude
function getMoonLongitude(jd) {
  const d = jd - 2451545.0;
  const L = (218.316 + 13.176396 * d) % 360;
  const M = (134.963 + 13.064993 * d) % 360;
  const F = (93.272 + 13.229350 * d) % 360;
  const lons = L + 6.289 * Math.sin(M * Math.PI / 180) - 1.274 * Math.sin((M - 2 * F) * Math.PI / 180);
  return (lons + 360) % 360;
}

// Solar declination & Equation of Time for accurate Sunrise/Sunset
function getSunTimes(date, lat, lng, tz) {
  const startOfDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  
  // Declination (approx)
  const declination = -23.44 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180));
  const latRad = lat * (Math.PI / 180);
  const decRad = declination * (Math.PI / 180);
  
  // Zenith angle for sunrise/sunset (90.83 degrees for atmospheric refraction + sun disc)
  const zenith = 90.833 * (Math.PI / 180);
  
  const cosH = (Math.cos(zenith) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
  
  let hourAngle = 90;
  if (cosH >= -1 && cosH <= 1) {
    hourAngle = Math.acos(cosH) * (180 / Math.PI);
  }
  
  // Equation of time in minutes
  const b = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180);
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  
  // Solar noon in hours (UTC + tz)
  const solarNoon = (720 - 4 * lng - eot + tz * 60) / 60;
  
  const riseHours = solarNoon - (hourAngle * 4 / 60);
  const setHours = solarNoon + (hourAngle * 4 / 60);
  
  const sunrise = new Date(date);
  sunrise.setHours(Math.floor(riseHours), Math.floor((riseHours % 1) * 60), 0, 0);
  
  const sunset = new Date(date);
  sunset.setHours(Math.floor(setHours), Math.floor((setHours % 1) * 60), 0, 0);
  
  return { sunrise, sunset, solarNoonHours: solarNoon };
}

// Rahu Kalam, Yamaganda, Gulika Kalam windows based on standard Vedic 8-segment day division
const RAHU_FACTORS = [
  { rahu: 8, yama: 5, gulika: 7 }, // Sun (Sunday: 8th part = 4:30-6:00 pm approx)
  { rahu: 2, yama: 4, gulika: 6 }, // Mon
  { rahu: 7, yama: 3, gulika: 5 }, // Tue
  { rahu: 5, yama: 2, gulika: 4 }, // Wed
  { rahu: 6, yama: 1, gulika: 3 }, // Thu
  { rahu: 4, yama: 7, gulika: 2 }, // Fri
  { rahu: 3, yama: 6, gulika: 1 }, // Sat
];

export function calculatePanchang(date = new Date(), cityOrLat = { lat: 23.7957, lng: 86.4304, tz: 5.5, name: 'Dhanbad' }, maybeLng, maybeTz) {
  let city;
  if (typeof cityOrLat === 'number') {
    city = {
      lat: cityOrLat,
      lng: typeof maybeLng === 'number' ? maybeLng : 86.4304,
      tz: typeof maybeTz === 'number' ? maybeTz : 5.5,
      name: 'Location'
    };
  } else if (cityOrLat && typeof cityOrLat === 'object') {
    city = {
      lat: cityOrLat.lat ?? 23.7957,
      lng: cityOrLat.lng ?? cityOrLat.lon ?? 86.4304,
      tz: cityOrLat.tz ?? 5.5,
      name: cityOrLat.name ?? 'Location'
    };
  } else {
    city = { lat: 23.7957, lng: 86.4304, tz: 5.5, name: 'Dhanbad' };
  }
  // High-Precision Ephemeris Subsystem
  const ephem = calculateCelestialEphemeris({
    dateUtc: date,
    latitude: city.lat,
    longitude: city.lng,
    nodeMode: 'MEAN_NODE'
  });
  
  const jd = ephem.julianDayTT;
  const ayanamsha = ephem.ayanamsha.degrees;
  
  const tropSun = ephem.bodies.Sun.tropicalLongitude;
  const tropMoon = ephem.bodies.Moon.tropicalLongitude;
  
  const siderealSun = ephem.bodies.Sun.siderealLongitude;
  const siderealMoon = ephem.bodies.Moon.siderealLongitude;
  
  // 1. TITHI: (Moon - Sun) in steps of 12°
  const diff = (siderealMoon - siderealSun + 360) % 360;
  const tithiIndex = Math.floor(diff / 12);
  const tithiNum = (tithiIndex % 30) + 1;
  const paksha = tithiNum <= 15 ? 'Shukla Paksha' : 'Krishna Paksha';
  const tithiName = TITHIS[tithiNum - 1];
  const tithiProgress = ((diff % 12) / 12) * 100;
  
  // 2. NAKSHATRA: Moon longitude in steps of 13°20' (13.3333°)
  const nakshatraIndex = Math.floor(siderealMoon / (360 / 27));
  const nakshatraObj = NAKSHATRAS[nakshatraIndex % 27];
  const nakshatraProgress = ((siderealMoon % (360 / 27)) / (360 / 27)) * 100;
  const pada = Math.floor((siderealMoon % (360 / 27)) / (360 / 108)) + 1;
  
  // 3. YOGA: (Sun + Moon) in steps of 13°20'
  const yogaSum = (siderealSun + siderealMoon) % 360;
  const yogaIndex = Math.floor(yogaSum / (360 / 27));
  const yogaName = YOGAS[yogaIndex % 27];
  
  // 4. KARANA: Half of Tithi (steps of 6°)
  const karanaIndex = Math.floor(diff / 6);
  let karanaName = '';
  if (karanaIndex === 0) karanaName = 'Kintughna';
  else if (karanaIndex >= 57) {
    if (karanaIndex === 57) karanaName = 'Shakuni';
    else if (karanaIndex === 58) karanaName = 'Chatushpada';
    else karanaName = 'Naga';
  } else {
    karanaName = MOVABLE_KARANAS[(karanaIndex - 1) % 7];
  }

  // 4b. LUNAR MASA (MONTH) & SEASONS (RITU, AYANA)
  // Sidereal Sun Rashi index: 0 = Mesha, 1 = Vrishabha, ..., 4 = Simha, ..., 11 = Meena
  const sunRasiIndex = Math.floor(siderealSun / 30);
  const masaIndex = (sunRasiIndex + 1) % 12;
  const masaObj = LUNAR_MASA_DATA[masaIndex];

  // Ritu: 6 Vedic Ritus (2 months per Ritu) starting from Vasanta (Chaitra & Vaishakha)
  const rituIndex = Math.floor(masaIndex / 2) % 6;
  const rituObj = RITU_DATA[rituIndex];

  // Ayana: Uttarayana (Makara to Mithuna, index 9, 10, 11, 0, 1, 2) / Dakshinayana (Karka to Dhanu, index 3 to 8)
  const isUttarayana = (sunRasiIndex >= 9 || sunRasiIndex <= 2);
  const ayana = isUttarayana ? 'Uttarayana (Northward Sun)' : 'Dakshinayana (Southward Sun)';
  const ayanaHi = isUttarayana ? 'उत्तरायण' : 'दक्षिणायन';
  const ayanaSk = isUttarayana ? 'उत्तरायणे' : 'दक्षिणायने';

  const calYear = date.getFullYear();
  const vikramSamvat = calYear + 57;
  const shakaSamvat = calYear - 78;
  
  // 5. Sun times & planetary windows
  const { sunrise, sunset, solarNoonHours } = getSunTimes(date, city.lat, city.lng, city.tz);
  const dayDurationMs = sunset.getTime() - sunrise.getTime();
  const segmentDurationMs = dayDurationMs / 8;
  const weekday = date.getDay(); // 0 is Sunday
  
  const factors = RAHU_FACTORS[weekday];
  
  const rahuStart = new Date(sunrise.getTime() + (factors.rahu - 1) * segmentDurationMs);
  const rahuEnd = new Date(sunrise.getTime() + factors.rahu * segmentDurationMs);
  
  const yamaStart = new Date(sunrise.getTime() + (factors.yama - 1) * segmentDurationMs);
  const yamaEnd = new Date(sunrise.getTime() + factors.yama * segmentDurationMs);
  
  const gulikaStart = new Date(sunrise.getTime() + (factors.gulika - 1) * segmentDurationMs);
  const gulikaEnd = new Date(sunrise.getTime() + factors.gulika * segmentDurationMs);
  
  // Abhijit Muhurat: 8th of 15 daylight muhurats (around midday)
  const muhurat15DurationMs = dayDurationMs / 15;
  const abhijitStart = new Date(sunrise.getTime() + 7 * muhurat15DurationMs);
  const abhijitEnd = new Date(sunrise.getTime() + 8 * muhurat15DurationMs);
  
  // Brahma Muhurat: 2 muhurats (approx 96 mins) before sunrise
  const brahmaStart = new Date(sunrise.getTime() - 96 * 60 * 1000);
  const brahmaEnd = new Date(sunrise.getTime() - 48 * 60 * 1000);
  
  // Moon phase calculation
  const moonPhasePercent = ((diff <= 180 ? diff : 360 - diff) / 180) * 100;
  const moonPhaseName = diff === 0 ? 'New Moon (Amavasya)' :
                        diff < 90 ? 'Waxing Crescent' :
                        diff < 180 ? 'Waxing Gibbous' :
                        diff === 180 ? 'Full Moon (Purnima)' :
                        diff < 270 ? 'Waning Gibbous' : 'Waning Crescent';

  // Format time helpers
  const formatTime = (d) => {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  
  // Active Vedic Period determination
  const now = date.getTime();
  let currentPeriod = 'Day Window';
  let isAuspicious = true;
  
  if (now >= rahuStart.getTime() && now <= rahuEnd.getTime()) {
    currentPeriod = 'Rahu Kalam (Inauspicious — Avoid New Beginnings)';
    isAuspicious = false;
  } else if (now >= abhijitStart.getTime() && now <= abhijitEnd.getTime() && weekday !== 3) {
    currentPeriod = 'Abhijit Muhurat (Highly Auspicious)';
    isAuspicious = true;
  } else if (now >= brahmaStart.getTime() && now <= brahmaEnd.getTime()) {
    currentPeriod = 'Brahma Muhurat (Spiritual Contemplation)';
    isAuspicious = true;
  } else if (now >= yamaStart.getTime() && now <= yamaEnd.getTime()) {
    currentPeriod = 'Yamaganda Period';
    isAuspicious = false;
  } else if (now < sunrise.getTime()) {
    currentPeriod = 'Usha Kala (Pre-Dawn)';
  } else if (now > sunset.getTime()) {
    currentPeriod = 'Sandhya / Ratri (Night Period)';
  }

  // Calculate day progress percentage (from sunrise to sunset or full 24h)
  const dayStart = sunrise.getTime();
  const dayEnd = sunset.getTime();
  let solarArcProgress = 0;
  if (now <= dayStart) {
    solarArcProgress = 0;
  } else if (now >= dayEnd) {
    solarArcProgress = 100;
  } else {
    solarArcProgress = Math.min(100, Math.max(0, ((now - dayStart) / (dayEnd - dayStart)) * 100));
  }

  return {
    date: date.toISOString().split('T')[0],
    city: city.name,
    state: city.state,
    country: city.country,
    tithi: {
      number: tithiNum,
      name: tithiName,
      paksha,
      fullName: `${paksha} ${tithiName}`,
      progressPercent: Math.round(tithiProgress)
    },
    nakshatra: {
      name: nakshatraObj.name,
      lord: nakshatraObj.lord,
      deity: nakshatraObj.deity,
      symbol: nakshatraObj.symbol,
      pada,
      progressPercent: Math.round(nakshatraProgress)
    },
    yoga: {
      name: yogaName,
      number: yogaIndex + 1
    },
    karana: {
      name: karanaName
    },
    sun: {
      siderealLongitude: siderealSun.toFixed(2),
      sunrise: formatTime(sunrise),
      sunset: formatTime(sunset),
      sunriseDate: sunrise,
      sunsetDate: sunset
    },
    moon: {
      siderealLongitude: siderealMoon.toFixed(2),
      phase: moonPhaseName,
      illumination: Math.round(moonPhasePercent)
    },
    timings: {
      rahuKalam: `${formatTime(rahuStart)} – ${formatTime(rahuEnd)}`,
      rahuStart,
      rahuEnd,
      yamaganda: `${formatTime(yamaStart)} – ${formatTime(yamaEnd)}`,
      gulikaKalam: `${formatTime(gulikaStart)} – ${formatTime(gulikaEnd)}`,
      abhijitMuhurat: `${formatTime(abhijitStart)} – ${formatTime(abhijitEnd)}`,
      abhijitStart,
      abhijitEnd,
      brahmaMuhurat: `${formatTime(brahmaStart)} – ${formatTime(brahmaEnd)}`
    },
    currentPeriod,
    isAuspicious,
    solarArcProgress: Math.round(solarArcProgress),
    ayanamsha: ayanamsha.toFixed(4),
    masa: {
      name: masaObj.en,
      nameHi: masaObj.hi,
      nameSk: masaObj.sk,
      index: masaIndex,
      purnimanta: masaObj.hi,
      amanta: masaObj.hi
    },
    ritu: {
      name: rituObj.en,
      nameHi: rituObj.hi,
      nameSk: rituObj.sk,
      index: rituIndex
    },
    ayana: {
      name: ayana,
      nameHi: ayanaHi,
      nameSk: ayanaSk,
      isUttarayana
    },
    samvat: {
      vikram: vikramSamvat,
      shaka: shakaSamvat
    }
  };
}
