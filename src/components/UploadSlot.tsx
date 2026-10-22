'use client';

import React, { useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, CheckCircle } from 'lucide-react';

export interface UploadSlotProps {
  id: 'application_form' | 'marksheet' | 'income_certificate';
  label: string;
  expectedType: string;
  description: string;
  loadedDoc: { fileName: string; fileSize: string; previewUrl?: string; isSample?: boolean } | null;
  onFileSelect: (file: File) => void;
  onViewDoc?: () => void;
}

export function UploadSlot({
  id,
  label,
  expectedType,
  description,
  loadedDoc,
  onFileSelect,
  onViewDoc,
}: UploadSlotProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
        loadedDoc
          ? 'bg-white border-[#E2E8F0] shadow-xs dark:bg-[#10141E] dark:border-[#1F293D] hover-card-lift'
          : 'bg-slate-50/70 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/20 dark:bg-[#0A0D14] dark:border-[#1F293D] dark:hover:border-blue-500/60 dark:hover:bg-blue-950/20'
      }`}
    >
      <input
        type="file"
        data-testid={`upload-input-${id}`}
        ref={fileInputRef}
        onChange={handleChange}
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
      />

      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
              loadedDoc
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 scale-100'
                : 'bg-slate-100 text-slate-500 dark:bg-[#182030] dark:text-slate-400 border border-slate-200/60 dark:border-slate-800'
            }`}
          >
            {id === 'application_form' ? (
              <FileText className="w-4 h-4" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">{label}</h3>
            <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">{expectedType}</p>
          </div>
        </div>

        {loadedDoc && (
          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800 px-2 py-0.5 rounded-full animate-badgePop">
            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Ready</span>
          </span>
        )}
      </div>

      {loadedDoc ? (
        <div className="mt-4 flex items-center justify-between bg-slate-50/90 dark:bg-[#182030] p-2.5 rounded-xl border border-slate-200/80 dark:border-[#1F293D] transition-colors">
          <div className="flex items-center space-x-3 overflow-hidden">
            {loadedDoc.previewUrl ? (
              <img
                src={loadedDoc.previewUrl}
                alt={loadedDoc.fileName}
                className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer hover:opacity-90 hover:scale-105 active-press transition-all duration-200 shadow-xs"
                onClick={onViewDoc}
              />
            ) : (
              <div className="w-10 h-10 bg-slate-200 dark:bg-[#202B40] rounded-lg flex items-center justify-center text-xs font-mono-val text-slate-600 dark:text-slate-400">
                DOC
              </div>
            )}
            <div className="truncate">
              <p
                onClick={onViewDoc}
                className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {loadedDoc.fileName}
              </p>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                {loadedDoc.fileSize} {loadedDoc.isSample ? '• Pre-verified Sample' : '• Uploaded'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {onViewDoc && (
              <button
                type="button"
                onClick={onViewDoc}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-150 cursor-pointer active-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Inspect
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 py-4 border border-dashed border-slate-300/80 dark:border-[#1F293D] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-all duration-200 group active-press"
        >
          <Upload className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-transform duration-200 group-hover:-translate-y-0.5 mb-1.5" />
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Drop file or <span className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2">browse</span>
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">{description}</p>
        </div>
      )}
    </div>
  );
}
