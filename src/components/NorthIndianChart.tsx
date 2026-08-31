import React from 'react';

interface NorthIndianChartProps {
  kundali: any;
  size?: number;
  theme?: 'dark' | 'light';
  onPlanetClick?: (planetName: string, houseNumber: number) => void;
  selectedPlanet?: string | null;
}

const PLANET_ABBR = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

// Traditional Jyotish planet colors (classic North Indian chart convention).
const PLANET_COLOR = {
  Sun: '#E2571B', Moon: '#3B82F6', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#D97706', Venus: '#DB2777', Saturn: '#1F2937', Rahu: '#6D28D9', Ketu: '#B45309',
};

// Classic 12-rashi pastel tints for the light (traditional) theme — one
// colour per sign, kept light enough that text stays clearly readable.
const RASHI_TINT = [
  '#FFE8D6', // Mesh (Aries)
  '#FFF3CC', // Vrishabha (Taurus)
  '#E2F2D9', // Mithuna (Gemini)
  '#E9E1F7', // Karka (Cancer)
  '#FFE9C2', // Simha (Leo)
  '#E6F0E0', // Kanya (Virgo)
  '#DEE9F7', // Tula (Libra)
  '#F9DEDE', // Vrishchika (Scorpio)
  '#F7E8C4', // Dhanu (Sagittarius)
  '#DDEBE4', // Makara (Capricorn)
  '#DCE7F5', // Kumbha (Aquarius)
  '#EBE1F2', // Meena (Pisces)
];

const HOUSE_CELLS = [
  { id: 1,  path: 'M 50 0 L 100 50 L 50 100 L 0 50 Z',         cx: 50,  cy: 50  },
  { id: 2,  path: 'M 0 0 L 50 0 L 0 50 Z',                     cx: 15,  cy: 18  },
  { id: 3,  path: 'M 0 50 L 50 0 L 50 50 Z',                   cx: 28,  cy: 35  },
  { id: 4,  path: 'M 0 50 L 0 100 L 50 100 Z',                 cx: 15,  cy: 82  },
  { id: 5,  path: 'M 0 50 L 50 100 L 50 50 Z',                 cx: 28,  cy: 65  },
  { id: 6,  path: 'M 50 100 L 100 100 L 50 50 Z',              cx: 65,  cy: 82  },
  { id: 7,  path: 'M 50 50 L 100 50 L 50 100 Z',               cx: 72,  cy: 65  },
  { id: 8,  path: 'M 100 50 L 100 100 L 50 100 Z',             cx: 85,  cy: 82  },
  { id: 9,  path: 'M 50 50 L 100 50 L 100 0 Z',                cx: 72,  cy: 35  },
  { id: 10, path: 'M 50 0 L 100 0 L 100 50 Z',                 cx: 85,  cy: 18  },
  { id: 11, path: 'M 0 0 L 50 0 L 50 50 Z',                   cx: 28,  cy: 18  },
  { id: 12, path: 'M 50 0 L 100 0 L 50 50 Z',                 cx: 65,  cy: 18  },
];

/**
 * North Indian style D1 (Rashi) chart in traditional colours — ivory ground,
 * pastel sign tints, saffron Lagna cell, dark-brown rulings and bold planet
 * glyphs for easy readability.
 * Planets are tappable: `onPlanetClick(planetName, houseNumber)` opens a
 * detail sheet in the parent. Optional `selectedPlanet` highlights a planet
 * inside the chart.
 */
export default function NorthIndianChart({
  kundali,
  size = 320,
  theme = 'light',
  onPlanetClick,
  selectedPlanet,
}: NorthIndianChartProps) {
  if (!kundali) return null;

  const { houses, lagna } = kundali;
  const isDark = theme === 'dark';
  const bg = isDark ? '#0D0A1E' : '#FDF6E7';
  const stroke = isDark ? '#6B46C1' : '#5B4636';
  const lagnaHighlight = isDark ? '#7C3AED' : '#C2410C';
  const houseNumColor = isDark ? '#9CA3AF' : '#A0856B';
  const rasiNameColor = isDark ? '#A78BFA' : '#6B4E2E';
  const lagnaCellFill = isDark ? '#1E1040' : '#F9DCA8';

  function getHouseContent(houseNum: number) {
    const house = (houses ?? []).find((h: any) => h.number === houseNum);
    return house || { planets: [], rasiName: '' };
  }

  const interactive = typeof onPlanetClick === 'function';

  return (
    <div style={{ display: 'inline-block', filter: isDark ? 'drop-shadow(0 4px 24px rgba(124,58,237,0.3))' : 'drop-shadow(0 3px 14px rgba(91,70,54,0.18))' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ display: 'block' }}
      >
        <rect width="100" height="100" fill={bg} rx="2" />

        {HOUSE_CELLS.map(cell => {
          const house = getHouseContent(cell.id);
          const isLagna = cell.id === 1;
          const tint = RASHI_TINT[(house.rasiId ?? cell.id - 1) % 12];

          return (
            <g key={cell.id}>
              <path
                d={cell.path}
                fill={isLagna ? lagnaCellFill : (isDark ? 'transparent' : tint)}
                stroke={isLagna ? lagnaHighlight : stroke}
                strokeWidth={isLagna ? 0.9 : 0.55}
                opacity={isLagna ? 1 : (isDark ? 0.9 : 0.85)}
              />
              <text
                x={cell.cx}
                y={cell.cy - 4}
                textAnchor="middle"
                fontSize="3.6"
                fill={houseNumColor}
                fontFamily="serif"
                fontWeight="bold"
                opacity={0.8}
              >
                {cell.id}
              </text>
              <text
                x={cell.cx}
                y={cell.cy + 0.5}
                textAnchor="middle"
                fontSize="3.3"
                fill={isDark ? '#A78BFA' : rasiNameColor}
                fontFamily="serif"
                fontWeight="bold"
              >
                {house.rasiName?.slice(0, 3)}
              </text>
              {house.planets?.map((planet: any, pi: number) => {
                const planetName = typeof planet === 'string' ? planet : (planet?.name || '');
                const isSelected = selectedPlanet === planetName;
                // Overlap-safe planet grid: two-char monospace glyphs are
                // ~1.2em wide, so columns are 5.5 apart and rows 4.5 apart;
                // font size steps down as the house gets crowded.
                const count = house.planets?.length ?? 0;
                const fontSize = count > 6 ? 3.0 : count > 3 ? 3.4 : 3.9;
                const colStep = 5.5;
                const rowStep = count > 6 ? 3.9 : 4.5;
                const col = pi % 3;
                const row = Math.floor(pi / 3);
                const dx = (col - 1) * colStep;
                const dy = cell.cy + 5.5 + row * rowStep;
                return (
                  <g
                    key={typeof planet === 'string' ? `${planet}-${pi}` : `${planetName}-${pi}`}
                    onClick={interactive ? (e) => {
                      e.stopPropagation();
                      onPlanetClick(planetName, cell.id);
                    } : undefined}
                    style={{
                      cursor: interactive ? 'pointer' : 'default',
                    }}
                  >
                    {isSelected && (
                      <circle cx={cell.cx + dx} cy={dy} r="4.4" fill="none" stroke={lagnaHighlight} strokeWidth="0.8" />
                    )}
                    <text
                      x={cell.cx + dx}
                      y={dy}
                      textAnchor="middle"
                      fontSize={isDark ? fontSize - 0.7 : fontSize}
                      fill={(PLANET_COLOR as Record<string, string>)[planetName] || (isDark ? '#ccc' : '#7C3AED')}
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {(PLANET_ABBR as Record<string, string>)[planetName] || (typeof planetName === 'string' ? planetName.slice(0, 2) : '')}
                    </text>
                  </g>
                );
              })}
              {isLagna && (
                <text
                  x={cell.cx}
                  y={cell.cy - 8}
                  textAnchor="middle"
                  fontSize="3"
                  fill={lagnaHighlight}
                  fontFamily="serif"
                  fontWeight="bold"
                >
                  Asc
                </text>
              )}
            </g>
          );
        })}

        <rect
          x="0.3" y="0.3" width="99.4" height="99.4"
          fill="none" stroke={stroke} strokeWidth="0.8" rx="1.5"
        />

        <line x1="0" y1="0" x2="100" y2="100" stroke={stroke} strokeWidth="0.4" opacity="0.3" />
        <line x1="100" y1="0" x2="0" y2="100" stroke={stroke} strokeWidth="0.4" opacity="0.3" />
        <line x1="50" y1="0" x2="50" y2="100" stroke={stroke} strokeWidth="0.4" opacity="0.3" />
        <line x1="0" y1="50" x2="100" y2="50" stroke={stroke} strokeWidth="0.4" opacity="0.3" />
      </svg>
    </div>
  );
}
