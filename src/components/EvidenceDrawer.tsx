'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle2, HelpCircle, Eye, Check } from 'lucide-react';
import { FieldComparison, ResolutionChoice } from '@/lib/compare/types';
import { DocumentModal } from './DocumentModal';
import { ManualEntry } from './ManualEntry';

export interface EvidenceDrawerProps {
  field: FieldComparison | null;
  onClose: () => void;
  onDecision: (fieldId: string, choice: ResolutionChoice) => void;
  onManualOverride?: (fieldId: string, docType: string, newValue: string) => void;
}

export function EvidenceDrawer({
  field,
  onClose,
  onDecision,
  onManualOverride,
}: EvidenceDrawerProps) {
  const [modalDoc, setModalDoc] = useState<{ title: string; previewUrl?: string; fileName?: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!field) return null;

  const docA = field.documents[0]; // Application Form
  const docB = field.documents[1]; // Supporting Document (Marksheet or Income Cert)
  const docC = field.documents[2]; // If 3 docs (Name)

  const renderQuoteWithHighlight = (quote: string | null, value: string | null) => {
    if (!quote) {
      return <span className="text-slate-400 italic">No quoted text extracted</span>;
    }
    if (!value) {
      return <span>&ldquo;{quote}&rdquo;</span>;
    }

    const cleanVal = value.trim();
    const idx = quote.toLowerCase().indexOf(cleanVal.toLowerCase());

    if (idx === -1) {
      // Try stripping currency / symbols
      const stripped = cleanVal.replace(/[₹\$\€\,%]/g, '').trim();
      const idx2 = stripped.length >= 2 ? quote.toLowerCase().indexOf(stripped.toLowerCase()) : -1;
      if (idx2 !== -1) {
        const before = quote.slice(0, idx2);
        const match = quote.slice(idx2, idx2 + stripped.length);
        const after = quote.slice(idx2 + stripped.length);
        return (
          <span>
            &ldquo;{before}
            <mark className="evidence-highlight">{match}</mark>
            {after}&rdquo;
          </span>
        );
      }
      return <span>&ldquo;{quote}&rdquo;</span>;
    }

    const before = quote.slice(0, idx);
    const match = quote.slice(idx, idx + cleanVal.length);
    const after = quote.slice(idx + cleanVal.length);

    return (
      <span>
        &ldquo;{before}
        <mark className="evidence-highlight">{match}</mark>
        {after}&rdquo;
      </span>
    );
  };

  const isSelected = (choice: ResolutionChoice) => field.resolution === choice;

  return (
    <>
      {/* Backdrop (Mobile/Tablet only: checklist remains directly clickable on desktop) */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity lg:hidden"
      />

      {/* Drawer Surface */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-[#1A1B20] border-l border-[#E2E2E8] dark:border-[#26282E] shadow-2xl flex flex-col overflow-hidden animate-slideIn">
        {/* Header */}
        <div className="p-5 border-b border-[#E2E2E8] dark:border-[#26282E] flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-serif-heading text-lg font-bold text-[#1A1A1E] dark:text-[#ECECF1]">
                {field.field_label}
              </h3>
              <span
                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  field.status === 'Conflict'
                    ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                    : field.status === 'Consistent'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                }`}
              >
                {field.status === 'Conflict' && <AlertTriangle className="w-3 h-3" />}
                {field.status === 'Consistent' && <CheckCircle2 className="w-3 h-3" />}
                {field.status === 'Needs Review' && <HelpCircle className="w-3 h-3" />}
                <span>{field.status}</span>
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Side-by-side evidence inspection &amp; student resolution
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Pairwise Evidence Cards */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Extracted Cited Evidence
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Document A Card */}
              {docA && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {docA.doc_label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Page {docA.page}</span>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-mono-val min-h-[64px]">
                    {renderQuoteWithHighlight(docA.quote, docA.raw_value)}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Value: <strong className="font-mono-val">{docA.raw_value ?? 'null'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setModalDoc({
                          title: docA.doc_label,
                          previewUrl: docA.doc_type === 'application_form' ? '/samples/clean_form.svg' : undefined,
                        })
                      }
                      className="inline-flex items-center space-x-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect scan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Document B Card */}
              {docB && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {docB.doc_label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Page {docB.page}</span>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-mono-val min-h-[64px]">
                    {renderQuoteWithHighlight(docB.quote, docB.raw_value)}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Value: <strong className="font-mono-val">{docB.raw_value ?? 'null'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setModalDoc({
                          title: docB.doc_label,
                          previewUrl:
                            docB.doc_type === 'marksheet'
                              ? '/samples/clean_marksheet.svg'
                              : '/samples/clean_income_cert.svg',
                        })
                      }
                      className="inline-flex items-center space-x-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect scan</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* If 3rd document exists (Name pairwise check) */}
            {docC && (
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {docC.doc_label} (Third Document)
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Page {docC.page}</span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-mono-val">
                  {renderQuoteWithHighlight(docC.quote, docC.raw_value)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Value: <strong className="font-mono-val">{docC.raw_value ?? 'null'}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Diff & Explanation Card */}
          <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Deterministic Evaluation Analysis
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {field.diff_explanation}
            </p>
          </div>

          {/* Student Authority Decision Group */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Which document is correct?
              </h4>
              <span className="text-[11px] text-slate-500 italic">Student decision required</span>
            </div>

            <div className="space-y-2">
              {/* Option 1: Supporting Document is correct (e.g. Marksheet) */}
              {docB && (
                <button
                  type="button"
                  onClick={() => onDecision(field.field_id, 'document_b_correct')}
                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    isSelected('document_b_correct')
                      ? 'bg-blue-50 border-blue-600 text-blue-900 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-100 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-bold">{docB.doc_label} is correct</span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-0.5">
                      Fix plan will instruct: Update the application form to {docB.raw_value}
                    </span>
                  </div>
                  {isSelected('document_b_correct') && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              )}

              {/* Option 2: Application Form is correct */}
              {docA && (
                <button
                  type="button"
                  onClick={() => onDecision(field.field_id, 'document_a_correct')}
                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    isSelected('document_a_correct')
                      ? 'bg-blue-50 border-blue-600 text-blue-900 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-100 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-bold">{docA.doc_label} is correct</span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-0.5">
                      Fix plan will instruct: Request a corrected document from the issuing office
                    </span>
                  </div>
                  {isSelected('document_a_correct') && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              )}

              {/* Option 3: Not sure */}
              <button
                type="button"
                onClick={() => onDecision(field.field_id, 'not_sure')}
                className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                  isSelected('not_sure')
                    ? 'bg-blue-50 border-blue-600 text-blue-900 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-100 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                <div>
                  <span className="font-bold">I&apos;m not sure / Needs manual review</span>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-0.5">
                    Item will be placed in Needs Manual Review for physical original cross-checking
                  </span>
                </div>
                {isSelected('not_sure') && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Manual Entry Component */}
          {onManualOverride && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <ManualEntry
                documents={field.documents}
                onSaveManualValue={(docType, newVal) => onManualOverride(field.field_id, docType, newVal)}
              />
            </div>
          )}
        </div>
      </aside>

      {/* Document Scan Modal */}
      {modalDoc && (
        <DocumentModal
          isOpen={true}
          onClose={() => setModalDoc(null)}
          title={modalDoc.title}
          previewUrl={modalDoc.previewUrl}
          fileName={modalDoc.fileName}
        />
      )}
    </>
  );
}
