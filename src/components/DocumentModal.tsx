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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col dark:bg-[#121620] border border-neutral-200/90 dark:border-neutral-800 animate-badgePop">
        {/* Header in #f5f2ee */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-[#f5f2ee] dark:bg-[#182030] border-b border-neutral-200/80 dark:border-neutral-700/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#ef4d23] font-medium text-xs">Scan Inspector</span>
              <span className="text-neutral-400">•</span>
              <span className="text-xs text-neutral-500 font-mono">{fileName}</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mt-0.5">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors"
                title="Open original scan in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scan Viewer */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-neutral-100/70 dark:bg-[#0b0f1a]">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={title}
              className="max-h-[72vh] w-auto object-contain rounded-2xl shadow-md border border-neutral-200 dark:border-neutral-800"
            />
          ) : (
            <p className="text-sm font-medium text-neutral-400">Document preview unavailable</p>
          )}
        </div>
      </div>
    </div>
  );
}
