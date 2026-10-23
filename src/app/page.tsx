'use client';

import React, { useState } from 'react';
import { AlertTriangle, Sparkles, ChevronRight, Play } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { IngestionZone } from '@/components/IngestionZone';
import { SummaryCounters } from '@/components/SummaryCounters';
import { FieldChecklist } from '@/components/FieldChecklist';
import { FixList } from '@/components/FixList';
import { EvidenceDrawer } from '@/components/EvidenceDrawer';
import { DocumentModal } from '@/components/DocumentModal';
import {
  CLEAN_SAMPLE_META,
  MESSY_SAMPLE_META,
  CLEAN_SAMPLE_PACKET,
  MESSY_SAMPLE_PACKET,
  SamplePacketMetadata,
} from '@/data/samples';
import { runVerification } from '@/lib/compare/engine';
import { VerificationResult, ResolutionChoice } from '@/lib/compare/types';
import { processUploadFile } from '@/lib/normalize/image';

export default function HomePage() {
  const [activePacketType, setActivePacketType] = useState<'clean_sample' | 'messy_sample' | 'live' | null>(null);
  const [sampleMeta, setSampleMeta] = useState<SamplePacketMetadata | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [apiErrorBanner, setApiErrorBanner] = useState<string | null>(null);
  const [inspectDocModal, setInspectDocModal] = useState<{ title: string; previewUrl?: string; fileName?: string } | null>(null);

  const [uploadedDocs, setUploadedDocs] = useState<
    Record<
      string,
      { fileName: string; fileSize: string; previewUrl?: string; isSample?: boolean; rawFile?: File } | null
    >
  >({
    application_form: null,
    marksheet: null,
    income_certificate: null,
  });

  const handleLoadCleanSample = () => {
    setApiErrorBanner(null);
    setActivePacketType('clean_sample');
    setSampleMeta(CLEAN_SAMPLE_META);
    setUploadedDocs({
      application_form: {
        fileName: CLEAN_SAMPLE_META.documents[0].fileName,
        fileSize: CLEAN_SAMPLE_META.documents[0].fileSize,
        previewUrl: CLEAN_SAMPLE_META.documents[0].previewUrl,
        isSample: true,
      },
      marksheet: {
        fileName: CLEAN_SAMPLE_META.documents[1].fileName,
        fileSize: CLEAN_SAMPLE_META.documents[1].fileSize,
        previewUrl: CLEAN_SAMPLE_META.documents[1].previewUrl,
        isSample: true,
      },
      income_certificate: {
        fileName: CLEAN_SAMPLE_META.documents[2].fileName,
        fileSize: CLEAN_SAMPLE_META.documents[2].fileSize,
        previewUrl: CLEAN_SAMPLE_META.documents[2].previewUrl,
        isSample: true,
      },
    });
    setVerificationResult(null);
    setSelectedFieldId(null);
  };

  const handleLoadMessySample = () => {
    setApiErrorBanner(null);
    setActivePacketType('messy_sample');
    setSampleMeta(MESSY_SAMPLE_META);
    setUploadedDocs({
      application_form: {
        fileName: MESSY_SAMPLE_META.documents[0].fileName,
        fileSize: MESSY_SAMPLE_META.documents[0].fileSize,
        previewUrl: MESSY_SAMPLE_META.documents[0].previewUrl,
        isSample: true,
      },
      marksheet: {
        fileName: MESSY_SAMPLE_META.documents[1].fileName,
        fileSize: MESSY_SAMPLE_META.documents[1].fileSize,
        previewUrl: MESSY_SAMPLE_META.documents[1].previewUrl,
        isSample: true,
      },
      income_certificate: {
        fileName: MESSY_SAMPLE_META.documents[2].fileName,
        fileSize: MESSY_SAMPLE_META.documents[2].fileSize,
        previewUrl: MESSY_SAMPLE_META.documents[2].previewUrl,
        isSample: true,
      },
    });
    setVerificationResult(null);
    setSelectedFieldId(null);
  };

  const handleReset = () => {
    setApiErrorBanner(null);
    setActivePacketType(null);
    setSampleMeta(null);
    setUploadedDocs({
      application_form: null,
      marksheet: null,
      income_certificate: null,
    });
    setVerificationResult(null);
    setSelectedFieldId(null);
  };

  const handleRunCheck = async (overrideType?: 'clean_sample' | 'messy_sample') => {
    setApiErrorBanner(null);
    setIsAnalyzing(true);
    const effectiveType = overrideType || activePacketType || 'clean_sample';

    if (effectiveType === 'live') {
      try {
        const formData = new FormData();
        if (uploadedDocs.application_form?.rawFile) {
          formData.append('application_form', uploadedDocs.application_form.rawFile);
        }
        if (uploadedDocs.marksheet?.rawFile) {
          formData.append('marksheet', uploadedDocs.marksheet.rawFile);
        }
        if (uploadedDocs.income_certificate?.rawFile) {
          formData.append('income_certificate', uploadedDocs.income_certificate.rawFile);
        }

        const res = await fetch('/api/extract', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Live extraction service unavailable.');
        }

        setVerificationResult(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Live extraction failed.';
        setApiErrorBanner(msg);
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    // Instant execution for sample packets
    let result: VerificationResult;
    if (effectiveType === 'messy_sample') {
      result = runVerification(MESSY_SAMPLE_PACKET, 'messy_sample');
    } else {
      result = runVerification(CLEAN_SAMPLE_PACKET, 'clean_sample');
    }

    setVerificationResult(result);
    setIsAnalyzing(false);
  };

  const handleFileSelect = async (slotId: 'application_form' | 'marksheet' | 'income_certificate', rawFile: File) => {
    setApiErrorBanner(null);
    setActivePacketType('live');
    setSampleMeta(null);

    try {
      const processed = await processUploadFile(rawFile);
      const sizeKb = Math.round(processed.fileSize / 1024);
      const fileSizeStr = sizeKb > 1000 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      setUploadedDocs((prev) => ({
        ...prev,
        [slotId]: {
          fileName: processed.fileName,
          fileSize: fileSizeStr,
          previewUrl: processed.previewUrl,
          isSample: false,
          rawFile: processed.file as File,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing upload file.';
      alert(msg);
    }
  };

  const handleDecision = (fieldId: string, choice: ResolutionChoice) => {
    if (!verificationResult) return;
    setVerificationResult((prev) => {
      if (!prev) return prev;
      const updatedFields = prev.fields.map((f) => {
        if (f.field_id === fieldId) {
          return { ...f, resolution: choice };
        }
        return f;
      });
      return { ...prev, fields: updatedFields };
    });
  };

  const handleManualOverride = (fieldId: string, docType: string, newValue: string) => {
    if (!verificationResult) return;
    setVerificationResult((prev) => {
      if (!prev) return prev;
      const updatedFields = prev.fields.map((f) => {
        if (f.field_id === fieldId) {
          const updatedDocs = f.documents.map((d) => {
            if (d.doc_type === docType) {
              return { ...d, raw_value: newValue, quote: newValue, source: 'manual' as const };
            }
            return d;
          });
          return { ...f, documents: updatedDocs };
        }
        return f;
      });
      return { ...prev, fields: updatedFields };
    });
  };

  const activeField = verificationResult?.fields.find((f) => f.field_id === selectedFieldId) || null;

  return (
    <div
      className="min-h-screen w-full bg-[#ededed] p-3 sm:p-5 font-sans text-neutral-900 dark:bg-[#0b0f1a] dark:text-neutral-100 transition-colors"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Floating Pill TopBar */}
      <TopBar />

      <main id="main-content" className="max-w-7xl mx-auto px-2 sm:px-4 py-6 sm:py-8 space-y-8">
        
        {/* Parity Hero Header Section (Without butterfly video) */}
        <section className="flex flex-col items-center text-center pt-4 sm:pt-6 pb-2">
          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 bg-white dark:bg-[#121620] rounded-full px-4 py-1.5 shadow-xs text-[13px] font-medium text-neutral-800 dark:text-neutral-200 border border-neutral-200/70 dark:border-neutral-800">
            <span className="w-2 h-2 rounded-full bg-[#ef4d23] inline-block" />
            <span>Parity Deterministic Verification</span>
          </div>

          {/* Headline with Instrument Serif Italic */}
          <h1
            className="mt-4 sm:mt-5 max-w-4xl text-neutral-900 dark:text-white tracking-tight leading-[1.06]"
            style={{
              fontSize: 'clamp(32px, 6.5vw, 64px)',
              lineHeight: 1.06,
              fontWeight: 500,
              letterSpacing: '-0.02em',
            }}
          >
            Deterministic{' '}
            <span
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 400,
              }}
            >
              Verification
            </span>
            <br />
            for application packets
          </h1>

          {/* Subtitle */}
          <p
            className="mt-3 sm:mt-4 text-neutral-600 dark:text-neutral-400 px-2 font-normal max-w-2xl text-balance"
            style={{ fontSize: 'clamp(13px, 3.5vw, 16px)' }}
          >
            Cross-check typed claims against marksheet scans and certificates with inspectable cited evidence before submission.
          </p>

          {/* Quick Preset Buttons in Convix Pill Language */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              id="hero-clean-btn"
              onClick={() => {
                handleLoadCleanSample();
                handleRunCheck('clean_sample');
              }}
              className="inline-flex items-center gap-3 bg-[#0b0f1a] hover:bg-neutral-800 text-white rounded-full pl-5 pr-2 py-2 text-xs sm:text-[13px] font-medium shadow-md transition-all hover:scale-[1.01] cursor-pointer group"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Load Benchmark Packet (Instant Demo)</span>
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              </span>
            </button>

            <button
              type="button"
              id="hero-messy-btn"
              onClick={() => {
                handleLoadMessySample();
                handleRunCheck('messy_sample');
              }}
              className="inline-flex items-center gap-3 bg-[#ef4d23] hover:bg-[#e03d13] text-white rounded-full pl-5 pr-2 py-2 text-xs sm:text-[13px] font-medium shadow-md transition-all hover:scale-[1.01] cursor-pointer group"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
              <span>Try Messy Packet (3 Conflicts)</span>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              </span>
            </button>
          </div>
        </section>

        {/* Fallback Error Banner */}
        {apiErrorBanner && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 dark:text-amber-200 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Live check is unavailable right now</p>
                <p className="text-xs text-amber-900 dark:text-amber-300 mt-0.5">{apiErrorBanner}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                handleLoadCleanSample();
                handleRunCheck();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-[#ef4d23] text-white hover:bg-[#e03d13] transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Try instant sample packet instead</span>
            </button>
          </div>
        )}

        {/* Step 1: Ingestion Zone in #f5f2ee Tray */}
        <section id="documents">
          <IngestionZone
            onLoadCleanSample={() => {
              handleLoadCleanSample();
              handleRunCheck('clean_sample');
            }}
            onLoadMessySample={() => {
              handleLoadMessySample();
              handleRunCheck('messy_sample');
            }}
            onReset={handleReset}
            onRunCheck={() => handleRunCheck()}
            onFileSelect={handleFileSelect}
            onViewDoc={(id) => {
              const doc = uploadedDocs[id];
              if (doc) {
                const labelMap: Record<string, string> = {
                  application_form: '1. Application Form Scan',
                  marksheet: '2. Academic Marksheet Scan',
                  income_certificate: '3. Income Certificate Scan',
                };
                setInspectDocModal({
                  title: labelMap[id] || id,
                  previewUrl: doc.previewUrl,
                  fileName: doc.fileName,
                });
              }
            }}
            sampleMeta={sampleMeta}
            uploadedDocs={uploadedDocs}
            isAnalyzing={isAnalyzing}
            hasRun={verificationResult !== null}
          />
        </section>

        {/* Step 2: Verification Results (SummaryCounters with 40-Tick Gauge + Checklist + Fix List) */}
        {verificationResult && (
          <section id="results" className="space-y-6 animate-fadeIn">
            <SummaryCounters
              conflicts={verificationResult.conflicts_count}
              consistent={verificationResult.consistent_count}
              needsReview={verificationResult.needs_review_count}
              badgeText={sampleMeta?.badgeText}
              isAnalyzing={isAnalyzing}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Field Checklist (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <FieldChecklist
                  fields={verificationResult.fields}
                  selectedFieldId={selectedFieldId}
                  onSelectField={(id) => setSelectedFieldId(id)}
                />
              </div>

              {/* Right Column: Prioritized Fix Plan Sidebar (5 cols) */}
              <div id="fixplan" className="lg:col-span-5 sticky top-20">
                <FixList
                  fields={verificationResult.fields}
                  onSelectField={(id) => setSelectedFieldId(id)}
                />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Slide-over Evidence Drawer */}
      {activeField && (
        <EvidenceDrawer
          field={activeField}
          onClose={() => setSelectedFieldId(null)}
          onDecision={handleDecision}
          onManualOverride={handleManualOverride}
        />
      )}

      {/* Upload Slot Document Modal */}
      {inspectDocModal && (
        <DocumentModal
          isOpen={true}
          onClose={() => setInspectDocModal(null)}
          title={inspectDocModal.title}
          previewUrl={inspectDocModal.previewUrl}
          fileName={inspectDocModal.fileName}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 dark:border-neutral-800 py-8 text-center text-xs text-neutral-500 dark:text-neutral-400 mt-12">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <div className="font-medium text-neutral-700 dark:text-neutral-300">
            Parity Proof-of-Concept • Deterministic Verification Engine
          </div>

          <div className="text-left bg-[#f5f2ee] dark:bg-[#151a24] border border-neutral-200/70 dark:border-neutral-800 rounded-2xl p-5 space-y-2.5 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed shadow-2xs">
            <span className="font-semibold text-neutral-900 dark:text-white block text-xs uppercase tracking-wider">
              Verification Boundary &amp; Disclaimers
            </span>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px]">
              <li>
                <strong>Deterministic String Containment:</strong> Parity cross-checks extracted claim values against verbatim quotes (&le; 200 chars) from submitted scans.
              </li>
              <li>
                <strong>User Authority:</strong> Parity flags discrepancies and normalizes formats, but always requires human authority to determine which official document governs.
              </li>
              <li>
                <strong>No Eligibility Certification:</strong> Parity verifies clerical document consistency. It does not authenticate physical watermarks or guarantee admission.
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
