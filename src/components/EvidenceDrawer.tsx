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
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity lg:hidden"
      />

      {/* Drawer Surface */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-[#10141E] border-l border-[#E2E8F0] dark:border-[#1F293D] shadow-2xl flex flex-col overflow-hidden animate-slideIn">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] dark:border-[#1F293D] flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="font-serif-heading text-lg sm:text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                {field.field_label}
              </h3>
              <span
                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  field.status === 'Conflict'
                    ? 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-200 dark:border-red-900'
                    : field.status === 'Consistent'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                }`}
              >
                {field.status === 'Conflict' && <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />}
                {field.status === 'Consistent' && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                {field.status === 'Needs Review' && <HelpCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                <span>{field.status}</span>
              </span>
            </div>
            <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1">{field.diff_explanation}</p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-[#182030] transition-all duration-200 cursor-pointer active-press group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Side-by-Side Document Comparison Cards */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Side-by-Side Extracted Evidence
            </h4>

            {/* Document A (Typed Application Claim) */}
            {docA && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2A3854] bg-slate-50/70 dark:bg-[#182030] space-y-3 transition-all hover-card-lift">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {docA.doc_label} (Typed Claim)
                  </span>
                  {docA.preview_url && (
                    <button
                      type="button"
                      onClick={() =>
                        setModalDoc({
                          title: docA.doc_label,
                          previewUrl: docA.preview_url,
                          fileName: docA.doc_label,
                        })
                      }
                      className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer active-press"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect scan</span>
                    </button>
                  )}
                </div>

                <div className="p-3 bg-white dark:bg-[#10141E] rounded-lg border border-slate-200/80 dark:border-[#1F293D]">
                  <span className="text-[11px] text-slate-500 block mb-0.5">Reported Value</span>
                  <span className="text-base font-bold font-mono-val text-slate-900 dark:text-white">
                    {docA.raw_value ?? '—'}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Cited Quote from Scan:
                  </span>
                  <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 font-mono-val text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                    {renderQuoteWithHighlight(docA.quote, docA.raw_value)}
                  </div>
                </div>
              </div>
            )}

            {/* Document B (Official Scan) */}
            {docB && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2A3854] bg-slate-50/70 dark:bg-[#182030] space-y-3 transition-all hover-card-lift">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {docB.doc_label} (Official Record)
                  </span>
                  {docB.preview_url && (
                    <button
                      type="button"
                      onClick={() =>
                        setModalDoc({
                          title: docB.doc_label,
                          previewUrl: docB.preview_url,
                          fileName: docB.doc_label,
                        })
                      }
                      className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer active-press"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect scan</span>
                    </button>
                  )}
                </div>

                <div className="p-3 bg-white dark:bg-[#10141E] rounded-lg border border-slate-200/80 dark:border-[#1F293D]">
                  <span className="text-[11px] text-slate-500 block mb-0.5">Official Value</span>
                  <span className="text-base font-bold font-mono-val text-slate-900 dark:text-white">
                    {docB.raw_value ?? '—'}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Cited Quote from Scan:
                  </span>
                  <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 font-mono-val text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                    {renderQuoteWithHighlight(docB.quote, docB.raw_value)}
                  </div>
                </div>
              </div>
            )}

            {/* Document C (If present, e.g. Name verification) */}
            {docC && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2A3854] bg-slate-50/70 dark:bg-[#182030] space-y-3 transition-all hover-card-lift">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {docC.doc_label} (Third Document)
                  </span>
                  {docC.preview_url && (
                    <button
                      type="button"
                      onClick={() =>
                        setModalDoc({
                          title: docC.doc_label,
                          previewUrl: docC.preview_url,
                          fileName: docC.doc_label,
                        })
                      }
                      className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer active-press"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect scan</span>
                    </button>
                  )}
                </div>

                <div className="p-3 bg-white dark:bg-[#10141E] rounded-lg border border-slate-200/80 dark:border-[#1F293D]">
                  <span className="text-[11px] text-slate-500 block mb-0.5">Value</span>
                  <span className="text-base font-bold font-mono-val text-slate-900 dark:text-white">
                    {docC.raw_value ?? '—'}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Cited Quote from Scan:
                  </span>
                  <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 font-mono-val text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                    {renderQuoteWithHighlight(docC.quote, docC.raw_value)}
                  </div>
                </div>
              </div>
            )}
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
              {/* Option 1: Supporting Document is correct */}
              {docB && (
                <button
                  type="button"
                  onClick={() => onDecision(field.field_id, 'document_b_correct')}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all duration-200 flex items-center justify-between cursor-pointer active-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover-card-lift ${
                    isSelected('document_b_correct')
                      ? 'bg-blue-50/90 border-blue-600 text-blue-950 dark:bg-blue-950/50 dark:border-blue-500 dark:text-blue-100 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 dark:bg-[#10141E] dark:hover:bg-[#182030] dark:border-[#2A3854] dark:text-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm block">{docB.doc_label} is correct</span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-1">
                      Fix plan will instruct: Update the application form to {docB.raw_value}
                    </span>
                  </div>
                  {isSelected('document_b_correct') && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-checkmarkPop">
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
                  className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all duration-200 flex items-center justify-between cursor-pointer active-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover-card-lift ${
                    isSelected('document_a_correct')
                      ? 'bg-blue-50/90 border-blue-600 text-blue-950 dark:bg-blue-950/50 dark:border-blue-500 dark:text-blue-100 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 dark:bg-[#10141E] dark:hover:bg-[#182030] dark:border-[#2A3854] dark:text-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm block">{docA.doc_label} is correct</span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-1">
                      Fix plan will instruct: Request a corrected document from the issuing office
                    </span>
                  </div>
                  {isSelected('document_a_correct') && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-checkmarkPop">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              )}

              {/* Option 3: Not sure */}
              <button
                type="button"
                onClick={() => onDecision(field.field_id, 'not_sure')}
                className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all duration-200 flex items-center justify-between cursor-pointer active-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover-card-lift ${
                  isSelected('not_sure')
                    ? 'bg-blue-50/90 border-blue-600 text-blue-950 dark:bg-blue-950/50 dark:border-blue-500 dark:text-blue-100 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 dark:bg-[#10141E] dark:hover:bg-[#182030] dark:border-[#2A3854] dark:text-slate-200'
                }`}
              >
                <div>
                  <span className="font-bold text-sm block">I&apos;m not sure / Needs manual review</span>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-1">
                    Item will be placed in Needs Manual Review for physical original cross-checking
                  </span>
                </div>
                {isSelected('not_sure') && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-checkmarkPop">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Manual Entry Component */}
          {onManualOverride && (
            <div className="pt-2 border-t border-slate-200 dark:border-[#1F293D]">
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
