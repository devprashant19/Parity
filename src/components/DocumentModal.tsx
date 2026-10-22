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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col dark:bg-[#10141E] border border-slate-200 dark:border-[#1F293D] animate-badgePop">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-[#1F293D]">
          <div>
            <h3 className="font-serif-heading text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">{title}</h3>
            {fileName && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono-val">{fileName}</p>}
          </div>

          <div className="flex items-center space-x-2">
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-[#182030] transition-colors cursor-pointer active-press"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-[#182030] transition-all duration-200 cursor-pointer active-press group"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-100/80 dark:bg-[#080A0F]">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={title}
              className="max-h-[72vh] w-auto object-contain rounded-xl shadow-md border border-slate-200 dark:border-[#1F293D]"
            />
          ) : (
            <p className="text-sm font-medium text-slate-400">Document preview unavailable</p>
          )}
        </div>
      </div>
    </div>
  );
}
