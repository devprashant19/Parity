import {
  DocumentExtraction,
  DocumentComparisonEntry,
  FieldComparison,
  FieldId,
  FieldStatus,
  VerificationResult,
  CONFIDENCE_THRESHOLD,
} from './types';
import { verifyQuoteContainment } from './containment';
import { evaluateNamePairwise } from './name';
import { normalizeIncome, normalizeMarks } from '../normalize/numbers';
import { normalizeDate } from '../normalize/dates';

export function runVerification(
  extractions: DocumentExtraction[],
  packetType: 'clean_sample' | 'messy_sample' | 'live' = 'live'
): VerificationResult {
  const docMap = new Map<string, DocumentExtraction>();
  for (const doc of extractions) {
    docMap.set(doc.document_type, doc);
  }

  const form = docMap.get('application_form');
  const marksheet = docMap.get('marksheet');
  const incomeCert = docMap.get('income_certificate');

  const fields: FieldComparison[] = [];

  // Helper to get field from doc
  const getField = (doc: DocumentExtraction | undefined, fieldId: FieldId) => {
    return doc?.fields.find((f) => f.field_id === fieldId) || null;
  };

  const sampleUrls: Record<string, Record<string, string>> = {
    clean_sample: {
      application_form: '/samples/clean_form.svg',
      marksheet: '/samples/clean_marksheet.svg',
      income_certificate: '/samples/clean_income_cert.svg',
    },
    messy_sample: {
      application_form: '/samples/messy_form.svg',
      marksheet: '/samples/messy_marksheet.svg',
      income_certificate: '/samples/messy_income_cert.svg',
    },
  };

  const toDocEntry = (
    docType: 'application_form' | 'marksheet' | 'income_certificate',
    docLabel: string,
    fieldId: FieldId,
    normalizedVal: string | number | null
  ): DocumentComparisonEntry => {
    const raw = getField(docMap.get(docType), fieldId);
    return {
      doc_type: docType,
      doc_label: docLabel,
      raw_value: raw?.value || null,
      normalized_value: normalizedVal,
      quote: raw?.quote || null,
      page: raw?.page || 1,
      confidence: raw?.confidence ?? 0,
      source: raw?.source || 'extracted',
      highlight_bbox: raw?.highlight_bbox,
      double_read: raw?.double_read,
      preview_url: sampleUrls[packetType]?.[docType],
    };
  };

  const checkDoubleReadMismatch = (docs: DocumentComparisonEntry[]): string | null => {
    for (const d of docs) {
      if (d.double_read && !d.double_read.agreed) {
        return (
          d.double_read.disagreement_reason ||
          `Double-read mismatch on ${d.doc_label}: full-page read disagrees with isolated bounding-box crop read.`
        );
      }
    }
    return null;
  };

  // 1. Name (Form, Marksheet, Income Certificate)
  const formNameField = getField(form, 'name');
  const marksheetNameField = getField(marksheet, 'name');
  const incomeNameField = getField(incomeCert, 'name');

  const nameDocs: DocumentComparisonEntry[] = [
    toDocEntry('application_form', 'Application Form', 'name', formNameField?.value || null),
    toDocEntry('marksheet', 'Marksheet', 'name', marksheetNameField?.value || null),
    toDocEntry('income_certificate', 'Income Certificate', 'name', incomeNameField?.value || null),
  ];

  // Check containment and confidence for each
  const formNameQuoteOk = verifyQuoteContainment(formNameField?.value || null, formNameField?.quote || null);
  const marksNameQuoteOk = verifyQuoteContainment(marksheetNameField?.value || null, marksheetNameField?.quote || null);
  const incNameQuoteOk = verifyQuoteContainment(incomeNameField?.value || null, incomeNameField?.quote || null);

  const formNameConfOk = (formNameField?.confidence ?? 0) >= CONFIDENCE_THRESHOLD;
  const marksNameConfOk = (marksheetNameField?.confidence ?? 0) >= CONFIDENCE_THRESHOLD;
  const incNameConfOk = (incomeNameField?.confidence ?? 0) >= CONFIDENCE_THRESHOLD;

  const pairwiseResult = evaluateNamePairwise(
    formNameField?.value || null,
    marksheetNameField?.value || null,
    incomeNameField?.value || null
  );

  let nameStatus = pairwiseResult.status;
  let nameReason = pairwiseResult.status_reason;

  if (!formNameQuoteOk || !marksNameQuoteOk || !incNameQuoteOk) {
    nameStatus = 'Needs Review';
    nameReason = 'Name quote verification failed on one or more documents.';
  } else if (!formNameConfOk || !marksNameConfOk || !incNameConfOk) {
    nameStatus = 'Needs Review';
    nameReason = 'Name extracted with low OCR confidence; requires manual review.';
  }

  const nameDoubleReadErr = checkDoubleReadMismatch(nameDocs);
  if (nameDoubleReadErr) {
    nameStatus = 'Needs Review';
    nameReason = nameDoubleReadErr;
  }

  fields.push({
    field_id: 'name',
    field_label: 'Student Name',
    status: nameStatus,
    status_reason: nameReason,
    documents: nameDocs,
    pairwise_details: pairwiseResult.pairwise_details,
    diff_explanation:
      nameStatus === 'Consistent'
        ? 'Identical student name verified across all three documents.'
        : nameReason,
    resolution: 'unresolved',
  });

  // 2. Academic Year (Form, Marksheet)
  const formYear = getField(form, 'academic_year');
  const marksYear = getField(marksheet, 'academic_year');

  const normYearForm = formYear?.value?.trim().toLowerCase().replace(/\s+/g, '') || null;
  const normYearMarks = marksYear?.value?.trim().toLowerCase().replace(/\s+/g, '') || null;

  const yearDocs: DocumentComparisonEntry[] = [
    toDocEntry('application_form', 'Application Form', 'academic_year', normYearForm),
    toDocEntry('marksheet', 'Marksheet', 'academic_year', normYearMarks),
  ];

  const yearQuoteOk =
    verifyQuoteContainment(formYear?.value || null, formYear?.quote || null) &&
    verifyQuoteContainment(marksYear?.value || null, marksYear?.quote || null);
  const yearConfOk =
    (formYear?.confidence ?? 0) >= CONFIDENCE_THRESHOLD &&
    (marksYear?.confidence ?? 0) >= CONFIDENCE_THRESHOLD;

  let yearStatus: FieldStatus = 'Consistent';
  let yearReason = '';

  if (!formYear?.value || !marksYear?.value) {
    yearStatus = 'Needs Review';
    yearReason = 'Academic year unreadable or missing on one document.';
  } else if (!yearQuoteOk) {
    yearStatus = 'Needs Review';
    yearReason = 'Academic year quote could not be verified in source document text.';
  } else if (!yearConfOk) {
    yearStatus = 'Needs Review';
    yearReason = 'Academic year extracted with low confidence.';
  } else if (normYearForm === normYearMarks) {
    yearStatus = 'Consistent';
    yearReason = `Academic year "${formYear.value}" matches between Application and Marksheet.`;
  } else {
    yearStatus = 'Conflict';
    yearReason = `Academic year mismatch: Application states "${formYear.value}" but Marksheet states "${marksYear.value}".`;
  }

  const yearDoubleReadErr = checkDoubleReadMismatch(yearDocs);
  if (yearDoubleReadErr) {
    yearStatus = 'Needs Review';
    yearReason = yearDoubleReadErr;
  }

  fields.push({
    field_id: 'academic_year',
    field_label: 'Academic Year',
    status: yearStatus,
    status_reason: yearReason,
    documents: yearDocs,
    diff_explanation: yearReason,
    resolution: 'unresolved',
  });

  // 3. Marks Percentage (Form, Marksheet)
  const formMarks = getField(form, 'marks');
  const marksMarks = getField(marksheet, 'marks');

  const normMarksForm = normalizeMarks(formMarks?.value || null);
  const normMarksDoc = normalizeMarks(marksMarks?.value || null);

  const marksDocs: DocumentComparisonEntry[] = [
    toDocEntry('application_form', 'Application Form', 'marks', normMarksForm.value ? `${normMarksForm.value}%` : null),
    toDocEntry('marksheet', 'Marksheet', 'marks', normMarksDoc.value ? `${normMarksDoc.value}%` : null),
  ];

  const marksQuoteOk =
    verifyQuoteContainment(formMarks?.value || null, formMarks?.quote || null) &&
    verifyQuoteContainment(marksMarks?.value || null, marksMarks?.quote || null);
  const marksConfOk =
    (formMarks?.confidence ?? 0) >= CONFIDENCE_THRESHOLD &&
    (marksMarks?.confidence ?? 0) >= CONFIDENCE_THRESHOLD;

  let marksStatus: FieldStatus = 'Consistent';
  let marksReason = '';

  if (!formMarks?.value || !marksMarks?.value) {
    marksStatus = 'Needs Review';
    marksReason = 'Marks percentage missing or unreadable on one document.';
  } else if (normMarksForm.isCgpa || normMarksDoc.isCgpa) {
    marksStatus = 'Needs Review';
    marksReason = 'Marks appear in CGPA or non-percentage scale; requires manual verification.';
  } else if (!marksQuoteOk) {
    marksStatus = 'Needs Review';
    marksReason = 'Extracted marks could not be confirmed in document quote text.';
  } else if (!marksConfOk) {
    marksStatus = 'Needs Review';
    marksReason = 'Marks extracted with low OCR confidence.';
  } else if (normMarksForm.value === normMarksDoc.value) {
    marksStatus = 'Consistent';
    marksReason = `Marks percentage ${normMarksForm.value}% matches across Application and Marksheet.`;
  } else {
    marksStatus = 'Conflict';
    const delta = ((normMarksForm.value || 0) - (normMarksDoc.value || 0)).toFixed(1);
    marksReason = `Marks conflict: Application states ${normMarksForm.value}%, marksheet records ${normMarksDoc.value}% (difference of ${delta}%).`;
  }

  const marksDoubleReadErr = checkDoubleReadMismatch(marksDocs);
  if (marksDoubleReadErr) {
    marksStatus = 'Needs Review';
    marksReason = marksDoubleReadErr;
  }

  fields.push({
    field_id: 'marks',
    field_label: 'Marks Percentage',
    status: marksStatus,
    status_reason: marksReason,
    documents: marksDocs,
    diff_explanation: marksReason,
    resolution: 'unresolved',
  });

  // 4. Annual Income (Form, Income Certificate)
  const formIncome = getField(form, 'income');
  const certIncome = getField(incomeCert, 'income');

  const normIncomeForm = normalizeIncome(formIncome?.value || null);
  const normIncomeCert = normalizeIncome(certIncome?.value || null);

  const formatRupees = (val: number | null) => (val !== null ? `₹${val.toLocaleString('en-IN')}/year` : null);

  const incomeDocs: DocumentComparisonEntry[] = [
    toDocEntry('application_form', 'Application Form', 'income', formatRupees(normIncomeForm.value)),
    toDocEntry('income_certificate', 'Income Certificate', 'income', formatRupees(normIncomeCert.value)),
  ];

  const incomeQuoteOk =
    verifyQuoteContainment(formIncome?.value || null, formIncome?.quote || null) &&
    verifyQuoteContainment(certIncome?.value || null, certIncome?.quote || null);
  const incomeConfOk =
    (formIncome?.confidence ?? 0) >= CONFIDENCE_THRESHOLD &&
    (certIncome?.confidence ?? 0) >= CONFIDENCE_THRESHOLD;

  let incomeStatus: FieldStatus = 'Consistent';
  let incomeReason = '';

  if (!formIncome?.value || !certIncome?.value) {
    incomeStatus = 'Needs Review';
    incomeReason = 'Income value missing or unreadable on one document.';
  } else if (normIncomeForm.isAmbiguous || normIncomeCert.isAmbiguous) {
    incomeStatus = 'Needs Review';
    incomeReason = 'Income period (monthly vs annual) could not be unambiguously confirmed.';
  } else if (!incomeQuoteOk) {
    incomeStatus = 'Needs Review';
    incomeReason = 'Extracted income could not be verified in quoted document excerpt.';
  } else if (!incomeConfOk) {
    incomeStatus = 'Needs Review';
    incomeReason = 'Income figure extracted with low OCR confidence.';
  } else if (normIncomeForm.value === normIncomeCert.value) {
    incomeStatus = 'Consistent';
    incomeReason = `Annual income normalized to ₹${normIncomeForm.value?.toLocaleString('en-IN')} matches across both documents.`;
  } else {
    incomeStatus = 'Conflict';
    const formFormatted = `₹${normIncomeForm.value?.toLocaleString('en-IN')}`;
    const certFormatted = `₹${normIncomeCert.value?.toLocaleString('en-IN')}`;
    incomeReason = `Income conflict: Application reports ${formFormatted}/year, but Income Certificate verifies ${certFormatted}/year.`;
  }

  const incomeDoubleReadErr = checkDoubleReadMismatch(incomeDocs);
  if (incomeDoubleReadErr) {
    incomeStatus = 'Needs Review';
    incomeReason = incomeDoubleReadErr;
  }

  fields.push({
    field_id: 'income',
    field_label: 'Annual Family Income',
    status: incomeStatus,
    status_reason: incomeReason,
    documents: incomeDocs,
    diff_explanation: incomeReason,
    resolution: 'unresolved',
  });

  // 5. Certificate Issue Date (Form, Income Certificate)
  const formDate = getField(form, 'issue_date');
  const certDate = getField(incomeCert, 'issue_date');

  const normDateForm = normalizeDate(formDate?.value || null);
  const normDateCert = normalizeDate(certDate?.value || null);

  const dateDocs: DocumentComparisonEntry[] = [
    toDocEntry('application_form', 'Application Form', 'issue_date', normDateForm.iso),
    toDocEntry('income_certificate', 'Income Certificate', 'issue_date', normDateCert.iso),
  ];

  const dateQuoteOk =
    verifyQuoteContainment(formDate?.value || null, formDate?.quote || null) &&
    verifyQuoteContainment(certDate?.value || null, certDate?.quote || null);
  const dateConfOk =
    (formDate?.confidence ?? 0) >= CONFIDENCE_THRESHOLD &&
    (certDate?.confidence ?? 0) >= CONFIDENCE_THRESHOLD;

  let dateStatus: FieldStatus = 'Consistent';
  let dateReason = '';

  if (!formDate?.value || !certDate?.value) {
    dateStatus = 'Needs Review';
    dateReason = 'Issue date missing on one document.';
  } else if (normDateForm.isAmbiguous || normDateCert.isAmbiguous) {
    dateStatus = 'Needs Review';
    dateReason = 'Date format could not be unambiguously parsed (expected DD/MM/YYYY).';
  } else if (!dateQuoteOk) {
    dateStatus = 'Needs Review';
    dateReason = 'Extracted issue date could not be confirmed in document quote.';
  } else if (!dateConfOk) {
    dateStatus = 'Needs Review';
    dateReason = 'Issue date extracted with low confidence.';
  } else if (normDateForm.iso === normDateCert.iso) {
    dateStatus = 'Consistent';
    dateReason = `Certificate issue date (${normDateForm.iso}) matches across Application and Certificate.`;
  } else {
    dateStatus = 'Conflict';
    dateReason = `Date mismatch: Application states ${formDate.value} (parsed as ${normDateForm.iso}), but Income Certificate shows ${certDate.value} (parsed as ${normDateCert.iso}).`;
  }

  const dateDoubleReadErr = checkDoubleReadMismatch(dateDocs);
  if (dateDoubleReadErr) {
    dateStatus = 'Needs Review';
    dateReason = dateDoubleReadErr;
  }

  fields.push({
    field_id: 'issue_date',
    field_label: 'Certificate Issue Date',
    status: dateStatus,
    status_reason: dateReason,
    documents: dateDocs,
    diff_explanation: dateReason,
    resolution: 'unresolved',
  });

  // Aggregate counts
  let conflicts_count = 0;
  let consistent_count = 0;
  let needs_review_count = 0;

  for (const f of fields) {
    if (f.status === 'Conflict') conflicts_count++;
    else if (f.status === 'Consistent') consistent_count++;
    else needs_review_count++;
  }

  return {
    packet_type: packetType,
    total_fields: fields.length,
    conflicts_count,
    consistent_count,
    needs_review_count,
    fields,
  };
}
