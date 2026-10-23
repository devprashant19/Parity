import React from 'react';

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
  const TOTAL_TICKS = 40;
  const activeCount = Math.min(TOTAL_TICKS, Math.max(0, Math.round((value / 100) * TOTAL_TICKS)));

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
    };
  });

  return (
    <div className="flex flex-col items-center w-full max-w-[260px] mx-auto">
      <svg
        viewBox="0 0 200 120"
        className="w-full h-auto overflow-visible"
        aria-label={`Gauge indicator at ${value}%`}
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
          />
        ))}
        <text
          x={100}
          y={105}
          textAnchor="middle"
          fill="#111827"
          style={{ fontSize: 22, fontWeight: 600 }}
        >
          {value}%
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
