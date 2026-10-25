'use client';

import React, { useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, CheckCircle, Eye } from 'lucide-react';

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
      className="bg-white dark:bg-[#121620] rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between hover-card-lift transition-all duration-300"
    >
      <input
        type="file"
        data-testid={`upload-input-${id}`}
        ref={fileInputRef}
        onChange={handleChange}
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
              loadedDoc
                ? 'bg-[#ef4d23]/10 text-[#ef4d23] dark:bg-[#ef4d23]/20'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
          >
            {id === 'application_form' ? (
              <FileText className="w-4 h-4" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-neutral-900 dark:text-white leading-tight">
              {label}
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-tight">
              {expectedType}
            </p>
          </div>
        </div>

        {loadedDoc && (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full px-2.5 py-0.5 text-[11px] font-medium border border-emerald-200/60 dark:border-emerald-800/60 animate-checkmarkPop shadow-2xs">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Ready</span>
          </span>
        )}
      </div>

      {/* Body / Uploaded Preview or Dropzone */}
      {loadedDoc ? (
        <div className="mt-4 flex items-center justify-between bg-[#f5f2ee] dark:bg-[#182030] p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 animate-fadeIn transition-all duration-200">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {loadedDoc.previewUrl ? (
              <img
                src={loadedDoc.previewUrl}
                alt={loadedDoc.fileName}
                className="w-10 h-10 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700 shrink-0 cursor-pointer hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-200"
                onClick={onViewDoc}
              />
            ) : (
              <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center text-xs font-mono text-neutral-600 dark:text-neutral-300">
                DOC
              </div>
            )}
            <div className="truncate">
              <p
                onClick={onViewDoc}
                className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate cursor-pointer hover:text-[#ef4d23] transition-colors"
              >
                {loadedDoc.fileName}
              </p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                {loadedDoc.fileSize} • Verified Document
              </p>
            </div>
          </div>

          <div className="flex items-center shrink-0 ml-2">
            {onViewDoc && (
              <button
                type="button"
                onClick={onViewDoc}
                className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-200 bg-white dark:bg-[#121620] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
              >
                <Eye className="w-3 h-3 text-neutral-500" />
                <span>Inspect</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 py-4 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#ef4d23] hover:bg-[#ef4d23]/5 transition-colors group"
        >
          <Upload className="w-4 h-4 text-neutral-400 group-hover:text-[#ef4d23] transition-transform duration-200 group-hover:-translate-y-0.5 mb-1.5" />
          <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
            Drop scan or <span className="text-[#ef4d23] font-semibold underline underline-offset-2">browse</span>
          </p>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>
        </div>
      )}
    </div>
  );
}
