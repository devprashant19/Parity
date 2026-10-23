'use client';

import React, { useState } from 'react';
import { Download, AlertCircle, CheckCircle2, ShieldAlert, FileText, Check } from 'lucide-react';
import { FieldComparison } from '@/lib/compare/types';
import { generateFixPlan } from '@/lib/fixplan/generator';
import { exportToCsv } from '@/lib/fixplan/exporter';

export interface FixListProps {
  fields: FieldComparison[];
  onSelectField?: (fieldId: string) => void;
}

export function FixList({ fields, onSelectField }: FixListProps) {
  const fixPlan = generateFixPlan(fields);
  const [downloading, setDownloading] = useState(false);

  const handleExportCsv = () => {
    setDownloading(true);
    const csvData = exportToCsv(fields);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parity-fix-list-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 800);
  };

  return (
    <div className="bg-white dark:bg-[#121620] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#ef4d23] font-medium text-xs">Step 3</span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">Action Items</span>
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white mt-0.5">
            Prioritized Fix Plan
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {fixPlan.totalActions > 0
              ? `${fixPlan.totalActions} item(s) to resolve before submission`
              : 'All fields verified consistent across documents'}
          </p>
        </div>

        {/* Orange Export Pill */}
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 bg-[#ef4d23] hover:bg-[#e03d13] text-white rounded-full pl-3.5 pr-1.5 py-1.5 text-xs font-medium transition-all shadow-xs cursor-pointer group shrink-0"
        >
          <span>{downloading ? 'Exported' : 'Export CSV'}</span>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
            {downloading ? (
              <Check className="w-3 h-3 text-white" />
            ) : (
              <Download className="w-3 h-3 text-white" />
            )}
          </span>
        </button>
      </div>

      {/* 1. Fix Before Submitting */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
          <ShieldAlert className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Fix Before Submitting ({fixPlan.fixBeforeSubmitting.length})</span>
        </div>

        {fixPlan.fixBeforeSubmitting.length === 0 ? (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 italic bg-[#f5f2ee] dark:bg-[#182030] p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-700">
            No unresolved high-priority conflicts remaining.
          </p>
        ) : (
          <div className="space-y-2">
            {fixPlan.fixBeforeSubmitting.map((item) => (
              <div
                key={item.field_id}
                onClick={() => onSelectField?.(item.field_id)}
                className="p-3 bg-red-50/70 dark:bg-red-950/20 border border-red-200/70 dark:border-red-900/50 rounded-xl cursor-pointer hover:bg-red-100/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-red-900 dark:text-red-200">
                    {item.instruction}
                  </h4>
                  <span className="text-[10px] font-medium text-red-700 bg-red-100 dark:bg-red-900/60 dark:text-red-300 px-2 py-0.5 rounded-full">
                    {item.field_label}
                  </span>
                </div>
                <p className="text-[11px] text-red-800/80 dark:text-red-300/80 mt-1 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Needs Manual Review */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
          <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Needs Manual Review ({fixPlan.needsManualReview.length})</span>
        </div>

        {fixPlan.needsManualReview.length === 0 ? (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 italic bg-[#f5f2ee] dark:bg-[#182030] p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-700">
            No ambiguous extractions or review items.
          </p>
        ) : (
          <div className="space-y-2">
            {fixPlan.needsManualReview.map((item) => (
              <div
                key={item.field_id}
                onClick={() => onSelectField?.(item.field_id)}
                className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 rounded-xl cursor-pointer hover:bg-amber-100/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    {item.instruction}
                  </h4>
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-100 dark:bg-amber-900/60 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    {item.field_label}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Consistent Fields */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Consistent Fields ({fixPlan.consistent.length})</span>
        </div>

        <div className="space-y-1.5">
          {fixPlan.consistent.map((item) => (
            <div
              key={item.field_id}
              onClick={() => onSelectField?.(item.field_id)}
              className="px-3 py-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl flex items-center justify-between cursor-pointer hover:bg-emerald-100/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-emerald-950 dark:text-emerald-200">
                  {item.field_label}
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                Match Verified
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed italic">
        <strong>Deterministic Boundary:</strong> Parity compares citations across submitted pages. It flags clerical discrepancies to save review time.
      </div>
    </div>
  );
}
