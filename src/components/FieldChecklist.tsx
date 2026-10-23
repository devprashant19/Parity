'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  User,
  Calendar,
  GraduationCap,
  Banknote,
  FileCheck,
} from 'lucide-react';
import { FieldComparison, FieldStatus } from '@/lib/compare/types';

export interface FieldChecklistProps {
  fields: FieldComparison[];
  selectedFieldId: string | null;
  onSelectField: (fieldId: string) => void;
}

export function FieldChecklist({ fields, selectedFieldId, onSelectField }: FieldChecklistProps) {
  const getFieldIcon = (id: string) => {
    switch (id) {
      case 'name':
        return <User className="w-4 h-4" />;
      case 'academic_year':
        return <Calendar className="w-4 h-4" />;
      case 'marks':
        return <GraduationCap className="w-4 h-4" />;
      case 'income':
        return <Banknote className="w-4 h-4" />;
      case 'issue_date':
        return <FileCheck className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: FieldStatus) => {
    switch (status) {
      case 'Conflict':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300 border border-red-200/60 dark:border-red-900/60">
            <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Conflict</span>
          </span>
        );
      case 'Consistent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Consistent</span>
          </span>
        );
      case 'Needs Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
            <HelpCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Needs Review</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#121620] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs transition-all">
      <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#ef4d23] font-medium text-xs">Step 2</span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">Field Analysis</span>
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white mt-0.5">
            Cross-Document Verification Checklist
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Deterministic rule comparison across ingested application records
          </p>
        </div>
        <span className="text-xs font-medium text-[#ef4d23] hidden sm:inline">
          Click row to inspect cited evidence →
        </span>
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {fields.map((field) => {
          const isSelected = selectedFieldId === field.field_id;

          return (
            <div
              key={field.field_id}
              data-testid={`field-row-${field.field_id}`}
              onClick={() => onSelectField(field.field_id)}
              className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-all duration-200 group ${
                isSelected
                  ? 'bg-[#f5f2ee]/90 border-l-4 border-[#ef4d23] dark:bg-[#182030] dark:border-[#ef4d23] shadow-2xs'
                  : 'hover:bg-neutral-50/80 dark:hover:bg-[#182030] border-l-4 border-transparent hover:pl-6'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0 pr-4">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border transition-transform duration-200 group-hover:scale-105 ${
                    field.status === 'Conflict'
                      ? 'bg-red-50 text-red-600 border-red-200/70 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60'
                      : field.status === 'Consistent'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
                      : 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60'
                  }`}
                >
                  {getFieldIcon(field.field_id)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                      {field.field_label}
                    </h4>
                    {field.resolution !== 'unresolved' && (
                      <span className="text-[10px] font-medium text-[#ef4d23] bg-[#ef4d23]/10 px-2 py-0.5 rounded-full animate-badgePop">
                        Decision recorded
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                    {field.diff_explanation}
                  </p>

                  {/* Documents compared pill list */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {field.documents.map((d, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-[#f5f2ee] dark:bg-[#182030] text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700 font-medium transition-colors"
                      >
                        <span className="text-neutral-400 mr-1.5">{d.doc_label.split(' ')[0]}:</span>
                        <strong>{d.raw_value ?? 'null'}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {getStatusBadge(field.status)}
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#ef4d23] group-hover:translate-x-0.5 transition-all duration-200" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
