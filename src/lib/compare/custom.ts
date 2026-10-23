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
import { normalizeNameTokens } from '../normalize/name';
import { normalizeDate } from '../normalize/dates';
import { normalizeIncome, normalizeMarks } from '../normalize/numbers';

export const PACKET_PRESETS: PacketPreset[] = [
  {
    id: 'scholarship',
    title: 'Scholarship Verification Packet',
    description: 'Standard scholarship application cross-referenced with academic marksheet and official income certificate.',
    documents: [
      { type: 'application_form', label: 'Application Form' },
      { type: 'marksheet', label: 'Marksheet' },
      { type: 'income_certificate', label: 'Income Certificate' },
    ],
    fields: [
      { id: 'name', label: 'Student Name', type: 'name', target_documents: ['application_form', 'marksheet', 'income_certificate'] },
      { id: 'academic_year', label: 'Academic Year', type: 'text', target_documents: ['application_form', 'marksheet'] },
      { id: 'marks', label: 'Marks Percentage', type: 'amount', target_documents: ['application_form', 'marksheet'] },
      { id: 'income', label: 'Annual Family Income', type: 'amount', target_documents: ['application_form', 'income_certificate'] },
      { id: 'issue_date', label: 'Certificate Issue Date', type: 'date', target_documents: ['application_form', 'income_certificate'] },
    ],
  },
  {
    id: 'college_admission',
    title: 'College Admission Packet',
    description: 'University admission portal verification cross-referencing identity, board marks, and application details.',
    documents: [
      { type: 'application_form', label: 'Admission Application' },
      { type: 'marksheet', label: 'High School Marksheet' },
      { type: 'income_certificate', label: 'Identity / Transfer Certificate' },
    ],
    fields: [
      { id: 'name', label: 'Candidate Name', type: 'name', target_documents: ['application_form', 'marksheet', 'income_certificate'] },
      { id: 'dob', label: 'Date of Birth', type: 'date', target_documents: ['application_form', 'income_certificate'] },
      { id: 'id_number', label: 'Application / Roll ID', type: 'id', target_documents: ['application_form', 'marksheet'] },
      { id: 'marks', label: 'Qualifying Exam Marks', type: 'amount', target_documents: ['application_form', 'marksheet'] },
      { id: 'academic_year', label: 'Admission Academic Year', type: 'text', target_documents: ['application_form', 'marksheet'] },
    ],
  },
  {
    id: 'financial_aid',
    title: 'Financial Aid & Fee Waiver Packet',
    description: 'Means-tested tuition assistance cross-referencing family income, tax identifier, and applicant details.',
    documents: [
      { type: 'application_form', label: 'Aid Application Form' },
      { type: 'income_certificate', label: 'Income / Tax Certificate' },
      { type: 'marksheet', label: 'Academic Record' },
    ],
    fields: [
      { id: 'name', label: 'Applicant Name', type: 'name', target_documents: ['application_form', 'income_certificate', 'marksheet'] },
      { id: 'tax_id', label: 'Tax / PAN / SSN ID', type: 'id', target_documents: ['application_form', 'income_certificate'] },
      { id: 'income', label: 'Annual Gross Income', type: 'amount', target_documents: ['application_form', 'income_certificate'] },
      { id: 'issue_date', label: 'Affidavit Issue Date', type: 'date', target_documents: ['application_form', 'income_certificate'] },
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
  sampleUrls?: Record<string, string>
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
        const d = normalizeDate(raw.value);
        normalizedVal = d.iso;
      } else if (fieldDef.type === 'amount') {
        const inc = normalizeIncome(raw.value);
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
      preview_url: sampleUrls?.[docType],
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
      const tokensA = normalizeNameTokens(firstDoc.raw_value || '');
      const tokensB = normalizeNameTokens(currentDoc.raw_value || '');

      const strA = tokensA.join(' ');
      const strB = tokensB.join(' ');

      if (strA === strB) {
        continue;
      }

      // Check initial / abbreviation compatibility
      const hasInitial =
        tokensA.some((t) => t.length === 1) || tokensB.some((t) => t.length === 1);
      const isSubset =
        tokensA.every((t) => tokensB.includes(t)) || tokensB.every((t) => tokensA.includes(t));

      if (hasInitial || isSubset) {
        return {
          field_id: fieldDef.id,
          field_label: fieldDef.label,
          status: 'Needs Review',
          status_reason: `Name abbreviation or initial variation between ${firstDoc.doc_label} ("${firstDoc.raw_value}") and ${currentDoc.doc_label} ("${currentDoc.raw_value}").`,
          documents: comparedDocs,
          diff_explanation: `Name abbreviation/initial detected. Requires student confirmation.`,
          resolution: 'unresolved',
        };
      }

      return {
        field_id: fieldDef.id,
        field_label: fieldDef.label,
        status: 'Conflict',
        status_reason: `Name conflict: ${firstDoc.doc_label} states "${firstDoc.raw_value}", but ${currentDoc.doc_label} states "${currentDoc.raw_value}".`,
        documents: comparedDocs,
        diff_explanation: `Mismatched name across documents.`,
        resolution: 'unresolved',
      };
    }

    if (fieldDef.type === 'date') {
      const dateA = normalizeDate(firstDoc.raw_value);
      const dateB = normalizeDate(currentDoc.raw_value);

      if (dateA.isAmbiguous || dateB.isAmbiguous) {
        return {
          field_id: fieldDef.id,
          field_label: fieldDef.label,
          status: 'Needs Review',
          status_reason: `Date format ambiguous on ${dateA.isAmbiguous ? firstDoc.doc_label : currentDoc.doc_label}.`,
          documents: comparedDocs,
          diff_explanation: `Ambiguous date format (expected DD/MM/YYYY).`,
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
      const incA = normalizeIncome(firstDoc.raw_value);
      const incB = normalizeIncome(currentDoc.raw_value);

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

      if (incA.value !== null && incB.value !== null) {
        if (incA.value === incB.value) continue;
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

      if (markA.isCgpa || markB.isCgpa) {
        return {
          field_id: fieldDef.id,
          field_label: fieldDef.label,
          status: 'Needs Review',
          status_reason: `Non-percentage or CGPA scale detected; requires manual verification.`,
          documents: comparedDocs,
          diff_explanation: `CGPA or non-percentage scale detected.`,
          resolution: 'unresolved',
        };
      }

      if (markA.value !== null && markB.value !== null) {
        if (markA.value === markB.value) continue;
        return {
          field_id: fieldDef.id,
          field_label: fieldDef.label,
          status: 'Conflict',
          status_reason: `Marks conflict: ${firstDoc.doc_label} states ${markA.value}%, but ${currentDoc.doc_label} states ${markB.value}%.`,
          documents: comparedDocs,
          diff_explanation: `Numerical discrepancy of ${Math.abs(markA.value - markB.value).toFixed(1)}%.`,
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

    // Default 'text' type comparison
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
