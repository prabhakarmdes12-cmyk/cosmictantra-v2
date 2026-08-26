import type { CanonicalBodyName } from './canonicalBodies';
import { CONSTELLATION_LINES, STARS } from './stars';

export type CelestialSelection =
  | { kind: 'planet'; id: CanonicalBodyName }
  | { kind: 'constellation'; id: string }
  | { kind: 'star'; id: string };

export interface CelestialDetail {
  id: string;
  kind: CelestialSelection['kind'];
  displayName: string;
  sanskritName?: string;
  symbol: string;
  eyebrow: string;
  imageAlt: string;
  astronomy: string;
  vedicLens?: string;
  story?: string;
  featuredStars?: string[];
  imageCredit: string;
  accent: string;
}

export const PLANET_DETAILS: Record<CanonicalBodyName, CelestialDetail> = {
  Sun: {
    id: 'Sun', kind: 'planet', displayName: 'Sun', sanskritName: 'Surya', symbol: '☉', eyebrow: 'The star at the centre',
    imageAlt: 'Stylised detailed illustration of the Sun with a textured corona',
    astronomy: 'The Sun is the daylight anchor of the local sky. Its apparent longitude defines the seasonal ecliptic and is the first coordinate used in a Panchang tithi.',
    vedicLens: 'Surya represents vitality, clarity, authority and the light by which intention becomes action.',
    imageCredit: 'Original CosmicTantra vector artwork', accent: '#F2B84B',
  },
  Moon: {
    id: 'Moon', kind: 'planet', displayName: 'Moon', sanskritName: 'Chandra', symbol: '☽', eyebrow: 'Earth’s changing companion',
    imageAlt: 'Stylised detailed illustration of the Moon with craters and a silver rim light',
    astronomy: 'The Moon moves quickly across the ecliptic. Its relationship with the Sun drives tithi, phase, nakshatra and the most visible night-to-night change.',
    vedicLens: 'Chandra is the manas: memory, feeling, receptivity and the rhythm through which a moment is experienced.',
    imageCredit: 'Original CosmicTantra vector artwork', accent: '#DCE8F6',
  },
  Mars: {
    id: 'Mars', kind: 'planet', displayName: 'Mars', sanskritName: 'Mangala', symbol: '♂', eyebrow: 'The red wanderer',
    imageAlt: 'Stylised detailed illustration of Mars with rust-coloured terrain and polar cap',
    astronomy: 'Mars is an outer planet with a visibly slower apparent motion. Its warm colour and retrograde loops make it a distinctive object in a long observation sequence.',
    vedicLens: 'Mangala is courage, initiative, engineering, boundaries and the disciplined use of force.',
    imageCredit: 'Original CosmicTantra vector artwork', accent: '#E2745A',
  },
  Mercury: {
    id: 'Mercury', kind: 'planet', displayName: 'Mercury', sanskritName: 'Budha', symbol: '☿', eyebrow: 'The quick inner planet',
    imageAlt: 'Stylised detailed illustration of Mercury with a cratered graphite surface',
    astronomy: 'Mercury stays close to the Sun in the sky and changes longitude quickly. It is often best understood through elongation, not as a midnight object.',
    vedicLens: 'Budha signifies language, analysis, trade, curiosity and the ability to connect signals into meaning.',
    imageCredit: 'Original CosmicTantra vector artwork', accent: '#86C7B8',
  },
  Jupiter: {
    id: 'Jupiter', kind: 'planet', displayName: 'Jupiter', sanskritName: 'Guru', symbol: '♃', eyebrow: 'The giant with cloud bands',
    imageAlt: 'Stylised detailed illustration of Jupiter with layered cloud bands and a Great Red Spot',
    astronomy: 'Jupiter is the largest planet in the Solar System and a bright, slow-moving outer graha. Its long transit makes it especially legible in the Time Machine and Gochara views.',
    vedicLens: 'Guru represents wisdom, teachers, expansion, generosity and dharma—the orientation that makes growth meaningful.',
    imageCredit: 'Original CosmicTantra vector artwork', accent: '#D8A16B',
  },
  Venus: {
    id: 'Venus', kind: 'planet', displayName: 'Venus', sanskritName: 'Shukra', symbol: '♀', eyebrow: 'The bright evening star',
    imageAlt: 'Stylised detailed illustration of Venus with luminous amber cloud layers',
    astronomy: 'Venus is an inner planet and one of the brightest objects after the Sun and Moon. Its position is constrained by the Sun, producing memorable dawn and dusk apparitions.',
    vedicLens: 'Shukra is refinement, relationship, pleasure, art, agreement and the intelligence of value.',
    imageCredit: 'Original CosmicTantra vector artwork', accent: '#F5B7D2',
  },
  Saturn: {
    id: 'Saturn', kind: 'planet', displayName: 'Saturn', sanskritName: 'Shani', symbol: '♄', eyebrow: 'The ringed timekeeper',
    imageAlt: 'Stylised detailed illustration of Saturn with luminous rings and blue shadow',
    astronomy: 'Saturn is a distant gas giant whose slow apparent motion makes its sign changes important in a long baseline. Its rings make it instantly recognisable in the instrument.',
    vedicLens: 'Shani is time, consequence, responsibility, patience and the steady work of making structure durable.',
    imageCredit: 'Original CosmicTantra vector artwork', accent: '#AFA6D9',
  },
  Rahu: {
    id: 'Rahu', kind: 'planet', displayName: 'Rahu', sanskritName: 'Rahu', symbol: '☊', eyebrow: 'Ascending lunar node',
    imageAlt: 'Stylised orbital diagram of Rahu, the ascending lunar node',
    astronomy: 'Rahu is a calculated intersection of the Moon’s orbit and the ecliptic, not a physical planet. The Observatory uses the mean-node formula and keeps it exactly opposite Ketu.',
    vedicLens: 'Rahu is appetite, invention, disruption and the pull toward unfamiliar experience.',
    imageCredit: 'Original CosmicTantra orbital diagram', accent: '#B38BEA',
  },
  Ketu: {
    id: 'Ketu', kind: 'planet', displayName: 'Ketu', sanskritName: 'Ketu', symbol: '☋', eyebrow: 'Descending lunar node',
    imageAlt: 'Stylised orbital diagram of Ketu, the descending lunar node',
    astronomy: 'Ketu is the descending lunar node, calculated as Rahu plus 180 degrees. It has no physical surface, altitude or photograph; this panel is an explanatory diagram.',
    vedicLens: 'Ketu is release, discernment, inwardness and the subtraction that reveals what is essential.',
    imageCredit: 'Original CosmicTantra orbital diagram', accent: '#E19A72',
  },
};

const CONSTELLATION_NAMES: Record<string, string> = {
  And: 'Andromeda', Aql: 'Aquila', Ari: 'Aries', Aur: 'Auriga', Boo: 'Boötes',
  Car: 'Carina', Cas: 'Cassiopeia', Cen: 'Centaurus', CMi: 'Canis Minor', CMa: 'Canis Major',
  CrB: 'Corona Borealis', Cru: 'Crux', Cyg: 'Cygnus', Eri: 'Eridanus', Gem: 'Gemini',
  Gru: 'Grus', Her: 'Hercules', Hya: 'Hydra', Leo: 'Leo', Lib: 'Libra',
  Lyr: 'Lyra', Ori: 'Orion', Pav: 'Pavo', Peg: 'Pegasus', Per: 'Perseus',
  Phe: 'Phoenix', PsA: 'Piscis Austrinus', Sgr: 'Sagittarius', Sco: 'Scorpius',
  Ser: 'Serpens', Tau: 'Taurus', TrA: 'Triangulum Australe', UMa: 'Ursa Major',
  UMi: 'Ursa Minor', Vel: 'Vela', Vir: 'Virgo',
};

const CONSTELLATION_STORIES: Record<string, { story: string; vedicLens?: string }> = {
  Ori: {
    story: 'Orion is one of the easiest seasonal patterns to recognise: three belt stars form a clean line between bright Betelgeuse and Rigel.',
    vedicLens: 'Orion’s belt and surrounding stars sit near the ecliptic neighbourhood of Taurus and Gemini, making it a useful orientation landmark for sky learning.',
  },
  UMa: {
    story: 'The seven bright stars of the Great Bear form a familiar ladle-like pattern and point toward Polaris through the two bowl stars.',
    vedicLens: 'Ursa Major is a northern orientation figure rather than a Jyotish graha; use it to build a reliable relationship with direction and season.',
  },
  Cas: {
    story: 'Cassiopeia’s five-star W is a circumpolar marker for many northern observers and makes a graceful counterpoint to Ursa Major.',
    vedicLens: 'A fixed constellation is a visual reference. The Observatory keeps its astronomy story separate from sidereal rashi calculations.',
  },
  Sco: {
    story: 'Scorpius curves around Antares and Shaula, a dramatic low-southern pattern whose hook is especially striking on summer evenings.',
    vedicLens: 'Scorpius sits across the sidereal region associated with Vrishchika; the chart is an observation aid, not a replacement for a full chart reading.',
  },
  Cyg: {
    story: 'Cygnus, the Swan, stretches along the Milky Way. Deneb, Sadr and Gienah form the most visible spine in this compact catalogue.',
    vedicLens: 'The Milky Way context reminds us that a Jyotish coordinate is one layer of a much larger physical sky.',
  },
};

export function constellationDisplayName(id: string): string {
  return CONSTELLATION_NAMES[id] || id;
}

export function getConstellationDetail(id: string): CelestialDetail {
  const members = STARS.filter(star => star.constellation === id);
  const story = CONSTELLATION_STORIES[id];
  return {
    id,
    kind: 'constellation',
    displayName: constellationDisplayName(id),
    symbol: '✦',
    eyebrow: `${id} · fixed-star pattern`,
    imageAlt: `Detailed schematic sky map of the ${constellationDisplayName(id)} constellation`,
    astronomy: `This Observatory view uses ${members.length || 'the available'} bright-star anchor${members.length === 1 ? '' : 's'} from the Yale BSC-style catalogue. Lines are an orientation overlay, not boundaries in space.`,
    vedicLens: story?.vedicLens || 'Constellations provide a stable visual reference. Vedic rashi and Nakshatra positions are calculated separately from the moving ecliptic bodies.',
    story: story?.story || `${constellationDisplayName(id)} is shown as a bright-star orientation pattern. Tap the highlighted stars to keep learning the sky one anchor at a time.`,
    featuredStars: members.slice(0, 6).map(star => star.name),
    imageCredit: 'Original CosmicTantra vector sky map · catalogue coordinates',
    accent: '#8B8BF5',
  };
}

export function getStarDetail(id: string): CelestialDetail | null {
  const star = STARS.find(item => item.id === id);
  if (!star) return null;
  return {
    id: star.id,
    kind: 'star',
    displayName: star.name,
    symbol: '✦',
    eyebrow: `${star.constellation} · bright-star catalogue anchor`,
    imageAlt: `Detailed schematic field map highlighting ${star.name}`,
    astronomy: `${star.name} is stored as a J2000 bright-star anchor at right ascension ${star.raHours.toFixed(4)} hours and declination ${star.decDeg.toFixed(4)} degrees, with visual magnitude ${star.magnitude.toFixed(2)}. The local sky applies approximate precession before projecting it for the selected observer.`,
    story: 'Use this anchor to learn a real direction and seasonal pattern. Its point in the local sky is a calculated catalogue projection, not a camera frame or a precision astrometric measurement.',
    imageCredit: 'Original CosmicTantra vector sky map · catalogue coordinates',
    accent: '#8B8BF5',
  };
}

export function getCelestialDetail(selection: CelestialSelection): CelestialDetail {
  if (selection.kind === 'planet') return PLANET_DETAILS[selection.id];
  if (selection.kind === 'star') return getStarDetail(selection.id) || getConstellationDetail('unknown');
  return getConstellationDetail(selection.id);
}

export function constellationIds(): string[] {
  const ids = new Set<string>();
  STARS.forEach(star => ids.add(star.constellation));
  CONSTELLATION_LINES.forEach(([from, to]) => {
    const fromStar = STARS.find(star => star.id === from);
    const toStar = STARS.find(star => star.id === to);
    if (fromStar) ids.add(fromStar.constellation);
    if (toStar) ids.add(toStar.constellation);
  });
  return [...ids];
}

/** Resolve a share/deep-link payload without allowing arbitrary catalog ids into the detail sheet. */
export function parseCelestialSelection(id?: string, kind?: string): CelestialSelection | null {
  const value = id?.trim();
  if (!value) return null;

  if (kind === 'planet') {
    const body = (Object.keys(PLANET_DETAILS) as CanonicalBodyName[]).find(name => name.toLowerCase() === value.toLowerCase());
    return body ? { kind: 'planet', id: body } : null;
  }

  if (kind === 'constellation') {
    return constellationIds().includes(value) ? { kind: 'constellation', id: value } : null;
  }

  if (kind === 'star') {
    const star = STARS.find(item => item.id.toLowerCase() === value.toLowerCase() || item.name.toLowerCase() === value.toLowerCase());
    return star ? { kind: 'star', id: star.id } : null;
  }

  return null;
}
