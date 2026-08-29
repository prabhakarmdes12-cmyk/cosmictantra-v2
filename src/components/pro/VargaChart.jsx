'use client';

import React from 'react';

const PLANET_ABBR = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };
const PLANET_COLOR = { Sun: '#FF9933', Moon: '#7F9DC7', Mars: '#DC143C', Mercury: '#2F9E44', Jupiter: '#E8A317', Venus: '#E668A7', Saturn: '#708090', Rahu: '#9370DB', Ketu: '#CD853F' };

// North Indian diamond: fixed houses; sign numbers rotate with lagna.
const HOUSE_CELLS = [
  { id: 1, cx: 50, cy: 30 }, { id: 2, cx: 25, cy: 12 }, { id: 3, cx: 12, cy: 25 },
  { id: 4, cx: 30, cy: 50 }, { id: 5, cx: 12, cy: 75 }, { id: 6, cx: 25, cy: 88 },
  { id: 7, cx: 50, cy: 70 }, { id: 8, cx: 75, cy: 88 }, { id: 9, cx: 88, cy: 75 },
  { id: 10, cx: 70, cy: 50 }, { id: 11, cx: 88, cy: 25 }, { id: 12, cx: 75, cy: 12 },
];

const SIGN_SHORT = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

/**
 * Renders a divisional chart from computeVarga() output OR a full kundali (D1).
 * `chart` shape: { lagnaSign, houses:[{house, sign, planets:[names]}], code, name }
 */
export default function VargaChart({ chart, size = 300, theme = 'dark', title }) {
  if (!chart) return null;
  const isDark = theme === 'dark';
  const bg = isDark ? '#0D0A1E' : '#FFF8F0';
  const stroke = isDark ? '#6B46C1' : '#8B4513';
  const numColor = isDark ? '#9CA3AF' : '#A0856B';

  const houseFor = (n) => chart.houses.find((h) => h.house === n) || { sign: 0, planets: [] };

  return (
    <div className="inline-block">
      {title ? <div className="text-center text-xs font-medium mb-1 opacity-80">{title}</div> : null}
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
        <rect x="0" y="0" width="100" height="100" fill={bg} stroke={stroke} strokeWidth="0.6" />
        <line x1="0" y1="0" x2="100" y2="100" stroke={stroke} strokeWidth="0.4" />
        <line x1="100" y1="0" x2="0" y2="100" stroke={stroke} strokeWidth="0.4" />
        <polygon points="50,0 100,50 50,100 0,50" fill="none" stroke={stroke} strokeWidth="0.4" />
        {HOUSE_CELLS.map((cell) => {
          const h = houseFor(cell.id);
          return (
            <g key={cell.id}>
              <text x={cell.cx} y={cell.cy - 6} fontSize="3" fill={numColor} textAnchor="middle">{SIGN_SHORT[h.sign]}</text>
              {(h.planets || []).map((pName, i) => (
                <text
                  key={pName}
                  x={cell.cx - (h.planets.length - 1) * 3 + i * 6}
                  y={cell.cy + 1}
                  fontSize="3.4"
                  fontWeight="bold"
                  fill={PLANET_COLOR[pName] || numColor}
                  textAnchor="middle"
                >
                  {PLANET_ABBR[pName] || pName.slice(0, 2)}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
