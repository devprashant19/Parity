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
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-200 dark:border-red-900">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span>Conflict</span>
          </span>
        );
      case 'Consistent':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Consistent</span>
          </span>
        );
      case 'Needs Review':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Needs Review</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs dark:bg-[#131926] dark:border-[#1E293B]">
      <div className="p-4 sm:p-5 border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between">
        <div>
          <h3 className="font-serif-heading text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
            Cross-Document Verification Checklist
          </h3>
          <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-0.5">
            Deterministic rule engine comparison across ingested application records
          </p>
        </div>
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 hidden sm:inline">
          Click any field to inspect cited evidence →
        </span>
      </div>

      <div className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
        {fields.map((field) => {
          const isSelected = selectedFieldId === field.field_id;

          return (
            <div
              key={field.field_id}
              onClick={() => onSelectField(field.field_id)}
              className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-all duration-150 ${
                isSelected
                  ? 'bg-blue-50/70 border-l-4 border-blue-600 dark:bg-blue-950/30'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/40 border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-start space-x-3.5 min-w-0 pr-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                    field.status === 'Conflict'
                      ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border-red-200/70 dark:border-red-900/60'
                      : field.status === 'Consistent'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-900/60'
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/70 dark:border-blue-900/60'
                  }`}
                >
                  {getFieldIcon(field.field_id)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] truncate">
                      {field.field_label}
                    </h4>
                    {field.resolution !== 'unresolved' && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-900 px-2 py-0.5 rounded-full">
                        Decision recorded
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1 line-clamp-1">
                    {field.diff_explanation}
                  </p>

                  {/* Documents compared pill list */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {field.documents.map((d, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center text-[11px] font-mono-val px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-800"
                      >
                        <span className="text-slate-500 mr-1.5 font-sans font-medium">{d.doc_label.split(' ')[0]}:</span>
                        <strong className="font-bold text-slate-900 dark:text-white">
                          {d.raw_value ?? 'null'}
                        </strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                {getStatusBadge(field.status)}
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
