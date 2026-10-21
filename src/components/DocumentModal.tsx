'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

export interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  previewUrl?: string;
  fileName?: string;
}

export function DocumentModal({ isOpen, onClose, title, previewUrl, fileName }: DocumentModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col dark:bg-[#1A1B20] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-serif-heading text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            {fileName && <p className="text-xs text-slate-500 dark:text-slate-400">{fileName}</p>}
          </div>

          <div className="flex items-center space-x-2">
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 dark:bg-slate-900">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={title}
              className="max-h-[75vh] w-auto object-contain rounded-lg shadow-md border border-slate-200 dark:border-slate-800"
            />
          ) : (
            <p className="text-sm text-slate-400">Document preview unavailable</p>
          )}
        </div>
      </div>
    </div>
  );
}
