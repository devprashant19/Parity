'use client';

import React from 'react';
import { Layers, Sliders, CheckCircle2, Sparkles, GraduationCap, DollarSign, Award } from 'lucide-react';
import { PacketPreset, PacketPresetId } from '@/lib/compare/types';
import { PACKET_PRESETS } from '@/lib/compare/custom';

interface PacketPresetSelectorProps {
  activePresetId: PacketPresetId;
  onSelectPreset: (presetId: PacketPresetId) => void;
  onOpenCustomEditor: () => void;
  customFieldCount?: number;
}

export const PacketPresetSelector: React.FC<PacketPresetSelectorProps> = ({
  activePresetId,
  onSelectPreset,
  onOpenCustomEditor,
  customFieldCount,
}) => {
  const getPresetIcon = (id: PacketPresetId) => {
    switch (id) {
      case 'scholarship':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'college_admission':
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case 'financial_aid':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      default:
        return <Layers className="w-4 h-4 text-neutral-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#121620] rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              Packet Presets & Custom Field Rules
              <span className="text-[11px] font-medium bg-[#ef4d23]/10 text-[#ef4d23] px-2 py-0.5 rounded-full">
                Slice C
              </span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Deterministic verification across 5 standard data types (name, date, amount, ID, text).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCustomEditor}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700 shrink-0 self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Custom Field Editor</span>
          {customFieldCount !== undefined && (
            <span className="ml-1 px-1.5 py-0.2 bg-neutral-200 dark:bg-neutral-700 text-[10px] rounded-full font-mono">
              {customFieldCount}
            </span>
          )}
        </button>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3.5">
        {PACKET_PRESETS.map((preset) => {
          const isSelected = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.id)}
              className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-[#ef4d23] bg-orange-50/40 dark:bg-[#ef4d23]/10 shadow-xs'
                  : 'border-neutral-200/70 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700">
                    {getPresetIcon(preset.id)}
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                    {preset.title}
                  </h4>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-[#ef4d23] shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2">
                {preset.description}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {preset.fields.map((f) => (
                  <span
                    key={f.id}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700"
                  >
                    {f.label} ({f.type})
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
