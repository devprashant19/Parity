'use client';

import React, { useState } from 'react';
import { Edit3, Check, X, ChevronDown } from 'lucide-react';
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
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#ef4d23] hover:underline pt-2 cursor-pointer focus:outline-none"
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>Enter value manually / override OCR</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="p-4 bg-white dark:bg-[#151a24] border border-neutral-200/90 dark:border-neutral-700 rounded-2xl space-y-3 shadow-xs"
    >
      <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
        <span className="text-xs font-semibold text-neutral-900 dark:text-white">
          Manual Value Entry &amp; Override
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Target Document Dropdown */}
      <div>
        <label className="block text-[12px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Select target document
        </label>
        <div className="relative">
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value as any)}
            className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#121620] shadow-2xs appearance-none pr-8 focus:outline-none focus:border-neutral-400 cursor-pointer font-medium"
          >
            {documents.map((d) => (
              <option key={d.doc_type} value={d.doc_type}>
                {d.doc_label} (Current: {d.raw_value || 'Empty'})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Value Input with # Prefix */}
      <div>
        <label className="block text-[12px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Type correct value as printed
        </label>
        <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-[#121620] text-neutral-800 dark:text-neutral-200 focus-within:border-neutral-400 transition-colors shadow-2xs">
          <span className="text-neutral-400 mr-2 font-mono text-xs">#</span>
          <input
            type="text"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            placeholder="e.g. 89.4% or $24,000"
            className="w-full bg-transparent focus:outline-none text-xs font-medium"
          />
        </div>
      </div>

      {/* Footer Buttons Matching Convix Card 2 */}
      <div className="flex items-center gap-3 pt-2 text-xs">
        <button
          type="submit"
          className="bg-[#ef4d23] hover:bg-[#e03d13] text-white rounded-lg px-4 py-1.5 font-medium transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Save</span>
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-neutral-500 hover:text-neutral-800 underline underline-offset-2 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
