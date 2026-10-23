'use client';

import React, { useEffect } from 'react';

export function TopBar() {
  useEffect(() => {
    // Ensure clean light palette as light/dark mode switch is removed
    document.documentElement.classList.remove('dark');
    try {
      localStorage.removeItem('parity_theme_mode');
    } catch {
      // ignore
    }
  }, []);

  // 8 circles around (16,16) with radius 10 + 1 center circle
  const petalAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const radius = 10;
  const cx = 16;
  const cy = 16;
  const rCircle = 3.5;

  return (
    <header className="w-full flex justify-center pt-3 sm:pt-4 px-3 sm:px-4 z-30 sticky top-2">
      <div className="bg-white/95 backdrop-blur-md rounded-full shadow-sm border border-neutral-200/90 pl-3 pr-3 py-2 w-full max-w-[1000px] relative flex items-center justify-between transition-colors">
        {/* Left: Brand Identity with 8-Petal Flower */}
        <div className="flex items-center gap-3 shrink-0">
          <a href="#" className="flex items-center gap-2.5 focus:outline-none" aria-label="Parity Home">
            <svg
              viewBox="0 0 32 32"
              className="w-7 h-7 sm:w-8 sm:h-8"
              fill="#ef4d23"
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
            <span className="font-semibold text-base sm:text-lg tracking-tight text-neutral-900">
              Parity
            </span>
          </a>
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700">
            PoC Verification
          </span>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-[13px] text-neutral-700 font-medium">
          <a
            href="#documents"
            className="inline-flex items-center gap-1.5 text-neutral-900 font-semibold hover:text-[#ef4d23] transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4d23] inline-block" />
            Documents
          </a>
          <a href="#results" className="hover:text-[#ef4d23] transition-colors">
            Consistency Checks
          </a>
          <a href="#fixplan" className="hover:text-[#ef4d23] transition-colors">
            Fix Plan
          </a>
        </nav>

        {/* Right Cluster: Engine Status (No theme switch) */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-medium shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Engine Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
}
