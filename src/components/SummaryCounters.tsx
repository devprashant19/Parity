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
    <div className="space-y-3">
      {badgeText && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200 gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wide">
              {badgeText}
            </span>
            <span className="text-xs text-amber-800/80 dark:text-amber-300/80 hidden md:inline">
              (Precomputed offline for demo speed • zero external API calls)
            </span>
          </div>
          <span className="text-xs text-amber-800/80 dark:text-amber-300/80 font-medium shrink-0">
            5 cross-document checks evaluated
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {/* Conflicts Counter */}
        <div data-testid="counter-conflicts" className="bg-red-50/60 border border-red-200/80 rounded-xl p-4 transition-all dark:bg-red-950/20 dark:border-red-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-800 dark:text-red-300 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>Conflicts</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/60 px-1.5 py-0.5 rounded">
              High Risk
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono-val text-red-700 dark:text-red-400">
              {isAnalyzing ? '—' : conflicts}
            </span>
            <span className="text-xs text-red-600/80 dark:text-red-400/80">mismatches found</span>
          </div>
        </div>

        {/* Consistent Counter */}
        <div data-testid="counter-consistent" className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 transition-all dark:bg-emerald-950/20 dark:border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Consistent</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
              Verified
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono-val text-emerald-700 dark:text-emerald-400">
              {isAnalyzing ? '—' : consistent}
            </span>
            <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80">values match</span>
          </div>
        </div>

        {/* Needs Review Counter */}
        <div data-testid="counter-needs-review" className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 transition-all dark:bg-blue-950/20 dark:border-blue-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Needs Review</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
              Ambiguous
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono-val text-blue-700 dark:text-blue-400">
              {isAnalyzing ? '—' : needsReview}
            </span>
            <span className="text-xs text-blue-600/80 dark:text-blue-400/80">needs checking</span>
          </div>
        </div>
      </div>
    </div>
  );
}
