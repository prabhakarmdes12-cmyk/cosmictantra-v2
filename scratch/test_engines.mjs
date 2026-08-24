import * as libEngine from '../src/lib/astrologyEngine.js';
import * as enginesEngine from '../src/engines/astrologyEngine.js';

const birthDate = '1995-06-15';
const birthTime = '10:30';
const latitude = 25.5941;
const longitude = 85.1376;
const timezone = 5.5;

console.log('--- TESTING SRC/LIB/ASTROLOGYENGINE.JS ---');
const libRes = libEngine.calculateKundali({
  birthDate,
  birthTime,
  latitude,
  longitude,
  timezone
});
console.log('Lagna:', libRes.lagna.rashiName, libRes.lagna.degreeStr, libRes.lagna.nakshatra, 'Pada:', libRes.lagna.pada);
console.log('Moon:', libRes.moon.rashiName, libRes.moon.degreeStr, libRes.moon.nakshatra, 'Pada:', libRes.moon.pada);
console.log('Sun:', libRes.planets.find(p => p.name === 'Sun').rashiName, libRes.planets.find(p => p.name === 'Sun').degreeStr);

console.log('\n--- TESTING SRC/ENGINES/ASTROLOGYENGINE.JS ---');
const engRes = enginesEngine.calculateKundali(birthDate, birthTime, latitude, longitude, timezone);
console.log('Lagna:', engRes.lagna.rasiName, engRes.lagna.degreeInRasi, engRes.lagna.nakshatra.name, 'Pada:', engRes.lagna.nakshatra.pada);
console.log('Moon:', engRes.planets.Moon.rasiName, engRes.planets.Moon.degreeInRasi, engRes.planets.Moon.nakshatra.name, 'Pada:', engRes.planets.Moon.nakshatra.pada);
console.log('Sun:', engRes.planets.Sun.rasiName, engRes.planets.Sun.degreeInRasi);
