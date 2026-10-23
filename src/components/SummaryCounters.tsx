'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Gauge } from '@/app/components/Gauge';

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
  const total = conflicts + consistent + needsReview;
  const matchPercent = total > 0 ? Math.round((consistent / total) * 100) : 100;
  const gaugeColor = conflicts > 0 ? '#ef4d23' : '#10b981';

  return (
    <div className="space-y-4">
      {/* Sample Badge */}
      {badgeText && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#121620] border border-neutral-200/80 dark:border-neutral-800 shadow-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ef4d23] animate-pulse shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white">
              {badgeText}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden md:inline">
              (Deterministic engine • zero hallucination guarantee)
            </span>
          </div>
          <span className="text-xs text-[#ef4d23] font-medium shrink-0">
            5 cross-document field checks evaluated
          </span>
        </div>
      )}

      {/* 3-Column / 4-Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Card 1: Conflicts */}
        <div
          data-testid="counter-conflicts"
          className="bg-white dark:bg-[#121620] rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#ef4d23] font-medium">Discrepancies</span>
              <span className="text-neutral-500 dark:text-neutral-400 font-normal">This Packet</span>
            </div>
            <div className="flex items-center gap-2.5 mt-2.5">
              <span className="text-3xl text-[28px] font-semibold text-neutral-900 dark:text-white leading-none tracking-tight">
                {isAnalyzing ? '—' : conflicts}
              </span>
              <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300 rounded-full px-2 py-0.5 text-[11px] font-medium">
                <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                {conflicts > 0 ? `${conflicts} Conflicts` : 'Zero'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Cross-check mismatches</p>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 font-medium">
            Requires resolution before submit
          </div>
        </div>

        {/* Card 2: Consistency Match Gauge */}
        <div className="bg-white dark:bg-[#121620] rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#ef4d23] font-medium">Match Score</span>
              <span className="text-neutral-500 dark:text-neutral-400 font-normal">Deterministic</span>
            </div>
            <div className="mt-1">
              <Gauge
                value={isAnalyzing ? 0 : matchPercent}
                color={gaugeColor}
                showLabels
                min="0%"
                max="100%"
              />
            </div>
          </div>
          <p className="text-center text-[11px] text-neutral-500 font-medium mt-1">
            Packet Consistency Rate
          </p>
        </div>

        {/* Card 3: Consistent */}
        <div
          data-testid="counter-consistent"
          className="bg-white dark:bg-[#121620] rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#10b981] font-medium">Verified</span>
              <span className="text-neutral-500 dark:text-neutral-400 font-normal">Consistent</span>
            </div>
            <div className="flex items-center gap-2.5 mt-2.5">
              <span className="text-3xl text-[28px] font-semibold text-neutral-900 dark:text-white leading-none tracking-tight">
                {isAnalyzing ? '—' : consistent}
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full px-2 py-0.5 text-[11px] font-medium">
                <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                Values Match
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Identical claims cited</p>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Ready for institution intake
          </div>
        </div>

        {/* Card 4: Needs Review */}
        <div
          data-testid="counter-needs-review"
          className="bg-white dark:bg-[#121620] rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-amber-600 font-medium">Review Needed</span>
              <span className="text-neutral-500 dark:text-neutral-400 font-normal">Pending</span>
            </div>
            <div className="flex items-center gap-2.5 mt-2.5">
              <span className="text-3xl text-[28px] font-semibold text-neutral-900 dark:text-white leading-none tracking-tight">
                {isAnalyzing ? '—' : needsReview}
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded-full px-2 py-0.5 text-[11px] font-medium">
                <HelpCircle className="w-3 h-3 stroke-[2.5]" />
                Ambiguous
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Single citation or unclear</p>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 font-medium">
            Requires clerical inspection
          </div>
        </div>

      </div>
    </div>
  );
}
