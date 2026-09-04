'use client';

import React from 'react';

interface ChitiConnectVisualizerProps {
  isActive: boolean;
  colorScheme?: 'saffron' | 'emerald' | 'indigo';
  barsCount?: number;
}

export default function ChitiConnectVisualizer({
  isActive,
  colorScheme = 'saffron',
  barsCount = 21
}: ChitiConnectVisualizerProps) {
  // Pre-configured wave height patterns
  const heights = [
    25, 45, 70, 90, 60, 85, 100, 75, 95, 55, 80, 100, 65, 85, 90, 70, 50, 80, 60, 40, 25
  ];

  const colorClasses = {
    saffron: 'from-amber-600 via-[#D4AF37] to-amber-200',
    emerald: 'from-emerald-600 via-teal-400 to-emerald-200',
    indigo: 'from-indigo-600 via-purple-400 to-sky-200'
  }[colorScheme];

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-12 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/5 shadow-inner">
      {heights.slice(0, barsCount).map((h, i) => {
        const activeHeight = isActive ? h : 18;
        const animationDelay = `${(i % 5) * 0.15}s`;
        const duration = `${0.6 + (i % 3) * 0.2}s`;

        return (
          <div
            key={i}
            style={{
              height: `${activeHeight}%`,
              animationDelay,
              animationDuration: duration
            }}
            className={`w-1 sm:w-1.5 rounded-full bg-gradient-to-t ${colorClasses} transition-all duration-200 ${
              isActive ? 'animate-pulse opacity-90' : 'opacity-30'
            }`}
          />
        );
      })}
    </div>
  );
}
