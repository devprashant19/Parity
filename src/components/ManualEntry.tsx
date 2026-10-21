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
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-2"
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>Enter value manually / override OCR</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 dark:bg-slate-800/60 dark:border-slate-700 animate-fadeIn"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          Manual Value Entry
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
          Select target document:
        </label>
        <select
          value={selectedDocType}
          onChange={(e) => setSelectedDocType(e.target.value as any)}
          className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
        >
          {documents.map((d) => (
            <option key={d.doc_type} value={d.doc_type}>
              {d.doc_label} (Current: {d.raw_value || 'Empty'})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
          Type correct value as printed:
        </label>
        <input
          type="text"
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          placeholder="e.g. 89.4% or ₹1,80,000"
          className="w-full text-xs font-mono-val bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
        />
      </div>

      <div className="flex items-center justify-end space-x-2 pt-1">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Save &amp; Re-evaluate</span>
        </button>
      </div>
    </form>
  );
}
