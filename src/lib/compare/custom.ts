import {
  CustomFieldDefinition,
  DocumentComparisonEntry,
  DocumentExtraction,
  DocumentType,
  FieldComparison,
  FieldDataType,
  FieldStatus,
  PacketPreset,
  CONFIDENCE_THRESHOLD,
} from './types';
import { verifyQuoteContainment } from './containment';
import { normalizeNameTokens, compareNames } from '../normalize/name';
import { normalizeDate, normalizeAcademicYear } from '../normalize/dates';
import { normalizeIncome, normalizeMarks } from '../normalize/numbers';

export const PACKET_PRESETS: PacketPreset[] = [
  {
    id: 'scholarship',
    title: 'Scholarship Verification Packet',
    description: 'Standard scholarship application cross-referenced with academic transcript and official income / tax statement.',
    documents: [
      { type: 'application_form', label: 'Application Form' },
      { type: 'marksheet', label: 'Academic Transcript' },
      { type: 'income_certificate', label: 'Proof of Income / Tax Statement' },
    ],
    fields: [
      { id: 'name', label: 'Student Name', type: 'name', target_documents: ['application_form', 'marksheet', 'income_certificate'] },
      { id: 'academic_year', label: 'Academic Year', type: 'text', target_documents: ['application_form', 'marksheet'] },
      { id: 'marks', label: 'Academic Performance / GPA', type: 'amount', target_documents: ['application_form', 'marksheet'] },
      { id: 'income', label: 'Annual Household Income', type: 'amount', target_documents: ['application_form', 'income_certificate'] },
      { id: 'issue_date', label: 'Document Issue Date', type: 'date', target_documents: ['application_form', 'income_certificate'] },
    ],
  },
  {
    id: 'college_admission',
    title: 'College Admission Packet',
    description: 'University admission portal verification cross-referencing identity, academic record, and application details.',
    documents: [
      { type: 'application_form', label: 'Admission Application' },
      { type: 'marksheet', label: 'Academic Transcript' },
      { type: 'income_certificate', label: 'Identity / Transfer Certificate' },
    ],
    fields: [
      { id: 'name', label: 'Candidate Name', type: 'name', target_documents: ['application_form', 'marksheet', 'income_certificate'] },
      { id: 'dob', label: 'Date of Birth', type: 'date', target_documents: ['application_form', 'income_certificate'] },
      { id: 'id_number', label: 'Application / Student ID', type: 'id', target_documents: ['application_form', 'marksheet'] },
      { id: 'marks', label: 'Qualifying GPA / Score', type: 'amount', target_documents: ['application_form', 'marksheet'] },
      { id: 'academic_year', label: 'Admission Academic Year', type: 'text', target_documents: ['application_form', 'marksheet'] },
    ],
  },
  {
    id: 'financial_aid',
    title: 'Financial Aid & Fee Waiver Packet',
    description: 'Means-tested tuition assistance cross-referencing family income, tax identifier, and applicant details.',
    documents: [
      { type: 'application_form', label: 'Aid Application Form' },
      { type: 'income_certificate', label: 'Official Tax / Income Statement' },
      { type: 'marksheet', label: 'Academic Record' },
    ],
    fields: [
      { id: 'name', label: 'Applicant Name', type: 'name', target_documents: ['application_form', 'income_certificate', 'marksheet'] },
      { id: 'tax_id', label: 'Tax / Identity Number', type: 'id', target_documents: ['application_form', 'income_certificate'] },
      { id: 'income', label: 'Annual Gross Income', type: 'amount', target_documents: ['application_form', 'income_certificate'] },
      { id: 'issue_date', label: 'Statement Issue Date', type: 'date', target_documents: ['application_form', 'income_certificate'] },
      { id: 'category', label: 'Aid Category', type: 'text', target_documents: ['application_form', 'income_certificate'] },
    ],
  },
];

/**
 * Normalizes identifier strings (removes spaces, hyphens, dots, underscores, case-insensitive).
 */
export function normalizeIdentifier(val: string | null): string | null {
  if (!val) return null;
  const clean = val.trim().toUpperCase().replace(/[\s\-_/.]/g, '');
  return clean.length > 0 ? clean : null;
}

/**
 * Normalizes generic text (trims whitespace, collapses internal spaces).
 */
export function normalizeGenericText(val: string | null): string | null {
  if (!val) return null;
  const clean = val.trim().replace(/\s+/g, ' ');
  return clean.length > 0 ? clean : null;
}

/**
 * Evaluates any custom field definition across its target documents
 * using deterministic rules based on the field's data type.
 * RULE: The model NEVER decides whether values match.
 */
export function evaluateCustomField(
  fieldDef: CustomFieldDefinition,
  docMap: Map<string, DocumentExtraction>,
  sampleUrls?: Record<string, string>,
  dateFormatSetting: 'Auto' | 'DMY' | 'MDY' = 'Auto'
): FieldComparison {
  const comparedDocs: DocumentComparisonEntry[] = [];

  for (const docType of fieldDef.target_documents) {
    const doc = docMap.get(docType);
    const raw = doc?.fields.find((f) => f.field_id === fieldDef.id) || null;

    let normalizedVal: string | number | null = raw?.value || null;
    if (raw?.value) {
      if (fieldDef.type === 'id') {
        normalizedVal = normalizeIdentifier(raw.value);
      } else if (fieldDef.type === 'date') {
        const d = normalizeDate(raw.value, dateFormatSetting);
        normalizedVal = d.iso;
      } else if (fieldDef.type === 'amount') {
        const inc = normalizeIncome(raw.value, raw.quote);
        if (inc.value !== null) {
          normalizedVal = inc.value;
        } else {
          const m = normalizeMarks(raw.value);
          normalizedVal = m.value !== null ? m.value : raw.value;
        }
      } else if (fieldDef.type === 'name') {
        normalizedVal = normalizeNameTokens(raw.value).join(' ');
      } else {
        normalizedVal = normalizeGenericText(raw.value);
      }
    }

    comparedDocs.push({
      doc_type: docType,
      doc_label: doc?.document_label || docType,
      raw_value: raw?.value || null,
      normalized_value: normalizedVal,
      quote: raw?.quote || null,
      page: raw?.page || 1,
      confidence: raw?.confidence ?? 0,
      source: raw?.source || 'extracted',
      highlight_bbox: raw?.highlight_bbox,
      double_read: raw?.double_read,
      preview_url: doc?.preview_url || sampleUrls?.[docType],
    });
  }

  // 1. Missing or unreadable values
  const missingDoc = comparedDocs.find((d) => !d.raw_value || d.raw_value.trim().length === 0);
  if (missingDoc) {
    return {
      field_id: fieldDef.id,
      field_label: fieldDef.label,
      status: 'Needs Review',
      status_reason: `Value missing or unreadable on ${missingDoc.doc_label}.`,
      documents: comparedDocs,
      diff_explanation: `Value missing or unreadable on ${missingDoc.doc_label}.`,
      resolution: 'unresolved',
    };
  }

  // 2. Quote containment checks
  for (const d of comparedDocs) {
    if (!verifyQuoteContainment(d.raw_value, d.quote)) {
      return {
        field_id: fieldDef.id,
        field_label: fieldDef.label,
        status: 'Needs Review',
        status_reason: `Extracted value could not be confirmed in verbatim quote on ${d.doc_label}.`,
        documents: comparedDocs,
        diff_explanation: `Quote verification failed on ${d.doc_label}.`,
        resolution: 'unresolved',
      };
    }
  }

  // 3. OCR confidence check
  const lowConfDoc = comparedDocs.find((d) => d.confidence < CONFIDENCE_THRESHOLD);
  if (lowConfDoc) {
    return {
      field_id: fieldDef.id,
      field_label: fieldDef.label,
      status: 'Needs Review',
      status_reason: `Value extracted with low OCR confidence (${(lowConfDoc.confidence * 100).toFixed(0)}%) on ${lowConfDoc.doc_label}.`,
      documents: comparedDocs,
      diff_explanation: `Low OCR confidence on ${lowConfDoc.doc_label}.`,
      resolution: 'unresolved',
    };
  }

  // 4. Double-read verification check
  for (const d of comparedDocs) {
    if (d.double_read && !d.double_read.agreed) {
      const reason =
        d.double_read.disagreement_reason ||
        `Double-read mismatch on ${d.doc_label}: full-page read disagrees with isolated bounding-box crop read.`;
      return {
        field_id: fieldDef.id,
        field_label: fieldDef.label,
        status: 'Needs Review',
        status_reason: reason,
        documents: comparedDocs,
        diff_explanation: reason,
        resolution: 'unresolved',
      };
    }
  }

  // 5. Deterministic type comparison across compared documents
  if (comparedDocs.length <= 1) {
    return {
      field_id: fieldDef.id,
      field_label: fieldDef.label,
      status: 'Consistent',
      status_reason: `Verified on single document ${comparedDocs[0].doc_label}.`,
      documents: comparedDocs,
      diff_explanation: `Verified on ${comparedDocs[0].doc_label}.`,
      resolution: 'unresolved',
    };
  }

  const firstDoc = comparedDocs[0];

  // Compare every subsequent doc against the first doc
  for (let i = 1; i < comparedDocs.length; i++) {
    const currentDoc = comparedDocs[i];

    if (fieldDef.type === 'name') {
      const comp = compareNames(firstDoc.raw_value, currentDoc.raw_value);

      if (comp.status === 'Consistent') {
        continue;
      }

      if (comp.status === 'Needs Review') {
        return {
          field_id: fieldDef.id,
          field_label: fieldDef.label,
          status: 'Needs Review',
          status_reason: comp.reason,
          documents: comparedDocs,
          diff_explanation: comp.reason,
          resolution: 'unresolved',
        };
      }

      return {
        field_id: fieldDef.id,
        field_label: fieldDef.label,
        status: 'Conflict',
        status_reason: comp.reason,
        documents: comparedDocs,
        diff_explanation: comp.reason,
        resolution: 'unresolved',
      };
    }

    if (fieldDef.type === 'date') {
      const dateA = normalizeDate(firstDoc.raw_value, dateFormatSetting);
      const dateB = normalizeDate(currentDoc.raw_value, dateFormatSetting);

      if (dateA.isAmbiguous || dateB.isAmbiguous) {
        return {
          field_id: fieldDef.id,
          field_label: fieldDef.label,
          status: 'Needs Review',
          status_reason: dateA.ambiguityReason || dateB.ambiguityReason || `Date format ambiguous on ${dateA.isAmbiguous ? firstDoc.doc_label : currentDoc.doc_label}.`,
          documents: comparedDocs,
          diff_explanation: `Ambiguous date format.`,
          resolution: 'unresolved',
        };
      }

      if (dateA.iso && dateB.iso && dateA.iso === dateB.iso) {
        continue;
      }

      return {
        field_id: fieldDef.id,
        field_label: fieldDef.label,
        status: 'Conflict',
        status_reason: `Date conflict: ${firstDoc.doc_label} states ${firstDoc.raw_value} (${dateA.iso}), but ${currentDoc.doc_label} states ${currentDoc.raw_value} (${dateB.iso}).`,
        documents: comparedDocs,
        diff_explanation: `Calendar date mismatch.`,
        resolution: 'unresolved',
      };
    }

    if (fieldDef.type === 'amount') {
      const incA = normalizeIncome(firstDoc.raw_value, firstDoc.quote);
      const incB = normalizeIncome(currentDoc.raw_value, currentDoc.quote);

      if (incA.value !== null && incB.value !== null) {
        if (incA.isAmbiguous || incB.isAmbiguous) {
          return {
            field_id: fieldDef.id,
            field_label: fieldDef.label,
            status: 'Needs Review',
            status_reason: `Amount frequency or period ambiguous across documents.`,
            documents: comparedDocs,
            diff_explanation: `Ambiguous amount period.`,
            resolution: 'unresolved',
          };
        }

        if (incA.currency !== 'UNKNOWN' && incB.currency !== 'UNKNOWN' && incA.currency !== incB.currency) {
          return {
            field_id: fieldDef.id,
            field_label: fieldDef.label,
            status: 'Needs Review',
            status_reason: `Different currencies detected (${incA.currency} vs ${incB.currency}); requires manual exchange rate review.`,
            documents: comparedDocs,
            diff_explanation: `Currency mismatch (${incA.currency} vs ${incB.currency}).`,
            resolution: 'unresolved',
          };
        }

        if (incA.value === incB.value) {
          continue;
        }

        return {
          field_id: fieldDef.id,
          field_label: fieldDef.label,
          status: 'Conflict',
          status_reason: `Amount conflict: ${firstDoc.doc_label} specifies ${firstDoc.raw_value} (normalized to ${incA.value}), but ${currentDoc.doc_label} specifies ${currentDoc.raw_value} (normalized to ${incB.value}).`,
          documents: comparedDocs,
          diff_explanation: `Numerical discrepancy of ${Math.abs(incA.value - incB.value)}.`,
          resolution: 'unresolved',
        };
      }

      const markA = normalizeMarks(firstDoc.raw_value);
      const markB = normalizeMarks(currentDoc.raw_value);

      if (markA.value !== null && markB.value !== null) {
        if (markA.scale !== markB.scale) {
          return {
            field_id: fieldDef.id,
            field_label: fieldDef.label,
            status: 'Needs Review',
            status_reason: `Different GPA / grading scales detected (${markA.scale} vs ${markB.scale}); requires manual verification.`,
            documents: comparedDocs,
            diff_explanation: `Grading scales differ (${markA.scale} vs ${markB.scale}).`,
            resolution: 'unresolved',
          };
        }

        if (markA.value === markB.value) continue;

        return {
          field_id: fieldDef.id,
          field_label: fieldDef.label,
          status: 'Conflict',
          status_reason: `Academic score conflict: ${firstDoc.doc_label} states ${markA.value}, but ${currentDoc.doc_label} states ${markB.value}.`,
          documents: comparedDocs,
          diff_explanation: `Discrepancy of ${Math.abs(markA.value - markB.value).toFixed(2)}.`,
          resolution: 'unresolved',
        };
      }
    }

    if (fieldDef.type === 'id') {
      const idA = normalizeIdentifier(firstDoc.raw_value);
      const idB = normalizeIdentifier(currentDoc.raw_value);

      if (idA === idB) continue;

      return {
        field_id: fieldDef.id,
        field_label: fieldDef.label,
        status: 'Conflict',
        status_reason: `Identifier conflict: ${firstDoc.doc_label} records "${firstDoc.raw_value}" (clean: ${idA}), but ${currentDoc.doc_label} records "${currentDoc.raw_value}" (clean: ${idB}).`,
        documents: comparedDocs,
        diff_explanation: `Alphanumeric identifier mismatch.`,
        resolution: 'unresolved',
      };
    }

    // Default 'text' type comparison: check academic year compatibility first
    const ayA = normalizeAcademicYear(firstDoc.raw_value);
    const ayB = normalizeAcademicYear(currentDoc.raw_value);
    if (ayA && ayB && ayA === ayB) {
      continue;
    }

    const textA = normalizeGenericText(firstDoc.raw_value)?.toLowerCase();
    const textB = normalizeGenericText(currentDoc.raw_value)?.toLowerCase();

    if (textA === textB) continue;

    return {
      field_id: fieldDef.id,
      field_label: fieldDef.label,
      status: 'Conflict',
      status_reason: `Text conflict: ${firstDoc.doc_label} records "${firstDoc.raw_value}", but ${currentDoc.doc_label} records "${currentDoc.raw_value}".`,
      documents: comparedDocs,
      diff_explanation: `Text mismatch across documents.`,
      resolution: 'unresolved',
    };
  }

  return {
    field_id: fieldDef.id,
    field_label: fieldDef.label,
    status: 'Consistent',
    status_reason: `Deterministic match across all ${comparedDocs.length} documents.`,
    documents: comparedDocs,
    diff_explanation: `Consistent across all documents.`,
    resolution: 'unresolved',
  };
}
