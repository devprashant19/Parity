'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Moon, Sun, Sparkles } from 'lucide-react';

export function TopBar() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Initial theme hydration from localStorage or system preference
    const savedTheme = localStorage.getItem('parity_theme_mode');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedTheme ? savedTheme === 'dark' : prefersDark;

    setIsDark(initialDark);
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);

    // Apply smooth cross-fade animation class
    document.documentElement.classList.add('theme-transition');
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('parity_theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('parity_theme_mode', 'light');
    }

    // Remove transition helper after animation settles
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 280);
  };

  return (
    <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md sticky top-0 z-30 transition-colors duration-200 dark:bg-[#10141E]/90 dark:border-[#1F293D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Identity */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#0F172A] text-white flex items-center justify-center shadow-sm dark:bg-white dark:text-[#0F172A] transition-all duration-200 hover:scale-105 active:scale-95 cursor-default">
            <ShieldCheck className="w-5 h-5 text-blue-400 dark:text-blue-600 transition-colors" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif-heading text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] inline-flex items-center">
                Parity
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40 shadow-xs">
                PoC Verification
              </span>
            </div>
            <p className="text-xs text-[#475569] dark:text-[#94A3B8] transition-colors">
              Packet Pre-Submission Consistency Verification
            </p>
          </div>
        </div>

        {/* Engine Status & Complete Dark Mode Switch */}
        <div className="flex items-center space-x-3.5">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700 dark:bg-[#182030] dark:border-[#1F293D] dark:text-slate-200 shadow-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span>Deterministic Engine Active</span>
          </div>

          {/* Calibrated Theme Switcher */}
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="relative flex items-center h-9 p-1 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 dark:bg-[#182030] dark:hover:bg-[#1f293d] dark:border-[#2a3854] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active-press shadow-xs"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Obsidian Dark Theme'}
          >
            {/* Sliding Thumb */}
            <div
              className={`absolute top-1 bottom-1 w-7 rounded-full bg-white dark:bg-blue-600 shadow-sm transition-transform duration-250 ease-out flex items-center justify-center ${
                isDark ? 'translate-x-7 bg-blue-600 text-white' : 'translate-x-0 text-amber-500'
              }`}
            >
              {isDark ? (
                <Moon className="w-3.5 h-3.5 text-white transition-transform duration-200 rotate-0" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-500 transition-transform duration-200 rotate-0" />
              )}
            </div>

            {/* Background Icons */}
            <div className="flex items-center justify-between w-14 px-1.5 text-slate-400 dark:text-slate-500 select-none">
              <Sun className={`w-3.5 h-3.5 ${!isDark ? 'opacity-0' : 'opacity-60'}`} />
              <Moon className={`w-3.5 h-3.5 ${isDark ? 'opacity-0' : 'opacity-60'}`} />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
