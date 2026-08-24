import React from 'react';

const PLANET_ABBR = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

const PLANET_COLOR = {
  Sun: '#FF9933', Moon: '#B0C4DE', Mars: '#DC143C', Mercury: '#32CD32',
  Jupiter: '#FFD700', Venus: '#FF69B4', Saturn: '#708090', Rahu: '#9370DB', Ketu: '#CD853F',
};

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

export default function NorthIndianChart({ kundali, size = 320, theme = 'dark' }) {
  if (!kundali) return null;

  const { houses, lagna } = kundali;
  const isDark = theme === 'dark';
  const bg = isDark ? '#0D0A1E' : '#FFF8F0';
  const stroke = isDark ? '#6B46C1' : '#8B4513';
  const lagnaHighlight = isDark ? '#7C3AED' : '#D4870A';
  const houseNumColor = isDark ? '#9CA3AF' : '#A0856B';

  function getHouseContent(houseNum) {
    const house = houses?.find(h => h.number === houseNum);
    return house || { planets: [], rasiName: '' };
  }

  return (
    <div style={{ display: 'inline-block', filter: 'drop-shadow(0 4px 24px rgba(124,58,237,0.3))' }}>
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

          return (
            <g key={cell.id}>
              <path
                d={cell.path}
                fill={isLagna ? (isDark ? '#1E1040' : '#FFF0DC') : 'transparent'}
                stroke={isLagna ? lagnaHighlight : stroke}
                strokeWidth={isLagna ? 0.8 : 0.5}
                opacity={0.9}
              />
              <text
                x={cell.cx}
                y={cell.cy - 3.5}
                textAnchor="middle"
                fontSize="3.5"
                fill={houseNumColor}
                fontFamily="serif"
                opacity={0.7}
              >
                {cell.id}
              </text>
              <text
                x={cell.cx}
                y={cell.cy + 1}
                textAnchor="middle"
                fontSize="2.8"
                fill={isDark ? '#A78BFA' : '#8B4513'}
                fontFamily="sans-serif"
              >
                {house.rasiName?.slice(0, 3)}
              </text>
              {house.planets?.map((planet, pi) => (
                <text
                  key={planet}
                  x={cell.cx + (pi % 3 - 1) * 3.5}
                  y={cell.cy + 5.5 + Math.floor(pi / 3) * 3.5}
                  textAnchor="middle"
                  fontSize="3.2"
                  fill={PLANET_COLOR[planet] || '#ccc'}
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {PLANET_ABBR[planet] || planet.slice(0, 2)}
                </text>
              ))}
              {isLagna && (
                <text
                  x={cell.cx}
                  y={cell.cy - 7}
                  textAnchor="middle"
                  fontSize="2.5"
                  fill={lagnaHighlight}
                  fontFamily="sans-serif"
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
