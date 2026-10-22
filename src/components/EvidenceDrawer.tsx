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
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-[#131926] border-l border-[#E2E8F0] dark:border-[#1E293B] shadow-2xl flex flex-col overflow-hidden animate-slideIn">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="font-serif-heading text-lg sm:text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                {field.field_label}
              </h3>
              <span
                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  field.status === 'Conflict'
                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900'
                    : field.status === 'Consistent'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900'
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900'
                }`}
              >
                {field.status === 'Conflict' && <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
                {field.status === 'Consistent' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                {field.status === 'Needs Review' && <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                <span>{field.status}</span>
              </span>
            </div>
            <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1">
              Side-by-side evidence inspection &amp; student resolution
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Pairwise Evidence Cards */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Extracted Cited Evidence
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Document A Card */}
              {docA && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {docA.doc_label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800">
                      Page {docA.page}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-mono-val min-h-[68px]">
                    {renderQuoteWithHighlight(docA.quote, docA.raw_value)}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Value: <strong className="font-mono-val text-slate-900 dark:text-white">{docA.raw_value ?? 'null'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setModalDoc({
                          title: docA.doc_label,
                          previewUrl: docA.doc_type === 'application_form' ? '/samples/clean_form.svg' : undefined,
                        })
                      }
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect scan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Document B Card */}
              {docB && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {docB.doc_label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800">
                      Page {docB.page}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-mono-val min-h-[68px]">
                    {renderQuoteWithHighlight(docB.quote, docB.raw_value)}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Value: <strong className="font-mono-val text-slate-900 dark:text-white">{docB.raw_value ?? 'null'}</strong>
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
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect scan</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* If 3rd document exists (Name pairwise check) */}
            {docC && (
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {docC.doc_label} (Third Document)
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800">
                    Page {docC.page}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-mono-val">
                  {renderQuoteWithHighlight(docC.quote, docC.raw_value)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Value: <strong className="font-mono-val text-slate-900 dark:text-white">{docC.raw_value ?? 'null'}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Diff & Explanation Card */}
          <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
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
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Student decision required</span>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Supporting Document is correct (e.g. Marksheet) */}
              {docB && (
                <button
                  type="button"
                  onClick={() => onDecision(field.field_id, 'document_b_correct')}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all duration-150 flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isSelected('document_b_correct')
                      ? 'bg-blue-50/90 border-blue-600 text-blue-950 dark:bg-blue-950/50 dark:border-blue-500 dark:text-blue-100 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 dark:bg-[#131926] dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm block">{docB.doc_label} is correct</span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-1">
                      Fix plan will instruct: Update the application form to {docB.raw_value}
                    </span>
                  </div>
                  {isSelected('document_b_correct') && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              )}

              {/* Option 2: Application Form is correct */}
              {docA && (
                <button
                  type="button"
                  onClick={() => onDecision(field.field_id, 'document_a_correct')}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all duration-150 flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isSelected('document_a_correct')
                      ? 'bg-blue-50/90 border-blue-600 text-blue-950 dark:bg-blue-950/50 dark:border-blue-500 dark:text-blue-100 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 dark:bg-[#131926] dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm block">{docA.doc_label} is correct</span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-1">
                      Fix plan will instruct: Request a corrected document from the issuing office
                    </span>
                  </div>
                  {isSelected('document_a_correct') && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              )}

              {/* Option 3: Not sure */}
              <button
                type="button"
                onClick={() => onDecision(field.field_id, 'not_sure')}
                className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all duration-150 flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isSelected('not_sure')
                    ? 'bg-blue-50/90 border-blue-600 text-blue-950 dark:bg-blue-950/50 dark:border-blue-500 dark:text-blue-100 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 dark:bg-[#131926] dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                <div>
                  <span className="font-bold text-sm block">I&apos;m not sure / Needs manual review</span>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-1">
                    Item will be placed in Needs Manual Review for physical original cross-checking
                  </span>
                </div>
                {isSelected('not_sure') && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
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
