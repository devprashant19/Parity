'use client';

import React, { useState } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { IngestionZone } from '@/components/IngestionZone';
import { SummaryCounters } from '@/components/SummaryCounters';
import { FieldChecklist } from '@/components/FieldChecklist';
import { FixList } from '@/components/FixList';
import { EvidenceDrawer } from '@/components/EvidenceDrawer';
import {
  CLEAN_SAMPLE_META,
  MESSY_SAMPLE_META,
  CLEAN_SAMPLE_PACKET,
  MESSY_SAMPLE_PACKET,
  SamplePacketMetadata,
} from '@/data/samples';
import { runVerification } from '@/lib/compare/engine';
import { VerificationResult, FieldComparison, ResolutionChoice } from '@/lib/compare/types';
import { processUploadFile } from '@/lib/normalize/image';

export default function HomePage() {
  const [activePacketType, setActivePacketType] = useState<'clean_sample' | 'messy_sample' | 'live' | null>(null);
  const [sampleMeta, setSampleMeta] = useState<SamplePacketMetadata | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [apiErrorBanner, setApiErrorBanner] = useState<string | null>(null);

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

  const handleRunCheck = async () => {
    setApiErrorBanner(null);
    setIsAnalyzing(true);

    if (activePacketType === 'live') {
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

    // Fast simulated execution (300ms) for sample packets to deliver reactive UI feel
    setTimeout(() => {
      let result: VerificationResult;
      if (activePacketType === 'clean_sample') {
        result = runVerification(CLEAN_SAMPLE_PACKET, 'clean_sample');
      } else if (activePacketType === 'messy_sample') {
        result = runVerification(MESSY_SAMPLE_PACKET, 'messy_sample');
      } else {
        result = runVerification(CLEAN_SAMPLE_PACKET, 'clean_sample');
      }

      setVerificationResult(result);
      setIsAnalyzing(false);
    }, 350);
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
    <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#121316] text-[#1A1A1E] dark:text-[#ECECF1] flex flex-col">
      <TopBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Fallback Error Banner */}
        {apiErrorBanner && (
          <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-sm animate-fadeIn dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Live check is unavailable right now</p>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">{apiErrorBanner}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                handleLoadCleanSample();
                handleRunCheck();
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-700 text-white hover:bg-amber-800 transition-colors shadow-sm shrink-0 dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try instant sample packet instead</span>
            </button>
          </div>
        )}

        {/* Step 1: Ingestion Zone */}
        <IngestionZone
          onLoadCleanSample={handleLoadCleanSample}
          onLoadMessySample={handleLoadMessySample}
          onReset={handleReset}
          onRunCheck={handleRunCheck}
          onFileSelect={handleFileSelect}
          onViewDoc={(id) => {
            const doc = uploadedDocs[id];
            if (doc?.previewUrl) window.open(doc.previewUrl, '_blank');
          }}
          sampleMeta={sampleMeta}
          uploadedDocs={uploadedDocs}
          isAnalyzing={isAnalyzing}
          hasRun={verificationResult !== null}
        />

        {/* Step 2: Verification Results (Counters + Checklist + Fix List) */}
        {verificationResult && (
          <div className="space-y-6 animate-fadeIn">
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
              <div className="lg:col-span-5 sticky top-24">
                <FixList
                  fields={verificationResult.fields}
                  onSelectField={(id) => setSelectedFieldId(id)}
                />
              </div>
            </div>
          </div>
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

      <footer className="border-t border-[#E2E2E8] py-8 text-center text-xs text-slate-500 dark:border-[#26282E] dark:text-slate-400">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <div className="font-medium text-slate-700 dark:text-slate-300">
            Parity Proof-of-Concept • Build With AI: Basics Hackathon • Deterministic Inspection Engine
          </div>

          {/* Known Limitations Box */}
          <div className="text-left bg-slate-100/80 border border-slate-200 rounded-xl p-4 space-y-2 text-[11px] text-slate-600 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
              Known Limitations & Verification Boundary:
            </span>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Quote containment vs. scan fidelity:</strong> Parity verifies that each extracted value appears verbatim inside its cited quote excerpt ($\le 200$ chars). However, string containment confirms consistency between the value and the returned text quote—it does not independently prove the quote matches the scan pixels without human review of the source image in the Evidence Drawer.
              </li>
              <li>
                <strong>Human decision authority:</strong> Parity flags mismatches and normalizes formats, but never automatically alters official government certificates or decides which document is legally correct.
              </li>
              <li>
                <strong>No genuineness or eligibility certification:</strong> Parity checks clerical consistency across submitted pages. It does not authenticate watermarks or stamps, check fraud databases, or guarantee scholarship approval.
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
