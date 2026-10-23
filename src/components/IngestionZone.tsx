'use client';

import React from 'react';
import { Sparkles, RefreshCw, ChevronRight, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { UploadSlot } from './UploadSlot';
import { SamplePacketMetadata } from '@/data/samples';

export interface IngestionZoneProps {
  onLoadCleanSample: () => void;
  onLoadMessySample: () => void;
  onReset: () => void;
  onRunCheck: () => void;
  onFileSelect: (slotId: 'application_form' | 'marksheet' | 'income_certificate', file: File) => void;
  onViewDoc: (slotId: 'application_form' | 'marksheet' | 'income_certificate') => void;
  sampleMeta: SamplePacketMetadata | null;
  uploadedDocs: Record<string, { fileName: string; fileSize: string; previewUrl?: string; isSample?: boolean } | null>;
  isAnalyzing: boolean;
  hasRun: boolean;
  strictVerification?: boolean;
  onToggleStrictVerification?: (val: boolean) => void;
}

export function IngestionZone({
  onLoadCleanSample,
  onLoadMessySample,
  onReset,
  onRunCheck,
  onFileSelect,
  onViewDoc,
  sampleMeta,
  uploadedDocs,
  isAnalyzing,
  hasRun,
  strictVerification = true,
  onToggleStrictVerification,
}: IngestionZoneProps) {
  const hasDocuments =
    uploadedDocs.application_form !== null &&
    uploadedDocs.marksheet !== null &&
    uploadedDocs.income_certificate !== null;

  return (
    <div className="bg-[#f5f2ee] dark:bg-[#151a24] rounded-3xl p-4 sm:p-6 shadow-md border border-neutral-200/60 dark:border-neutral-800">
      {/* Top Header & Preset Triggers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-neutral-200/70 dark:border-neutral-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#ef4d23] font-medium text-xs">Step 1</span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">Ingestion Tray</span>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white mt-0.5">
            Application Document Packet
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
            Ingest 3 required documents for scholarship, financial aid, or admissions packet cross-verification.
            <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Live checks use a shared Gemini quota and may be temporarily unavailable under heavy load; sample packets run instantly with zero network calls.
            </span>
          </p>
        </div>

        {/* Action Triggers in Convix button language */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            data-testid="ingestion-load-clean-btn"
            onClick={onLoadCleanSample}
            className="inline-flex items-center gap-2 bg-[#ef4d23] hover:bg-[#e03d13] text-white rounded-full pl-4 pr-1.5 py-1.5 text-xs sm:text-[13px] font-medium transition-all shadow-xs cursor-pointer group"
          >
            <span>Load sample clean packet</span>
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </span>
          </button>

          <button
            type="button"
            data-testid="ingestion-load-messy-btn"
            onClick={onLoadMessySample}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#121620] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-2xs cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#ef4d23]" />
            <span>Try messy packet</span>
          </button>

          {(hasDocuments || hasRun) && (
            <button
              type="button"
              onClick={onReset}
              className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white underline underline-offset-2 text-xs font-medium px-2 py-1 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Upload Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mt-5">
        <UploadSlot
          id="application_form"
          label="1. Application Form"
          expectedType="Typed PDF (Name, Year, Marks, Income, Date)"
          description="Max 1.5MB PDF / Image"
          loadedDoc={uploadedDocs.application_form}
          onFileSelect={(file) => onFileSelect('application_form', file)}
          onViewDoc={() => onViewDoc('application_form')}
        />

        <UploadSlot
          id="marksheet"
          label="2. Academic Transcript"
          expectedType="Official Transcript Scan (Name, Year, GPA / Grade)"
          description="Max 1.5MB Image / PDF"
          loadedDoc={uploadedDocs.marksheet}
          onFileSelect={(file) => onFileSelect('marksheet', file)}
          onViewDoc={() => onViewDoc('marksheet')}
        />

        <UploadSlot
          id="income_certificate"
          label="3. Proof of Income / Tax Statement"
          expectedType="Official Tax / Income Record (Name, Income, Date)"
          description="Max 1.5MB Image / PDF"
          loadedDoc={uploadedDocs.income_certificate}
          onFileSelect={(file) => onFileSelect('income_certificate', file)}
          onViewDoc={() => onViewDoc('income_certificate')}
        />
      </div>

      {/* Action Bar */}
      <div className="mt-5 pt-4 border-t border-neutral-200/70 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <Info className="w-4 h-4 text-[#ef4d23] shrink-0" />
            <span>
              {sampleMeta
                ? sampleMeta.description
                : 'Upload all 3 documents or click a sample preset above to run precomputed analysis in <2s.'}
            </span>
          </div>

          {/* Strict Verification Toggle Switch */}
          <div className="inline-flex items-center gap-2 bg-white dark:bg-[#121620] px-3 py-1.5 rounded-full border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs">
            <button
              type="button"
              role="switch"
              aria-checked={strictVerification}
              onClick={() => onToggleStrictVerification?.(!strictVerification)}
              className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                strictVerification ? 'bg-[#ef4d23]' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
              title={
                strictVerification
                  ? 'Strict verification ON: Batches horizontal band crops (±1 row) per document for consistent fields and verifies with second pass.'
                  : 'Fast mode: Single pass full-page multimodal extraction only.'
              }
            >
              <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                  strictVerification ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200">
              <ShieldCheck className="w-3.5 h-3.5 text-[#ef4d23]" />
              <span>Strict Verification</span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {strictVerification ? '(Batched 2nd Pass)' : '(Fast 1-Pass)'}
              </span>
            </div>
          </div>
        </div>

        {/* Dark Execution CTA Pill */}
        <button
          type="button"
          data-testid="run-verification-check-btn"
          disabled={!hasDocuments || isAnalyzing}
          onClick={onRunCheck}
          className={`inline-flex items-center gap-3 rounded-full pl-6 pr-2 py-2 sm:py-2.5 text-[14px] font-medium transition-all shadow-md group ${
            hasDocuments && !isAnalyzing
              ? 'bg-[#0b0f1a] hover:bg-neutral-800 text-white cursor-pointer hover:scale-[1.01]'
              : 'bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed shadow-none'
          }`}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Running deterministic checks...</span>
            </>
          ) : (
            <>
              <span>Run Verification Check</span>
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition-colors">
                <ChevronRight className="w-4 h-4 text-white stroke-[2.5]" />
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
