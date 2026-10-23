'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Download, Mail, Building, FileText } from 'lucide-react';
import { FieldComparison } from '@/lib/compare/types';
import { draftIssuingOfficeMessage } from '@/lib/report/messageDrafter';

interface IssuingOfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: FieldComparison[];
  initialFieldId?: string | null;
}

export const IssuingOfficeModal: React.FC<IssuingOfficeModalProps> = ({
  isOpen,
  onClose,
  fields,
  initialFieldId,
}) => {
  const eligibleFields = fields.filter((f) => f.status === 'Conflict' || f.status === 'Needs Review');
  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    initialFieldId || eligibleFields[0]?.field_id || fields[0]?.field_id || ''
  );
  const detectedName = fields.find((f) => f.field_id === 'name')?.documents[0]?.raw_value;
  const [studentName, setStudentName] = useState(detectedName || 'Alex Morgan');
  const [referenceId, setReferenceId] = useState('APP-2024-8891');
  const [copied, setCopied] = useState(false);

  // Sync if initialFieldId changes
  React.useEffect(() => {
    if (initialFieldId) {
      setSelectedFieldId(initialFieldId);
    }
  }, [initialFieldId]);

  if (!isOpen) return null;

  const activeField = fields.find((f) => f.field_id === selectedFieldId) || eligibleFields[0] || fields[0];

  const drafted = activeField
    ? draftIssuingOfficeMessage({
        field: activeField,
        studentName,
        referenceId,
      })
    : null;

  const handleCopy = () => {
    if (!drafted) return;
    navigator.clipboard.writeText(`${drafted.subject}\n\n${drafted.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadTxt = () => {
    if (!drafted) return;
    const content = `SUBJECT: ${drafted.subject}\n\n${drafted.body}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `correction-request-${activeField?.field_id || 'document'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#121620] w-full max-w-2xl max-h-[90vh] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Draft Correction Request to Issuing Office
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Formal letter citing verbatim quotes and discrepancy details for administrative rectification.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
              Select Field Discrepancy
            </label>
            <select
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-[#ef4d23]"
            >
              {fields.map((f) => (
                <option key={f.field_id} value={f.field_id}>
                  {f.field_label} ({f.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
              Applicant Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Your Name"
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-[#ef4d23]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
              Application / Roll No.
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g. ROLL-12345"
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-[#ef4d23]"
            />
          </div>
        </div>

        {/* Draft Message Preview Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {drafted ? (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800/70 rounded-lg text-neutral-800 dark:text-neutral-200 font-semibold border border-neutral-200 dark:border-neutral-700">
                <span className="text-neutral-500 font-normal">Subject: </span>
                {drafted.subject}
              </div>
              <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                {drafted.body}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-400 text-xs">
              No field selected.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/40">
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .txt</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[#ef4d23] hover:bg-[#e03d13] text-white shadow-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Message'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
