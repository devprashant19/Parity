'use client';

import React, { useState } from 'react';
import { TrendingDown, TrendingUp, ChevronDown, X } from 'lucide-react';
import { Gauge } from './Gauge';

export const DashboardPreview: React.FC = () => {
  const [activeToggle1, setActiveToggle1] = useState<'Impressions' | 'Clicks'>('Impressions');
  const [activeToggle3, setActiveToggle3] = useState<'Video Clicks' | 'Video Starts'>('Video Clicks');

  return (
    <div className="w-full max-w-[880px] mx-auto px-3 sm:px-4">
      {/* Tray container */}
      <div className="bg-[#f5f2ee] rounded-3xl p-3 sm:p-5 lg:p-6 shadow-xl border border-white/40">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          
          {/* Card 1 — Clicks */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-100 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center text-[13px]">
                <span className="text-[#ef4d23] font-medium">Clicks</span>
                <span className="text-neutral-600 ml-1.5 font-normal">This Month</span>
              </div>

              {/* Big metric + trend pill */}
              <div className="flex items-center gap-2.5 mt-2.5">
                <span className="text-[28px] font-semibold text-neutral-900 leading-none tracking-tight">
                  6,896
                </span>
                <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 rounded-full px-2 py-0.5 text-[11px] font-medium">
                  <TrendingDown className="w-3 h-3 stroke-[2.5]" />
                  -3,382 (33%)
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">Compared to yesterday</p>

              {/* Gauge section */}
              <div className="mt-4">
                <p className="text-xs text-neutral-600 font-medium text-center mb-1">
                  Month Target achieved
                </p>
                <Gauge value={92} color="#ef4d23" showLabels min="389K" max="425K" />
              </div>
            </div>

            {/* Toggle pill */}
            <div className="bg-neutral-100 rounded-full p-1 flex mt-4 text-[12px] font-medium">
              <button
                type="button"
                onClick={() => setActiveToggle1('Impressions')}
                className={`flex-1 py-1 rounded-full text-center transition-all cursor-pointer ${
                  activeToggle1 === 'Impressions'
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Impressions
              </button>
              <button
                type="button"
                onClick={() => setActiveToggle1('Clicks')}
                className={`flex-1 py-1 rounded-full text-center transition-all cursor-pointer ${
                  activeToggle1 === 'Clicks'
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Clicks
              </button>
            </div>
          </div>

          {/* Card 2 — Form */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-100 flex flex-col gap-3 justify-between">
            <div className="space-y-3">
              {/* Dropdown 1 */}
              <div>
                <label className="block text-[12px] font-medium text-neutral-700 mb-1">
                  Show figures for
                </label>
                <button
                  type="button"
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs flex items-center justify-between text-neutral-800 bg-white hover:bg-neutral-50/70 transition-colors shadow-2xs text-left cursor-pointer"
                >
                  <span>This month</span>
                  <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
                </button>
              </div>

              {/* Dropdown 2 */}
              <div>
                <label className="block text-[12px] font-medium text-neutral-700 mb-1">
                  Compare period by
                </label>
                <button
                  type="button"
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs flex items-center justify-between text-neutral-800 bg-white hover:bg-neutral-50/70 transition-colors shadow-2xs text-left cursor-pointer"
                >
                  <span className="truncate">Month-to-date (MTD)</span>
                  <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
                </button>
              </div>

              {/* Input 1 */}
              <div>
                <label className="block text-[12px] font-medium text-neutral-700 mb-1">
                  Ste targets (This month)
                </label>
                <div className="flex items-center border border-neutral-200 rounded-lg px-3 py-1.5 text-xs bg-white text-neutral-800 focus-within:border-neutral-400 transition-colors shadow-2xs">
                  <span className="text-neutral-400 mr-2 font-mono text-xs">#</span>
                  <input
                    type="number"
                    defaultValue={10}
                    className="w-full bg-transparent focus:outline-none text-xs font-medium"
                    aria-label="Ste targets (This month)"
                  />
                </div>
              </div>

              {/* Input 2 */}
              <div>
                <label className="block text-[12px] font-medium text-neutral-700 mb-1">
                  Ste targets (This year)
                </label>
                <div className="flex items-center border border-neutral-200 rounded-lg px-3 py-1.5 text-xs bg-white text-neutral-800 focus-within:border-neutral-400 transition-colors shadow-2xs">
                  <span className="text-neutral-400 mr-2 font-mono text-xs">#</span>
                  <input
                    type="number"
                    defaultValue={100}
                    className="w-full bg-transparent focus:outline-none text-xs font-medium"
                    aria-label="Ste targets (This year)"
                  />
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center gap-3 pt-2 mt-1 text-xs">
              <button
                type="button"
                className="bg-[#ef4d23] hover:bg-[#e03d13] text-white rounded-lg px-5 py-2 font-medium transition-colors shadow-2xs cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                className="text-neutral-600 hover:text-neutral-900 underline underline-offset-2 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                className="ml-auto text-neutral-400 hover:text-neutral-700 cursor-pointer p-1 transition-colors"
                aria-label="Close form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 3 — Video Starts */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-100 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <div>
              {/* Header */}
              <div className="flex items-center text-[13px]">
                <span className="text-[#ef4d23] font-medium">Video Starts</span>
                <span className="text-neutral-600 ml-1.5 font-normal">today</span>
              </div>

              {/* Big metric + trend pill */}
              <div className="flex items-center gap-2.5 mt-2.5">
                <span className="text-[28px] font-semibold text-neutral-900 leading-none tracking-tight">
                  0
                </span>
                <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 text-[11px] font-medium">
                  <TrendingUp className="w-3 h-3 text-neutral-500 stroke-[2.5]" />
                  0
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">Compared to yesterday</p>

              {/* Gauge section */}
              <div className="mt-6 sm:mt-8">
                <Gauge value={68} color="#9ca3af" showLabels={false} />
              </div>
            </div>

            {/* Toggle pill */}
            <div className="bg-neutral-100 rounded-full p-1 flex mt-4 text-[12px] font-medium">
              <button
                type="button"
                onClick={() => setActiveToggle3('Video Clicks')}
                className={`flex-1 py-1 rounded-full text-center transition-all cursor-pointer ${
                  activeToggle3 === 'Video Clicks'
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Video Clicks
              </button>
              <button
                type="button"
                onClick={() => setActiveToggle3('Video Starts')}
                className={`flex-1 py-1 rounded-full text-center transition-all cursor-pointer ${
                  activeToggle3 === 'Video Starts'
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Video Starts
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
