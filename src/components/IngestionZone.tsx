'use client';

import React from 'react';
import { Sparkles, AlertCircle, RefreshCw, Play, Info } from 'lucide-react';
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
}: IngestionZoneProps) {
  const hasDocuments =
    uploadedDocs.application_form !== null &&
    uploadedDocs.marksheet !== null &&
    uploadedDocs.income_certificate !== null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-xs dark:bg-[#131926] dark:border-[#1E293B] transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-[#E2E8F0] dark:border-[#1E293B] gap-4">
        <div>
          <h2 className="font-serif-heading text-lg sm:text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
            Application Document Packet
          </h2>
          <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-0.5">
            Ingest 3 required documents for scholarship, financial aid, or admissions packet cross-verification.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onLoadCleanSample}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-slate-800 transition-all duration-200 shadow-xs hover:-translate-y-0.5 cursor-pointer dark:bg-white dark:text-[#0F172A] dark:hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 dark:text-amber-600" />
            <span>Load sample scholarship packet</span>
          </button>

          <button
            type="button"
            onClick={onLoadMessySample}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-all duration-200 shadow-xs hover:-translate-y-0.5 cursor-pointer dark:border-slate-700 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span>Try a messy packet</span>
          </button>

          {(hasDocuments || hasRun) && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Upload Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
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
          label="2. Academic Marksheet"
          expectedType="12th / Board Exam Scan (Name, Year, Marks %)"
          description="Max 1.5MB Image / PDF"
          loadedDoc={uploadedDocs.marksheet}
          onFileSelect={(file) => onFileSelect('marksheet', file)}
          onViewDoc={() => onViewDoc('marksheet')}
        />

        <UploadSlot
          id="income_certificate"
          label="3. Income Certificate"
          expectedType="Official Revenue Cert (Name, Income, Date)"
          description="Max 1.5MB Image / PDF"
          loadedDoc={uploadedDocs.income_certificate}
          onFileSelect={(file) => onFileSelect('income_certificate', file)}
          onViewDoc={() => onViewDoc('income_certificate')}
        />
      </div>

      {/* Primary Verification Action Bar */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
          <span>
            {sampleMeta
              ? sampleMeta.description
              : 'Upload all 3 documents or click a sample preset above to run precomputed analysis in <2s.'}
          </span>
        </div>

        <button
          type="button"
          disabled={!hasDocuments || isAnalyzing}
          onClick={onRunCheck}
          className={`inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-xs shrink-0 cursor-pointer ${
            hasDocuments && !isAnalyzing
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
          }`}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Running deterministic checks...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{hasRun ? 'Re-run check' : 'Run check'}</span>
            </>
          )}
        </button>
      </div>

      {/* Privacy Notice on Live Ingestion */}
      <div className="mt-4 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start space-x-3 dark:bg-amber-950/20 dark:border-amber-900/40">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
          <strong>Privacy Notice:</strong> Files you upload are sent to Google&apos;s Gemini API to read them. Don&apos;t
          upload real identity or financial documents; use synthetic or redacted samples. Parity doesn&apos;t store files.
        </p>
      </div>
    </div>
  );
}
