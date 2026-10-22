'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

export interface SummaryCountersProps {
  conflicts: number;
  consistent: number;
  needsReview: number;
  badgeText?: string;
  isAnalyzing?: boolean;
}

export function SummaryCounters({
  conflicts,
  consistent,
  needsReview,
  badgeText,
  isAnalyzing,
}: SummaryCountersProps) {
  return (
    <div className="space-y-3.5">
      {badgeText && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-200 gap-2 shadow-xs transition-all">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {badgeText}
            </span>
            <span className="text-xs text-amber-800 dark:text-amber-300 hidden md:inline">
              (Precomputed offline for instant demo • zero external API calls)
            </span>
          </div>
          <span className="text-xs text-amber-800 dark:text-amber-300 font-medium shrink-0">
            5 cross-document checks evaluated
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Conflicts Counter */}
        <div
          data-testid="counter-conflicts"
          className="bg-white dark:bg-[#131926] border border-red-200 dark:border-red-900/50 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-800 dark:text-red-300 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>Conflicts</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/70 border border-red-200 dark:border-red-900 px-2 py-0.5 rounded-full">
              High Risk
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono-val text-red-700 dark:text-red-400 tracking-tight">
              {isAnalyzing ? '—' : conflicts}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">mismatches found</span>
          </div>
        </div>

        {/* Consistent Counter */}
        <div
          data-testid="counter-consistent"
          className="bg-white dark:bg-[#131926] border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Consistent</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded-full">
              Verified
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono-val text-emerald-700 dark:text-emerald-400 tracking-tight">
              {isAnalyzing ? '—' : consistent}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">values match</span>
          </div>
        </div>

        {/* Needs Review Counter */}
        <div
          data-testid="counter-needs-review"
          className="bg-white dark:bg-[#131926] border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Needs Review</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded-full">
              Ambiguous
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono-val text-blue-700 dark:text-blue-400 tracking-tight">
              {isAnalyzing ? '—' : needsReview}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">needs checking</span>
          </div>
        </div>
      </div>
    </div>
  );
}
