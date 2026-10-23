'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle2, HelpCircle, Eye, Check, Mail, Info } from 'lucide-react';
import { FieldComparison, ResolutionChoice, BoundingBox } from '@/lib/compare/types';
import { DocumentModal } from './DocumentModal';
import { ManualEntry } from './ManualEntry';
import { ParityLogo } from './ParityLogo';

export interface EvidenceDrawerProps {
  field: FieldComparison | null;
  onClose: () => void;
  onDecision: (fieldId: string, choice: ResolutionChoice) => void;
  onManualOverride?: (fieldId: string, docType: string, newValue: string) => void;
  onOpenOfficeModal?: (fieldId: string) => void;
}

export function EvidenceDrawer({
  field,
  onClose,
  onDecision,
  onManualOverride,
  onOpenOfficeModal,
}: EvidenceDrawerProps) {
  const [modalDoc, setModalDoc] = useState<{
    title: string;
    previewUrl?: string;
    fileName?: string;
    highlightBbox?: BoundingBox | null;
    highlightLabel?: string;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!field) return null;

  const docA = field.documents[0]; // Application Form
  const docB = field.documents[1]; // Supporting Document
  const docC = field.documents[2]; // If 3 docs (Name)

  const renderQuoteWithHighlight = (quote: string | null, value: string | null) => {
    if (!quote) {
      return <span className="text-neutral-400 italic">No quoted text extracted</span>;
    }
    if (!value) {
      return <span>&ldquo;{quote}&rdquo;</span>;
    }

    const cleanVal = value.trim();
    const idx = quote.toLowerCase().indexOf(cleanVal.toLowerCase());

    if (idx === -1) {
      const stripped = cleanVal.replace(/[₹\$\€\,%]/g, '').trim();
      const idx2 = stripped.length >= 2 ? quote.toLowerCase().indexOf(stripped.toLowerCase()) : -1;
      if (idx2 !== -1) {
        const before = quote.slice(0, idx2);
        const match = quote.slice(idx2, idx2 + stripped.length);
        const after = quote.slice(idx2 + stripped.length);
        return (
          <span>
            &ldquo;{before}
            <mark className="bg-[#ef4d23]/20 text-neutral-900 dark:text-white px-1 py-0.5 rounded font-semibold">{match}</mark>
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
        <mark className="bg-[#ef4d23]/20 text-neutral-900 dark:text-white px-1 py-0.5 rounded font-semibold">{match}</mark>
        {after}&rdquo;
      </span>
    );
  };

  const isSelected = (choice: ResolutionChoice) => field.resolution === choice;

  const renderDocPreviewWithOverlay = (doc: typeof docA) => {
    if (!doc || !doc.preview_url) return null;
    const bbox = doc.highlight_bbox;
    // Rule: Don't draw an overlay unless the crop read agrees with the full-page read
    const isLocationVerified = doc?.double_read ? doc.double_read.agreed : false;
    const showOverlay = Boolean(bbox && isLocationVerified);

    return (
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-[11px] text-neutral-500">
          <span className="font-medium">Scan Preview &amp; Location Verification:</span>
          {showOverlay ? (
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-medium bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Verified Region ({Math.round(bbox!.x * 100)}%, {Math.round(bbox!.y * 100)}%)
            </span>
          ) : (
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300/60 dark:border-amber-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              Location not verified
            </span>
          )}
        </div>
        <div
          onClick={() =>
            setModalDoc({
              title: doc.doc_label,
              previewUrl: doc.preview_url,
              fileName: doc.doc_label,
              highlightBbox: showOverlay ? doc.highlight_bbox : null,
              highlightLabel: doc.raw_value ?? doc.doc_label,
            })
          }
          className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 group cursor-pointer w-full aspect-[600/520] min-h-[220px] flex items-center justify-center hover:border-[#ef4d23]/60 transition-colors shadow-2xs"
          title={showOverlay ? 'Click to enlarge scan (verified bounding box)' : 'Click to enlarge scan (location unverified)'}
        >
          <img
            src={doc.preview_url}
            alt={doc.doc_label}
            className="w-full h-full object-contain pointer-events-none block"
          />
          {showOverlay && bbox && (
            <div
              className="absolute border-2 border-[#ef4d23] bg-[#ef4d23]/25 rounded-xs pointer-events-none shadow-[0_0_10px_rgba(239,77,35,0.4)] animate-pulse"
              style={{
                left: `${bbox.x * 100}%`,
                top: `${bbox.y * 100}%`,
                width: `${bbox.width * 100}%`,
                height: `${bbox.height * 100}%`,
              }}
            >
              <span className="absolute top-1 right-1.5 text-[9px] font-mono font-semibold bg-[#ef4d23] text-white px-1.5 py-0.5 rounded shadow-2xs whitespace-nowrap pointer-events-none">
                {doc.raw_value ?? 'target region'}
              </span>
            </div>
          )}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs pointer-events-none">
            <Eye className="w-3 h-3" /> Inspect Scan
          </div>
        </div>

        {!showOverlay && (
          <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/70 dark:border-amber-900/50 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block">Location not verified</span>
              <span>Full-page read extracted this value with a cited quote excerpt, but secondary crop read did not confirm exact bounding coordinates. Bounding box overlay withheld for accuracy.</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity lg:hidden"
      />

      {/* Drawer Surface */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-[#121620] border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden animate-slideIn">
        {/* Header in #f5f2ee */}
        <div className="p-4 sm:p-5 bg-[#f5f2ee] dark:bg-[#182030] border-b border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#ef4d23] font-medium text-xs flex items-center gap-1.5">
                <ParityLogo className="w-3.5 h-3.5 shrink-0" />
                Inspect Evidence
              </span>
              <span className="text-neutral-400">•</span>
              <span className="text-xs text-neutral-500 font-mono">{field.field_id}</span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mt-0.5">
              {field.field_label}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Status Explanation Card */}
          <div className="p-4 rounded-2xl bg-[#f5f2ee]/60 dark:bg-[#182030]/60 border border-neutral-200/70 dark:border-neutral-700/70">
            <div className="flex items-center gap-2 mb-1.5">
              {field.status === 'Conflict' ? (
                <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 rounded-full px-2 py-0.5 text-[11px] font-medium border border-red-200/60">
                  <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                  Conflict
                </span>
              ) : field.status === 'Consistent' ? (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 text-[11px] font-medium border border-emerald-200/60">
                  <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                  Consistent
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 rounded-full px-2 py-0.5 text-[11px] font-medium border border-amber-200/60">
                  <HelpCircle className="w-3 h-3 stroke-[2.5]" />
                  Needs Review
                </span>
              )}
              <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                Deterministic Explanation
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {field.diff_explanation}
            </p>
          </div>

          {/* Compared Documents Cited List */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Cited Evidence from Scans
            </h4>

            {/* Doc A */}
            {docA && (
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-[#151a24] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">
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
                          highlightBbox: docA.double_read?.agreed ? docA.highlight_bbox : null,
                          highlightLabel: docA.raw_value ?? docA.doc_label,
                        })
                      }
                      className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-200 bg-white dark:bg-[#121620] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-neutral-500" />
                      <span>Inspect scan</span>
                    </button>
                  )}
                </div>

                <div className="p-3 bg-[#f5f2ee] dark:bg-[#10141e] rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                  <span className="text-[11px] text-neutral-500 block mb-0.5">Extracted Value:</span>
                  <span className="text-base font-semibold text-neutral-900 dark:text-white">
                    {docA.raw_value ?? 'Not present'}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-[11px] font-medium text-neutral-500 block">
                    Cited Quote Excerpt (&le;200 chars):
                  </span>
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    {renderQuoteWithHighlight(docA.quote, docA.raw_value)}
                  </div>
                </div>

                {renderDocPreviewWithOverlay(docA)}
              </div>
            )}

            {/* Doc B */}
            {docB && (
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-[#151a24] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">
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
                          highlightBbox: docB.double_read?.agreed ? docB.highlight_bbox : null,
                          highlightLabel: docB.raw_value ?? docB.doc_label,
                        })
                      }
                      className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-200 bg-white dark:bg-[#121620] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-neutral-500" />
                      <span>Inspect scan</span>
                    </button>
                  )}
                </div>

                <div className="p-3 bg-[#f5f2ee] dark:bg-[#10141e] rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                  <span className="text-[11px] text-neutral-500 block mb-0.5">Extracted Value:</span>
                  <span className="text-base font-semibold text-neutral-900 dark:text-white">
                    {docB.raw_value ?? 'Not present'}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-[11px] font-medium text-neutral-500 block">
                    Cited Quote from Scan:
                  </span>
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    {renderQuoteWithHighlight(docB.quote, docB.raw_value)}
                  </div>
                </div>

                {renderDocPreviewWithOverlay(docB)}
              </div>
            )}

            {/* Doc C */}
            {docC && (
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-[#151a24] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                    {docC.doc_label}
                  </span>
                  {docC.preview_url && (
                    <button
                      type="button"
                      onClick={() =>
                        setModalDoc({
                          title: docC.doc_label,
                          previewUrl: docC.preview_url,
                          fileName: docC.doc_label,
                          highlightBbox: docC.double_read?.agreed ? docC.highlight_bbox : null,
                          highlightLabel: docC.raw_value ?? docC.doc_label,
                        })
                      }
                      className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-200 bg-white dark:bg-[#121620] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-neutral-500" />
                      <span>Inspect scan</span>
                    </button>
                  )}
                </div>

                <div className="p-3 bg-[#f5f2ee] dark:bg-[#10141e] rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                  <span className="text-[11px] text-neutral-500 block mb-0.5">Extracted Value:</span>
                  <span className="text-base font-semibold text-neutral-900 dark:text-white">
                    {docC.raw_value ?? 'Not present'}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-[11px] font-medium text-neutral-500 block">
                    Cited Quote from Scan:
                  </span>
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    {renderQuoteWithHighlight(docC.quote, docC.raw_value)}
                  </div>
                </div>

                {renderDocPreviewWithOverlay(docC)}
              </div>
            )}
          </div>

          {/* Decision Resolution Options */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Which document is correct?
              </h4>
              <span className="text-[11px] text-[#ef4d23] font-medium">User decision required</span>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Supporting Document correct */}
              {docB && (
                <button
                  type="button"
                  onClick={() => onDecision(field.field_id, 'document_b_correct')}
                  className={`w-full p-3.5 rounded-2xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isSelected('document_b_correct')
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 shadow-sm'
                      : 'bg-white hover:bg-neutral-50/80 border-neutral-200 dark:bg-[#121620] dark:hover:bg-[#182030] dark:border-neutral-700 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-sm block">{docB.doc_label} is correct</span>
                    <span className={`block text-[11px] mt-0.5 ${isSelected('document_b_correct') ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500'}`}>
                      Fix plan will instruct: Update application form to {docB.raw_value}
                    </span>
                  </div>
                  {isSelected('document_b_correct') && (
                    <span className="w-5 h-5 rounded-full bg-[#ef4d23] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              )}

              {/* Option 2: Application Form correct */}
              {docA && (
                <button
                  type="button"
                  onClick={() => onDecision(field.field_id, 'document_a_correct')}
                  className={`w-full p-3.5 rounded-2xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isSelected('document_a_correct')
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 shadow-sm'
                      : 'bg-white hover:bg-neutral-50/80 border-neutral-200 dark:bg-[#121620] dark:hover:bg-[#182030] dark:border-neutral-700 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-sm block">{docA.doc_label} is correct</span>
                    <span className={`block text-[11px] mt-0.5 ${isSelected('document_a_correct') ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500'}`}>
                      Fix plan will instruct: Request corrected document from issuing office
                    </span>
                  </div>
                  {isSelected('document_a_correct') && (
                    <span className="w-5 h-5 rounded-full bg-[#ef4d23] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              )}

              {/* Option 3: Not sure */}
              <button
                type="button"
                onClick={() => onDecision(field.field_id, 'not_sure')}
                className={`w-full p-3.5 rounded-2xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                  isSelected('not_sure')
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 shadow-sm'
                    : 'bg-white hover:bg-neutral-50/80 border-neutral-200 dark:bg-[#121620] dark:hover:bg-[#182030] dark:border-neutral-700 text-neutral-800 dark:text-neutral-200'
                }`}
              >
                <div>
                  <span className="font-semibold text-sm block">Not sure / Needs manual review</span>
                  <span className={`block text-[11px] mt-0.5 ${isSelected('not_sure') ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500'}`}>
                    Item placed in Needs Manual Review for physical original cross-checking
                  </span>
                </div>
                {isSelected('not_sure') && (
                  <span className="w-5 h-5 rounded-full bg-[#ef4d23] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>

              {/* Action: Draft Letter to Issuing Office */}
              {onOpenOfficeModal && (field.status === 'Conflict' || field.status === 'Needs Review') && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenOfficeModal(field.field_id)}
                    className="w-full py-2.5 px-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Draft Formal Correction Letter to Issuing Office &rarr;</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manual Entry Component */}
          {onManualOverride && (
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
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
          highlightBbox={modalDoc.highlightBbox}
          highlightLabel={modalDoc.highlightLabel}
        />
      )}
    </>
  );
}
