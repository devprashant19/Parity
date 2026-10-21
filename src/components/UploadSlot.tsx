'use client';

import React from 'react';
import { FileText, Image as ImageIcon, CheckCircle, Upload } from 'lucide-react';

export interface DocumentSlotProps {
  id: 'application_form' | 'marksheet' | 'income_certificate';
  label: string;
  expectedType: string;
  description: string;
  loadedDoc?: {
    fileName: string;
    fileSize: string;
    previewUrl?: string;
    isSample?: boolean;
  } | null;
  onFileSelect?: (file: File) => void;
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
}: DocumentSlotProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect?.(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect?.(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`relative rounded-xl border p-4 transition-all duration-200 ${
        loadedDoc
          ? 'bg-white border-[#E2E2E8] shadow-sm dark:bg-[#1A1B20] dark:border-[#26282E]'
          : 'bg-[#FDFDFC] border-dashed border-slate-300 hover:border-slate-400 dark:bg-[#151619] dark:border-slate-700'
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
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              loadedDoc
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {id === 'application_form' ? (
              <FileText className="w-4 h-4" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#1A1A1E] dark:text-[#ECECF1]">{label}</h4>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{expectedType}</p>
          </div>
        </div>

        {loadedDoc && (
          <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            <span>Ready</span>
          </span>
        )}
      </div>

      {loadedDoc ? (
        <div className="mt-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            {loadedDoc.previewUrl ? (
              <img
                src={loadedDoc.previewUrl}
                alt={loadedDoc.fileName}
                className="w-10 h-10 object-cover rounded border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={onViewDoc}
              />
            ) : (
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-xs text-slate-500">
                DOC
              </div>
            )}
            <div className="truncate">
              <p
                onClick={onViewDoc}
                className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:underline"
              >
                {loadedDoc.fileName}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {loadedDoc.fileSize} {loadedDoc.isSample ? '• Sample' : '• Uploaded'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {onViewDoc && (
              <button
                type="button"
                onClick={onViewDoc}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
              >
                Inspect
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 py-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <Upload className="w-4 h-4 text-slate-400 mb-1" />
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Drop file or <span className="text-blue-600 dark:text-blue-400 underline">browse</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{description}</p>
        </div>
      )}
    </div>
  );
}
