'use client';

import React, { useEffect, useState, useRef } from 'react';

interface GaugeProps {
  value: number;
  color?: string;
  showLabels?: boolean;
  min?: string | number;
  max?: string | number;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  color = '#ef4d23',
  showLabels = false,
  min,
  max,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const currentValRef = useRef(displayValue);

  useEffect(() => {
    currentValRef.current = displayValue;
  }, [displayValue]);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 650;
    const startValue = currentValRef.current;
    const targetValue = value;

    if (startValue === targetValue) return;

    let animId: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (targetValue - startValue) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value]);

  const TOTAL_TICKS = 40;
  const activeCount = Math.min(TOTAL_TICKS, Math.max(0, Math.round((displayValue / 100) * TOTAL_TICKS)));

  const ticks = Array.from({ length: TOTAL_TICKS }, (_, i) => {
    // Angle from PI (180deg) to 2*PI (360deg)
    const angle = Math.PI + (i / (TOTAL_TICKS - 1)) * Math.PI;
    const rOuter = 80;
    const rInner = 70;
    const cx = 100;
    const cy = 100;

    const x1 = cx + rInner * Math.cos(angle);
    const y1 = cy + rInner * Math.sin(angle);
    const x2 = cx + rOuter * Math.cos(angle);
    const y2 = cy + rOuter * Math.sin(angle);

    const isActive = i < activeCount;

    return {
      id: i,
      x1,
      y1,
      x2,
      y2,
      stroke: isActive ? color : '#d4d4d8',
      opacity: isActive ? 1 : 0.45,
    };
  });

  return (
    <div className="flex flex-col items-center w-full max-w-[260px] mx-auto">
      <svg
        viewBox="0 0 200 120"
        className="w-full h-auto overflow-visible"
        aria-label={`Gauge indicator at ${displayValue}%`}
      >
        {ticks.map((tick) => (
          <line
            key={tick.id}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.stroke}
            strokeWidth={2.5}
            strokeLinecap="round"
            className="transition-all duration-300"
            style={{ opacity: tick.opacity }}
          />
        ))}
        <text
          x={100}
          y={105}
          textAnchor="middle"
          className="fill-neutral-900 dark:fill-white font-semibold text-[22px] transition-colors"
          style={{ fontSize: 22, fontWeight: 600 }}
        >
          {displayValue}%
        </text>
      </svg>

      {showLabels && (min !== undefined || max !== undefined) && (
        <div className="flex justify-between w-full max-w-[190px] text-[11px] text-neutral-500 font-medium px-1 -mt-1">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
};
