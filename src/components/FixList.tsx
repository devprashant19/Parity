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
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 dark:bg-[#10141E] dark:border-[#1F293D] transition-all duration-200 hover-card-lift">
      <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0] dark:border-[#1F293D]">
        <div>
          <h3 className="font-serif-heading text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Prioritized Fix Plan
          </h3>
          <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
            {fixPlan.totalActions > 0
              ? `${fixPlan.totalActions} action item(s) to verify before final submission`
              : 'All fields verified consistent across documents'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-slate-800 transition-all duration-200 shadow-xs hover:-translate-y-0.5 cursor-pointer dark:bg-white dark:text-[#0F172A] dark:hover:bg-slate-100 active-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 group"
        >
          {downloading ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 animate-checkmarkPop" />
          ) : (
            <Download className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          )}
          <span>{downloading ? 'Downloaded' : 'Export CSV'}</span>
        </button>
      </div>

      {/* 1. Fix Before Submitting */}
      <div>
        <div className="flex items-center space-x-1.5 text-xs font-bold text-red-700 dark:text-red-400 mb-2">
          <ShieldAlert className="w-4 h-4" />
          <span>Fix Before Submitting ({fixPlan.fixBeforeSubmitting.length})</span>
        </div>

        {fixPlan.fixBeforeSubmitting.length === 0 ? (
          <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-[#182030] p-3 rounded-xl border border-slate-200/60 dark:border-[#2A3854]">
            No unresolved high-priority conflicts remaining.
          </p>
        ) : (
          <div className="space-y-2">
            {fixPlan.fixBeforeSubmitting.map((item) => (
              <div
                key={item.field_id}
                onClick={() => onSelectField?.(item.field_id)}
                className="p-3.5 bg-red-50/70 border border-red-200/80 rounded-xl cursor-pointer hover:bg-red-100/70 hover:border-red-300 transition-all duration-200 dark:bg-red-950/20 dark:border-red-900/50 dark:hover:bg-red-950/40 hover-card-lift active-press"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-red-950 dark:text-red-200">
                    {item.instruction}
                  </h4>
                  <span className="text-[10px] font-bold text-red-800 bg-red-200/80 dark:bg-red-900/70 dark:text-red-300 border border-red-300 dark:border-red-800 px-2 py-0.5 rounded-full animate-badgePop">
                    {item.field_label}
                  </span>
                </div>
                <p className="text-[11px] text-red-900/80 dark:text-red-300/80 mt-1 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Needs Manual Review */}
      <div>
        <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
          <AlertCircle className="w-4 h-4" />
          <span>Needs Manual Review ({fixPlan.needsManualReview.length})</span>
        </div>

        {fixPlan.needsManualReview.length === 0 ? (
          <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-[#182030] p-3 rounded-xl border border-slate-200/60 dark:border-[#2A3854]">
            No ambiguous extractions or review items.
          </p>
        ) : (
          <div className="space-y-2">
            {fixPlan.needsManualReview.map((item) => (
              <div
                key={item.field_id}
                onClick={() => onSelectField?.(item.field_id)}
                className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl cursor-pointer hover:bg-blue-100/70 hover:border-blue-300 transition-all duration-200 dark:bg-blue-950/20 dark:border-blue-900/50 dark:hover:bg-blue-950/40 hover-card-lift active-press"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200">
                    {item.instruction}
                  </h4>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-200/80 dark:bg-blue-900/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800 px-2 py-0.5 rounded-full animate-badgePop">
                    {item.field_label}
                  </span>
                </div>
                <p className="text-[11px] text-blue-900/80 dark:text-blue-300/80 mt-1 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Consistent */}
      <div>
        <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Consistent Fields ({fixPlan.consistent.length})</span>
        </div>

        <div className="space-y-1.5">
          {fixPlan.consistent.map((item) => (
            <div
              key={item.field_id}
              onClick={() => onSelectField?.(item.field_id)}
              className="px-3.5 py-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl flex items-center justify-between cursor-pointer hover:bg-emerald-100/60 transition-all duration-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 hover-card-lift active-press"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                  {item.field_label}
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                Match Verified
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Honesty & Genuineness Disclaimer Footer */}
      <div className="pt-3.5 border-t border-slate-100 dark:border-[#1F293D] text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic transition-colors">
        <strong>Important:</strong> Parity compares what it can read across submitted documents. It does not verify whether
        your documents are genuine or whether you are eligible for the scholarship.
      </div>
    </div>
  );
}
