'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Moon, Sun } from 'lucide-react';

export function TopBar() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <header className="border-b border-[#E2E2E8] bg-white/80 backdrop-blur-md sticky top-0 z-30 transition-colors dark:bg-[#1A1B20]/90 dark:border-[#26282E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#1A1A1E] text-white flex items-center justify-center shadow-sm dark:bg-white dark:text-[#1A1A1E]">
            <ShieldCheck className="w-5 h-5 text-amber-400 dark:text-amber-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif-heading text-xl font-bold tracking-tight text-[#1A1A1E] dark:text-[#ECECF1]">
                Parity
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                PoC Verification
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Packet Pre-Submission Consistency Checker
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Deterministic Engine Active</span>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle dark mode"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}
