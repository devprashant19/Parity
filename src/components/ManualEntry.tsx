'use client';

import React, { useState } from 'react';
import { Edit3, Check, X } from 'lucide-react';
import { DocumentComparisonEntry } from '@/lib/compare/types';

export interface ManualEntryProps {
  documents: DocumentComparisonEntry[];
  onSaveManualValue: (docType: string, newValue: string) => void;
}

export function ManualEntry({ documents, onSaveManualValue }: ManualEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(documents[0]?.doc_type || 'application_form');
  const [manualValue, setManualValue] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualValue.trim()) return;
    onSaveManualValue(selectedDocType, manualValue.trim());
    setManualValue('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline pt-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg active-press"
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>Enter value manually / override OCR</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 dark:bg-[#10141E] dark:border-[#1F293D] animate-fadeIn hover-card-lift"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
          Manual Value Entry &amp; OCR Override
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg active-press group"
        >
          <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Select target document:
        </label>
        <select
          value={selectedDocType}
          onChange={(e) => setSelectedDocType(e.target.value as any)}
          className="w-full text-xs bg-white dark:bg-[#182030] border border-slate-300 dark:border-[#2A3854] rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer transition-colors"
        >
          {documents.map((d) => (
            <option key={d.doc_type} value={d.doc_type}>
              {d.doc_label} (Current: {d.raw_value || 'Empty'})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Type correct value as printed:
        </label>
        <input
          type="text"
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          placeholder="e.g. 89.4% or $24,000"
          className="w-full text-xs font-mono-val bg-white dark:bg-[#182030] border border-slate-300 dark:border-[#2A3854] rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
        />
      </div>

      <div className="flex items-center justify-end space-x-2 pt-1">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg cursor-pointer active-press"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:-translate-y-0.5 active-press transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Save &amp; Re-evaluate</span>
        </button>
      </div>
    </form>
  );
}
