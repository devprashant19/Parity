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
    <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md sticky top-0 z-30 transition-colors dark:bg-[#131926]/90 dark:border-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#0F172A] text-white flex items-center justify-center shadow-sm dark:bg-white dark:text-[#0F172A] transition-transform duration-200 hover:scale-105">
            <ShieldCheck className="w-5 h-5 text-blue-400 dark:text-blue-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif-heading text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">
                Parity
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40">
                PoC Verification
              </span>
            </div>
            <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
              Packet Pre-Submission Consistency Verification
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3.5">
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-300">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Deterministic Engine Active</span>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle dark mode"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}
