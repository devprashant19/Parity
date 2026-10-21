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
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span>Conflict</span>
          </span>
        );
      case 'Consistent':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Consistent</span>
          </span>
        );
      case 'Needs Review':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Needs Review</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#E2E2E8] rounded-2xl overflow-hidden shadow-sm dark:bg-[#1A1B20] dark:border-[#26282E]">
      <div className="p-4 border-b border-[#E2E2E8] dark:border-[#26282E] flex items-center justify-between">
        <h3 className="font-serif-heading text-base font-bold text-[#1A1A1E] dark:text-[#ECECF1]">
          Cross-Document Verification Checklist
        </h3>
        <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
          Click any field to inspect cited evidence
        </span>
      </div>

      <div className="divide-y divide-[#E2E2E8] dark:divide-[#26282E]">
        {fields.map((field) => {
          const isSelected = selectedFieldId === field.field_id;

          return (
            <div
              key={field.field_id}
              onClick={() => onSelectField(field.field_id)}
              className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50/70 border-l-4 border-blue-600 dark:bg-blue-950/30'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start space-x-3.5 min-w-0 pr-4">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    field.status === 'Conflict'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                      : field.status === 'Consistent'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                  }`}
                >
                  {getFieldIcon(field.field_id)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-[#1A1A1E] dark:text-[#ECECF1] truncate">
                      {field.field_label}
                    </h4>
                    {field.resolution !== 'unresolved' && (
                      <span className="text-[10px] font-medium text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded dark:bg-purple-950/60 dark:text-purple-300">
                        Decision recorded
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 line-clamp-1">
                    {field.diff_explanation}
                  </p>

                  {/* Documents compared pill list */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {field.documents.map((d, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center text-[11px] font-mono-val px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        <span className="text-slate-400 mr-1">{d.doc_label.split(' ')[0]}:</span>
                        <strong className="font-semibold text-slate-900 dark:text-white">
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
