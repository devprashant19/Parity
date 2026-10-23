import { FieldStatus, PairwiseComparison } from './types';
import { compareNames } from '../normalize/name';

export interface EvaluatedNameComparison {
  status: FieldStatus;
  status_reason: string;
  pairwise_details: PairwiseComparison[];
}

/**
 * Precedence rule: Conflict > Needs Review > Consistent
 */
export function combineStatuses(statusA: FieldStatus, statusB: FieldStatus): FieldStatus {
  if (statusA === 'Conflict' || statusB === 'Conflict') {
    return 'Conflict';
  }
  if (statusA === 'Needs Review' || statusB === 'Needs Review') {
    return 'Needs Review';
  }
  return 'Consistent';
}

/**
 * Compares Name across Application Form, Marksheet, and Income Certificate.
 * Evaluates pairwise:
 *   Pair 1: Form vs Marksheet
 *   Pair 2: Form vs Income Certificate
 */
export function evaluateNamePairwise(
  formName: string | null,
  marksheetName: string | null,
  incomeCertName: string | null
): EvaluatedNameComparison {
  const pair1 = compareNames(formName, marksheetName);
  const pair2 = compareNames(formName, incomeCertName);

  const pairwise_details: PairwiseComparison[] = [
    {
      doc_a_label: 'Application Form',
      doc_b_label: 'Academic Transcript',
      doc_a_value: formName,
      doc_b_value: marksheetName,
      status: pair1.status,
      reason: pair1.reason,
    },
    {
      doc_a_label: 'Application Form',
      doc_b_label: 'Proof of Income',
      doc_a_value: formName,
      doc_b_value: incomeCertName,
      status: pair2.status,
      reason: pair2.reason,
    },
  ];

  const overallStatus = combineStatuses(pair1.status, pair2.status);

  let status_reason = '';
  if (overallStatus === 'Consistent') {
    status_reason = 'Name matches identically across Application Form, Academic Transcript, and Proof of Income.';
  } else if (overallStatus === 'Conflict') {
    if (pair1.status === 'Conflict' && pair2.status === 'Conflict') {
      status_reason = `Name conflict with both Academic Transcript (${pair1.reason}) and Proof of Income (${pair2.reason}).`;
    } else if (pair1.status === 'Conflict') {
      status_reason = `Name conflict with Academic Transcript: ${pair1.reason}.`;
    } else {
      status_reason = `Name conflict with Proof of Income: ${pair2.reason}.`;
    }
  } else {
    // Needs Review
    if (pair1.status === 'Needs Review' && pair2.status === 'Needs Review') {
      status_reason = `Name variation detected: ${pair1.reason}; ${pair2.reason}.`;
    } else if (pair1.status === 'Needs Review') {
      status_reason = `Name variation with Academic Transcript: ${pair1.reason}.`;
    } else {
      status_reason = `Name variation with Proof of Income: ${pair2.reason}.`;
    }
  }

  return {
    status: overallStatus,
    status_reason,
    pairwise_details,
  };
}
