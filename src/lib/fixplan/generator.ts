import { FieldComparison, ResolutionChoice } from '../compare/types';

export interface FixItem {
  field_id: string;
  field_label: string;
  category: 'fix_before_submitting' | 'needs_manual_review' | 'consistent';
  instruction: string;
  detail: string;
  status: string;
}

export interface FixPlan {
  fixBeforeSubmitting: FixItem[];
  needsManualReview: FixItem[];
  consistent: FixItem[];
  totalActions: number;
}

/**
 * Builds the prioritized fix plan based on the student's decisions and ethical wording rules:
 * - If form is wrong: "Update the application form to [Value]"
 * - If official doc is wrong: "Request a corrected document from the issuing office" (never advise altering official docs)
 * - If not sure or needs review: categorized under needs manual review
 */
export function generateFixPlan(fields: FieldComparison[]): FixPlan {
  const fixBeforeSubmitting: FixItem[] = [];
  const needsManualReview: FixItem[] = [];
  const consistent: FixItem[] = [];

  for (const field of fields) {
    if (field.status === 'Consistent') {
      consistent.push({
        field_id: field.field_id,
        field_label: field.field_label,
        category: 'consistent',
        instruction: 'Verified matching across documents',
        detail: field.diff_explanation,
        status: field.status,
      });
      continue;
    }

    if (field.status === 'Needs Review' || field.resolution === 'not_sure') {
      needsManualReview.push({
        field_id: field.field_id,
        field_label: field.field_label,
        category: 'needs_manual_review',
        instruction: `Review ${field.field_label} manually`,
        detail: field.status_reason || 'Discrepancy or variation detected. Compare physical original documents before submitting.',
        status: field.status,
      });
      continue;
    }

    // It's a Conflict
    if (field.resolution === 'unresolved') {
      // Unresolved conflict: Prompt student to choose
      fixBeforeSubmitting.push({
        field_id: field.field_id,
        field_label: field.field_label,
        category: 'fix_before_submitting',
        instruction: 'Choose which document is correct',
        detail: `Mismatched values detected (${field.diff_explanation}). Open evidence view and select which document has the authoritative record to generate the fix instruction.`,
        status: field.status,
      });
      continue;
    }

    // Conflict resolved by student:
    // Determine which document the student indicated is correct
    // Documents array: index 0 is always Application Form, index 1 is supporting doc (Marksheet or Income Cert)
    const formDoc = field.documents[0];
    const officialDoc = field.documents[1];

    if (field.resolution === 'document_b_correct') {
      // Student selected the official document (Marksheet / Income Cert) as correct
      const correctVal = officialDoc?.raw_value || officialDoc?.normalized_value || '';
      fixBeforeSubmitting.push({
        field_id: field.field_id,
        field_label: field.field_label,
        category: 'fix_before_submitting',
        instruction: `Update the application form to ${correctVal}`,
        detail: `You confirmed that your official ${officialDoc?.doc_label || 'document'} is correct (${correctVal}). Correct the entry on your application form before final submission.`,
        status: field.status,
      });
    } else if (field.resolution === 'document_a_correct') {
      // Student selected the Application Form as correct (implying the official doc is wrong)
      const formVal = formDoc?.raw_value || formDoc?.normalized_value || '';
      fixBeforeSubmitting.push({
        field_id: field.field_id,
        field_label: field.field_label,
        category: 'fix_before_submitting',
        instruction: `Request a corrected document from the issuing office`,
        detail: `Your application states ${formVal}, but your official ${officialDoc?.doc_label || 'document'} states ${officialDoc?.raw_value}. Official credentials cannot be manually altered; contact the issuing authority to obtain a re-issued certificate if incorrect.`,
        status: field.status,
      });
    }
  }

  return {
    fixBeforeSubmitting,
    needsManualReview,
    consistent,
    totalActions: fixBeforeSubmitting.length + needsManualReview.length,
  };
}
