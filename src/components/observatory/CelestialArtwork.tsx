import type { CanonicalBodyName } from '@/lib/astronomy/canonicalBodies';
import type { CelestialSelection } from '@/lib/astronomy/celestialCatalog';
import { constellationDisplayName } from '@/lib/astronomy/celestialCatalog';
import { CONSTELLATION_LINES, STARS, starColorFromBV, starRadiusFromMagnitude } from '@/lib/astronomy/stars';

interface CelestialArtworkProps {
  selection: CelestialSelection;
  className?: string;
}

const PLANET_PALETTES: Record<CanonicalBodyName, [string, string, string]> = {
  Sun: ['#FFF6B1', '#F2A93B', '#AF4D14'],
  Moon: ['#F6FAFF', '#AEBBD0', '#4C5973'],
  Mars: ['#F4B18D', '#B94C3E', '#5E211E'],
  Mercury: ['#D9E0E1', '#7D8B91', '#29343E'],
  Jupiter: ['#FFE0AC', '#B87555', '#5B2D2A'],
  Venus: ['#FFF0A8', '#D99E4A', '#815122'],
  Saturn: ['#F4E2BB', '#A98C69', '#51445F'],
  Rahu: ['#E6D6FF', '#8B5FC4', '#24183D'],
  Ketu: ['#FFE1C7', '#B9674D', '#3B1C23'],
};

const PLANET_DETAILS: Record<CanonicalBodyName, { ring?: boolean; bands?: boolean; craters?: boolean; sun?: boolean; node?: boolean }> = {
  Sun: { sun: true }, Moon: { craters: true }, Mars: { craters: true }, Mercury: { craters: true },
  Jupiter: { bands: true }, Venus: {}, Saturn: { ring: true }, Rahu: { node: true }, Ketu: { node: true },
};

const BACKGROUND_STARS = Array.from({ length: 42 }, (_, index) => ({
  x: 18 + ((index * 137) % 764),
  y: 18 + ((index * 83) % 424),
  r: index % 7 === 0 ? 1.8 : index % 3 === 0 ? 1.1 : 0.65,
  opacity: 0.28 + (index % 5) * 0.11,
}));

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function PlanetArtwork({ body }: { body: CanonicalBodyName }) {
  const prefix = `art-${safeId(body)}`;
  const [light, mid, dark] = PLANET_PALETTES[body];
  const details = PLANET_DETAILS[body];
  const bodyRadius = 116;

  if (details.node) {
    const ascending = body === 'Rahu';
    return (
      <svg viewBox="0 0 800 460" className="block h-full w-full" role="img" aria-label={`${body} orbital node diagram`}>
        <defs>
          <linearGradient id={`${prefix}-background`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#151638" /><stop offset="1" stopColor="#050611" /></linearGradient>
          <radialGradient id={`${prefix}-node`} cx="35%" cy="30%"><stop offset="0" stopColor={light} /><stop offset="0.55" stopColor={mid} /><stop offset="1" stopColor={dark} /></radialGradient>
          <filter id={`${prefix}-glow`}><feGaussianBlur stdDeviation="10" /></filter>
        </defs>
        <rect width="800" height="460" fill={`url(#${prefix}-background)`} />
        {BACKGROUND_STARS.map((star, index) => <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#E6E5FF" opacity={star.opacity} />)}
        <ellipse cx="400" cy="230" rx="270" ry="84" fill="none" stroke="#8B8BF5" strokeWidth="2" opacity="0.45" transform="rotate(-20 400 230)" />
        <ellipse cx="400" cy="230" rx="270" ry="84" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="4 9" transform="rotate(35 400 230)" />
        <circle cx="400" cy="230" r="28" fill="#F2C65D" opacity="0.12" filter={`url(#${prefix}-glow)`} />
        <circle cx="400" cy="230" r="7" fill="#F2C65D" />
        <line x1="300" y1="170" x2="500" y2="290" stroke="#F2C65D" strokeWidth="1.5" strokeDasharray="7 6" opacity="0.8" />
        <circle cx={ascending ? 438 : 362} cy={ascending ? 253 : 207} r="18" fill={`url(#${prefix}-node)`} stroke="#F8E8A9" strokeWidth="2" />
        <circle cx={ascending ? 438 : 362} cy={ascending ? 253 : 207} r="29" fill="none" stroke={ascending ? '#B38BEA' : '#E19A72'} strokeWidth="1" opacity="0.45" />
        <text x={ascending ? 438 : 362} y={ascending ? 258 : 212} textAnchor="middle" fill="#120D1B" fontSize="18" fontWeight="700">{ascending ? '☊' : '☋'}</text>
        <text x="400" y="54" textAnchor="middle" fill="#F4EBCB" fontFamily="JetBrains Mono, monospace" fontSize="12" letterSpacing="3">{ascending ? 'ASCENDING NODE' : 'DESCENDING NODE'}</text>
        <text x="400" y="414" textAnchor="middle" fill="#9FA8D0" fontFamily="JetBrains Mono, monospace" fontSize="11">MATHEMATICAL ECLIPTIC INTERSECTION · NOT A PHYSICAL PLANET</text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 800 460" className="block h-full w-full" role="img" aria-label={`${body} detailed celestial illustration`}>
      <defs>
        <linearGradient id={`${prefix}-background`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#151638" /><stop offset="0.55" stopColor="#080C22" /><stop offset="1" stopColor="#03050C" /></linearGradient>
        <radialGradient id={`${prefix}-sphere`} cx="32%" cy="25%" r="75%"><stop offset="0" stopColor={light} /><stop offset="0.56" stopColor={mid} /><stop offset="1" stopColor={dark} /></radialGradient>
        <linearGradient id={`${prefix}-shadow`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="0.72" stopColor="#02040B" stopOpacity="0.2" /><stop offset="1" stopColor="#02040B" stopOpacity="0.72" /></linearGradient>
        <filter id={`${prefix}-blur`}><feGaussianBlur stdDeviation="18" /></filter>
        <filter id={`${prefix}-glow`}><feGaussianBlur stdDeviation="6" /></filter>
        <clipPath id={`${prefix}-clip`}><circle cx="400" cy="238" r={bodyRadius} /></clipPath>
      </defs>
      <rect width="800" height="460" fill={`url(#${prefix}-background)`} />
      {BACKGROUND_STARS.map((star, index) => <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#E6E5FF" opacity={star.opacity} />)}
      <circle cx="400" cy="238" r="140" fill={mid} opacity="0.18" filter={`url(#${prefix}-blur)`} />

      {details.sun && <g opacity="0.75">{Array.from({ length: 24 }, (_, index) => { const angle = index * Math.PI / 12; const x1 = 400 + 128 * Math.cos(angle); const y1 = 238 + 128 * Math.sin(angle); const x2 = 400 + (146 + (index % 3) * 8) * Math.cos(angle); const y2 = 238 + (146 + (index % 3) * 8) * Math.sin(angle); return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke={light} strokeWidth={index % 2 ? 2 : 4} opacity="0.7" />; })}</g>}
      {details.ring && <g transform="rotate(-12 400 238)"><ellipse cx="400" cy="238" rx="178" ry="38" fill="none" stroke="#D9C58D" strokeWidth="17" opacity="0.32" /><ellipse cx="400" cy="238" rx="177" ry="37" fill="none" stroke="#F4E3B7" strokeWidth="3" opacity="0.85" /><ellipse cx="400" cy="238" rx="145" ry="27" fill="none" stroke="#665878" strokeWidth="9" opacity="0.62" /></g>}

      <circle cx="400" cy="238" r={bodyRadius} fill={`url(#${prefix}-sphere)`} />
      <g clipPath={`url(#${prefix}-clip)`}>
        {details.sun && <><circle cx="372" cy="206" r="42" fill="#FFF7C0" opacity="0.34" /><path d="M290 205 C335 172 372 196 416 180 S505 173 532 211" fill="none" stroke="#FFF4A5" strokeWidth="9" opacity="0.28" /><path d="M276 276 C336 252 362 293 423 267 S493 266 543 286" fill="none" stroke="#BE581D" strokeWidth="13" opacity="0.40" /></>}
        {details.bands && <><path d="M270 160 C330 178 457 150 536 174 L536 194 C442 173 347 200 270 183Z" fill="#F6D29A" opacity="0.78" /><path d="M270 206 C350 184 447 214 536 198 L536 221 C445 234 344 207 270 230Z" fill="#81463E" opacity="0.76" /><path d="M270 250 C352 226 438 266 536 242 L536 264 C442 285 344 250 270 276Z" fill="#F0C58B" opacity="0.68" /><path d="M270 301 C350 278 445 309 536 291 L536 317 C443 331 355 306 270 329Z" fill="#6E3C38" opacity="0.72" /><ellipse cx="452" cy="251" rx="23" ry="14" fill="#A84F45" opacity="0.9" /><ellipse cx="452" cy="251" rx="15" ry="7" fill="#D07A5A" opacity="0.75" /></>}
        {details.craters && <g fill={dark} opacity="0.32"><circle cx="345" cy="188" r="16" /><circle cx="424" cy="183" r="9" /><circle cx="458" cy="221" r="19" /><circle cx="342" cy="268" r="11" /><circle cx="405" cy="300" r="17" /><circle cx="476" cy="286" r="8" /><circle cx="373" cy="233" r="5" /></g>}
        {body === 'Venus' && <g fill="none" stroke="#FFE4A0" opacity="0.36"><path d="M288 178 C345 210 432 162 522 204" strokeWidth="10" /><path d="M278 225 C350 190 438 247 532 218" strokeWidth="7" /><path d="M285 283 C361 249 436 298 525 270" strokeWidth="13" /></g>}
        {body === 'Mars' && <path d="M350 132 Q400 175 444 145" fill="none" stroke="#FFE4D1" strokeWidth="10" opacity="0.55" />}
        {body === 'Moon' && <path d="M331 137 C370 160 370 312 450 338" fill="none" stroke="#FFFFFF" strokeWidth="8" opacity="0.20" />}
        <circle cx="400" cy="238" r={bodyRadius} fill={`url(#${prefix}-shadow)`} opacity="0.8" />
      </g>
      <circle cx="400" cy="238" r={bodyRadius} fill="none" stroke={light} strokeWidth="1.5" opacity="0.75" />
      <text x="400" y="54" textAnchor="middle" fill="#F4EBCB" fontFamily="JetBrains Mono, monospace" fontSize="12" letterSpacing="3">{body.toUpperCase()} · CELESTIAL PORTRAIT</text>
      <text x="400" y="414" textAnchor="middle" fill="#9FA8D0" fontFamily="JetBrains Mono, monospace" fontSize="11">ORIGINAL COSMICTANTRA VECTOR ARTWORK · NOT TO SCALE</text>
    </svg>
  );
}

function ConstellationArtwork({ id, highlightId }: { id: string; highlightId?: string }) {
  const members = STARS.filter(star => star.constellation === id);
  const highlightedStar = highlightId ? members.find(star => star.id === highlightId) : undefined;
  const relevantLines = CONSTELLATION_LINES.filter(([from, to]) => {
    const first = STARS.find(star => star.id === from);
    const second = STARS.find(star => star.id === to);
    return first?.constellation === id && second?.constellation === id;
  });
  const source = members.length ? members : STARS.slice(0, 3);
  const minRa = Math.min(...source.map(star => star.raHours));
  const maxRa = Math.max(...source.map(star => star.raHours));
  const minDec = Math.min(...source.map(star => star.decDeg));
  const maxDec = Math.max(...source.map(star => star.decDeg));
  const map = new Map(source.map(star => [star.id, {
    x: 140 + ((star.raHours - minRa) / Math.max(0.01, maxRa - minRa)) * 520,
    y: 335 - ((star.decDeg - minDec) / Math.max(0.01, maxDec - minDec)) * 215,
  }]));
  const fallbackLines = source.length > 1 ? source.slice(0, -1).map((star, index) => [star.id, source[index + 1].id] as [string, string]) : [];
  const lines = relevantLines.length ? relevantLines : fallbackLines;

  return (
    <svg viewBox="0 0 800 460" className="block h-full w-full" role="img" aria-label={`Detailed ${constellationDisplayName(id)} constellation sky map${highlightedStar ? ` highlighting ${highlightedStar.name}` : ''}`}>
      <defs>
        <linearGradient id={`constellation-${safeId(id)}`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#171941" /><stop offset="0.7" stopColor="#080D22" /><stop offset="1" stopColor="#03050C" /></linearGradient>
        <filter id={`constellation-glow-${safeId(id)}`}><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <rect width="800" height="460" fill={`url(#constellation-${safeId(id)})`} />
      {BACKGROUND_STARS.map((star, index) => <circle key={`background-${index}`} cx={star.x} cy={star.y} r={star.r} fill="#E6E5FF" opacity={star.opacity * 0.72} />)}
      <circle cx="400" cy="230" r="175" fill="none" stroke="#8B8BF5" strokeDasharray="2 12" opacity="0.18" />
      <circle cx="400" cy="230" r="116" fill="none" stroke="#D4AF37" strokeDasharray="1 10" opacity="0.14" />
      {lines.map(([from, to], index) => { const first = map.get(from); const second = map.get(to); if (!first || !second) return null; return <line key={`line-${index}`} x1={first.x} y1={first.y} x2={second.x} y2={second.y} stroke="#D4AF37" strokeWidth="2" opacity="0.72" />; })}
      {source.map(star => { const point = map.get(star.id); if (!point) return null; const highlighted = star.id === highlightId; const radius = Math.max(3, starRadiusFromMagnitude(star.magnitude) + 1); return <g key={star.id}><circle cx={point.x} cy={point.y} r={radius + (highlighted ? 16 : 7)} fill={highlighted ? '#F2C65D' : '#B9C7FF'} opacity={highlighted ? 0.28 : 0.18} filter={`url(#constellation-glow-${safeId(id)})`} /><circle cx={point.x} cy={point.y} r={radius + (highlighted ? 2 : 0)} fill={starColorFromBV(star.bv)} stroke={highlighted ? '#F8E8A9' : '#FFFFFF'} strokeWidth={highlighted ? 1.8 : 0.8} /><text x={point.x + 10} y={point.y - 9} fill={highlighted ? '#F8E8A9' : '#E9ECFF'} fontFamily="JetBrains Mono, monospace" fontSize={highlighted ? '11' : '10'}>{star.name}{highlighted ? ' · selected' : ''}</text></g>; })}
      <text x="400" y="54" textAnchor="middle" fill="#F4EBCB" fontFamily="JetBrains Mono, monospace" fontSize="12" letterSpacing="3">{constellationDisplayName(id).toUpperCase()} · FIXED-STAR PATTERN</text>
      <text x="400" y="414" textAnchor="middle" fill="#9FA8D0" fontFamily="JetBrains Mono, monospace" fontSize="11">J2000 BRIGHT-STAR ANCHORS · SCHEMATIC ORIENTATION MAP</text>
    </svg>
  );
}

export default function CelestialArtwork({ selection, className = '' }: CelestialArtworkProps) {
  const star = selection.kind === 'star' ? STARS.find(item => item.id === selection.id) : null;
  const artwork = selection.kind === 'planet'
    ? <PlanetArtwork body={selection.id} />
    : <ConstellationArtwork id={star?.constellation || selection.id} highlightId={star?.id} />;
  return <div className={`aspect-[16/9] overflow-hidden rounded-xl border border-white/10 bg-[#050711] ${className}`}>{artwork}</div>;
}
