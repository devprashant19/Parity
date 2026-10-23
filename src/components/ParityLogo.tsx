'use client';

import React from 'react';

export interface ParityLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export function ParityLogo({
  className = 'w-7 h-7',
  size,
  color = '#ef4d23',
}: ParityLogoProps) {
  // 8 circles around center (16,16) with radius 10 + 1 center circle
  const petalAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const radius = 10;
  const cx = 16;
  const cy = 16;
  const rCircle = 3.5;

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      fill={color}
      aria-hidden="true"
    >
      <circle cx={cx} cy={cy} r={rCircle} />
      {petalAngles.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = cx + radius * Math.cos(rad);
        const y = cy + radius * Math.sin(rad);
        return <circle key={deg} cx={x.toFixed(2)} cy={y.toFixed(2)} r={rCircle} />;
      })}
    </svg>
  );
}

export default ParityLogo;
