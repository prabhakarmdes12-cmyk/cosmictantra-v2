'use client';

import React, { useState, useEffect } from 'react';

const KARMA_ASPECTS = [
  { label: 'Dharma', icon: '☸️', desc: 'Righteous duty', color: '#F59E0B', house: 9 },
  { label: 'Artha', icon: '💰', desc: 'Wealth & material', color: '#10B981', house: 2 },
  { label: 'Kama', icon: '❤️', desc: 'Love & desire', color: '#EC4899', house: 7 },
  { label: 'Moksha', icon: '🕉️', desc: 'Liberation', color: '#8B5CF6', house: 12 },
  { label: 'Karma', icon: '⚖️', desc: 'Past life debts', color: '#6366F1', house: 10 },
  { label: 'Bhakti', icon: '🙏', desc: 'Devotion', color: '#F97316', house: 5 },
  { label: 'Vidya', icon: '📚', desc: 'Knowledge', color: '#06B6D4', house: 4 },
  { label: 'Shakti', icon: '⚡', desc: 'Life force', color: '#EF4444', house: 1 },
];

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export default function KarmaWheel({ kundali, size = 320 }: { kundali?: any; size?: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.20;
  const labelR = size * 0.35;
  const spokes = size * 0.38;

  function getScore(houseNum: number) {
    if (!kundali) return 65;
    const house = kundali.houses?.find((h: any) => h.number === houseNum);
    if (!house) return 40;
    return Math.min(40 + (house.planets?.length || 0) * 15, 95);
  }

  const n = KARMA_ASPECTS.length;
  const angleStep = 360 / n;

  return (
    <div className="text-center font-body">
      <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-widest mb-3">
        ☸️ Soul Karma Radar Matrix
      </h3>

      <div className="inline-block relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(124,58,237,0.3)" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r={innerR} fill="rgba(3,1,8,0.7)" stroke="rgba(124,58,237,0.4)" strokeWidth="1.5" />

          {/* Polygon area */}
          <polygon
            points={KARMA_ASPECTS.map((aspect, i) => {
              const angle = i * angleStep;
              const score = getScore(aspect.house);
              const scoreR = innerR + (spokes - innerR) * (score / 100);
              const p = polarToXY(cx, cy, scoreR, angle);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="rgba(124,58,237,0.2)"
            stroke="#A78BFA"
            strokeWidth="1.5"
          />

          {KARMA_ASPECTS.map((aspect, i) => {
            const angle = i * angleStep;
            const score = getScore(aspect.house);
            const scoreR = innerR + (spokes - innerR) * (score / 100);
            const p = polarToXY(cx, cy, spokes, angle);
            const ps = polarToXY(cx, cy, scoreR, angle);
            const pLabel = polarToXY(cx, cy, labelR, angle);
            const isSelected = selected === i;

            return (
              <g key={i} onClick={() => setSelected(isSelected ? null : i)} className="cursor-pointer">
                <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={aspect.color} strokeWidth={isSelected ? 2 : 0.8} opacity={0.4} />
                <circle cx={ps.x} cy={ps.y} r={isSelected ? 6 : 4} fill={aspect.color} />
                <text x={pLabel.x} y={pLabel.y + 3} textAnchor="middle" fontSize="9" fill={isSelected ? '#FFFFFF' : aspect.color} fontWeight={isSelected ? 'bold' : 'normal'}>
                  {aspect.label}
                </text>
              </g>
            );
          })}

          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="16">🕉️</text>
        </svg>
      </div>

      {selected !== null && (
        <div className="mt-3 max-w-xs mx-auto p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs animate-fade-in">
          <div className="font-bold text-white flex items-center justify-center gap-1 mb-1">
            <span>{KARMA_ASPECTS[selected].icon}</span>
            <span style={{ color: KARMA_ASPECTS[selected].color }}>{KARMA_ASPECTS[selected].label}</span>
          </div>
          <p className="text-[11px] text-[#9CA3AF]">{KARMA_ASPECTS[selected].desc} (House {KARMA_ASPECTS[selected].house})</p>
          <div className="text-[10px] text-[#F59E0B] mt-1 font-semibold">Karma Score: {getScore(KARMA_ASPECTS[selected].house)}%</div>
        </div>
      )}
    </div>
  );
}
