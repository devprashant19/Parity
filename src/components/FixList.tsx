'use client';

import React from 'react';
import { Download, AlertCircle, CheckCircle2, ShieldAlert, FileText } from 'lucide-react';
import { FieldComparison } from '@/lib/compare/types';
import { generateFixPlan } from '@/lib/fixplan/generator';
import { exportToCsv } from '@/lib/fixplan/exporter';

export interface FixListProps {
  fields: FieldComparison[];
  onSelectField?: (fieldId: string) => void;
}

export function FixList({ fields, onSelectField }: FixListProps) {
  const fixPlan = generateFixPlan(fields);

  const handleExportCsv = () => {
    const csvData = exportToCsv(fields);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parity-fix-list-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-[#E2E2E8] rounded-2xl p-5 shadow-sm space-y-5 dark:bg-[#1A1B20] dark:border-[#26282E]">
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E2E8] dark:border-[#26282E]">
        <div>
          <h3 className="font-serif-heading text-base font-bold text-[#1A1A1E] dark:text-[#ECECF1]">
            Prioritized Fix Plan
          </h3>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            {fixPlan.totalActions > 0
              ? `${fixPlan.totalActions} action item(s) to verify before final submission`
              : 'All fields verified consistent across documents'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-black transition-colors dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* 1. Fix Before Submitting */}
      <div>
        <div className="flex items-center space-x-1.5 text-xs font-bold text-red-700 dark:text-red-400 mb-2">
          <ShieldAlert className="w-4 h-4" />
          <span>Fix Before Submitting ({fixPlan.fixBeforeSubmitting.length})</span>
        </div>

        {fixPlan.fixBeforeSubmitting.length === 0 ? (
          <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
            No unresolved high-priority conflicts remaining.
          </p>
        ) : (
          <div className="space-y-2">
            {fixPlan.fixBeforeSubmitting.map((item) => (
              <div
                key={item.field_id}
                onClick={() => onSelectField?.(item.field_id)}
                className="p-3 bg-red-50/70 border border-red-200/80 rounded-xl cursor-pointer hover:bg-red-50 transition-colors dark:bg-red-950/20 dark:border-red-900/50"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-red-900 dark:text-red-200">
                    {item.instruction}
                  </h4>
                  <span className="text-[10px] font-semibold text-red-700 bg-red-200/70 dark:bg-red-900/60 dark:text-red-300 px-1.5 py-0.5 rounded">
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
        <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
          <AlertCircle className="w-4 h-4" />
          <span>Needs Manual Review ({fixPlan.needsManualReview.length})</span>
        </div>

        {fixPlan.needsManualReview.length === 0 ? (
          <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
            No ambiguous extractions or review items.
          </p>
        ) : (
          <div className="space-y-2">
            {fixPlan.needsManualReview.map((item) => (
              <div
                key={item.field_id}
                onClick={() => onSelectField?.(item.field_id)}
                className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors dark:bg-blue-950/20 dark:border-blue-900/50"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    {item.instruction}
                  </h4>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-200/70 dark:bg-blue-900/60 dark:text-blue-300 px-1.5 py-0.5 rounded">
                    {item.field_label}
                  </span>
                </div>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-1 leading-relaxed">
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
              className="px-3 py-2 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition-colors dark:bg-emerald-950/15 dark:border-emerald-900/30"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
                  {item.field_label}
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                Match Verified
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Honesty & Genuineness Disclaimer Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
        <strong>Important:</strong> Parity compares what it can read across submitted documents. It does not verify whether
        your documents are genuine or whether you are eligible for the scholarship.
      </div>
    </div>
  );
}
