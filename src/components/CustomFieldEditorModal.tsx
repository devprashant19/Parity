'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, RotateCcw, Check, Sliders, Info } from 'lucide-react';
import { CustomFieldDefinition, DocumentType, FieldDataType } from '@/lib/compare/types';

interface CustomFieldEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: CustomFieldDefinition[];
  onSave: (fields: CustomFieldDefinition[]) => void;
  onReset: () => void;
}

const FIELD_TYPES: { type: FieldDataType; label: string; desc: string }[] = [
  { type: 'name', label: 'Name', desc: 'Token set & initial permutation matching' },
  { type: 'date', label: 'Date', desc: 'Normalized ISO calendar date comparison (DD/MM/YYYY, etc.)' },
  { type: 'amount', label: 'Amount / Score', desc: 'Monetary values (INR/USD, monthly scaling) or percentages' },
  { type: 'id', label: 'ID / Code', desc: 'Alphanumeric uppercase stripped equality' },
  { type: 'text', label: 'General Text', desc: 'Normalized verbatim text comparison' },
];

const AVAILABLE_DOCS: { type: DocumentType; label: string }[] = [
  { type: 'application_form', label: 'Application Form' },
  { type: 'marksheet', label: 'Marksheet' },
  { type: 'income_certificate', label: 'Certificate / Proof' },
];

export const CustomFieldEditorModal: React.FC<CustomFieldEditorModalProps> = ({
  isOpen,
  onClose,
  fields,
  onSave,
  onReset,
}) => {
  const [editableFields, setEditableFields] = useState<CustomFieldDefinition[]>(fields);

  // Sync with prop when opened
  React.useEffect(() => {
    setEditableFields(fields);
  }, [fields, isOpen]);

  if (!isOpen) return null;

  const handleAddField = () => {
    const newId = `field_${Date.now()}`;
    setEditableFields((prev) => [
      ...prev,
      {
        id: newId,
        label: `Custom Field ${prev.length + 1}`,
        type: 'text',
        target_documents: ['application_form', 'marksheet'],
      },
    ]);
  };

  const handleRemoveField = (id: string) => {
    setEditableFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFieldChange = (id: string, updates: Partial<CustomFieldDefinition>) => {
    setEditableFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleToggleDoc = (fieldId: string, docType: DocumentType) => {
    setEditableFields((prev) =>
      prev.map((f) => {
        if (f.id !== fieldId) return f;
        const exists = f.target_documents.includes(docType);
        const updatedDocs = exists
          ? f.target_documents.filter((d) => d !== docType)
          : [...f.target_documents, docType];
        // Ensure at least one doc is selected
        return { ...f, target_documents: updatedDocs.length > 0 ? updatedDocs : [docType] };
      })
    );
  };

  const handleSaveAndApply = () => {
    onSave(editableFields);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#121620] w-full max-w-2xl max-h-[90vh] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-[#ef4d23]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Custom Field Editor
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Configure cross-referenced packet fields and deterministic rule mapping.
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

        {/* Informational callout */}
        <div className="mx-4 sm:mx-5 mt-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/70 dark:border-neutral-800 flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-300">
          <Info className="w-4 h-4 text-[#ef4d23] shrink-0 mt-0.5" />
          <p>
            The deterministic engine validates values strictly against each field’s declared data type.
            The AI model never decides whether fields match.
          </p>
        </div>

        {/* Field List Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {editableFields.length === 0 ? (
            <div className="text-center py-10 text-neutral-400 text-xs">
              No fields configured. Click "Add Custom Field" to start.
            </div>
          ) : (
            editableFields.map((f, idx) => (
              <div
                key={f.id}
                className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[11px] font-mono font-semibold text-neutral-400 w-5">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => handleFieldChange(f.id, { label: e.target.value })}
                      placeholder="Field Label (e.g., Student Name)"
                      className="flex-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-[#ef4d23]"
                    />
                  </div>

                  <select
                    value={f.type}
                    onChange={(e) => handleFieldChange(f.id, { type: e.target.value as FieldDataType })}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-[#ef4d23]"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.type} value={t.type}>
                        Type: {t.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveField(f.id)}
                    className="w-7 h-7 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center transition-colors cursor-pointer"
                    title="Delete field"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Target documents checkbox selector */}
                <div className="pt-2 border-t border-neutral-200/50 dark:border-neutral-800/80 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Compare across:
                  </span>
                  {AVAILABLE_DOCS.map((doc) => {
                    const isChecked = f.target_documents.includes(doc.type);
                    return (
                      <button
                        key={doc.type}
                        type="button"
                        onClick={() => handleToggleDoc(f.id, doc.type)}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent'
                            : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-[#ef4d23]' : 'bg-neutral-300 dark:bg-neutral-600'}`} />
                        {doc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddField}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Field</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onReset();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[#ef4d23] hover:bg-[#e03d13] text-white shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Re-evaluate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
