import {
  DocumentExtraction,
  DocumentComparisonEntry,
  FieldComparison,
  FieldId,
  FieldStatus,
  VerificationResult,
  CustomFieldDefinition,
  CONFIDENCE_THRESHOLD,
} from './types';
import { verifyQuoteContainment } from './containment';
import { evaluateNamePairwise } from './name';
import { normalizeIncome, normalizeMarks } from '../normalize/numbers';
import { normalizeDate, normalizeAcademicYear } from '../normalize/dates';
import { evaluateCustomField } from './custom';

export function runVerification(
  extractions: DocumentExtraction[],
  packetType: 'clean_sample' | 'messy_sample' | 'live' = 'live',
  customFieldDefs?: CustomFieldDefinition[],
  dateFormatSetting: 'Auto' | 'DMY' | 'MDY' = 'Auto'
): VerificationResult {
  const docMap = new Map<string, DocumentExtraction>();
  for (const doc of extractions) {
    docMap.set(doc.document_type, doc);
  }

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

  // If custom field definitions are provided, evaluate them with the custom deterministic engine
  if (customFieldDefs && customFieldDefs.length > 0) {
    const fields: FieldComparison[] = customFieldDefs.map((def) =>
      evaluateCustomField(def, docMap, sampleUrls[packetType], dateFormatSetting)
    );

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

  const form = docMap.get('application_form');
  const marksheet = docMap.get('marksheet');
  const incomeCert = docMap.get('income_certificate');

  const fields: FieldComparison[] = [];

  // Helper to get field from doc
  const getField = (doc: DocumentExtraction | undefined, fieldId: FieldId) => {
    return doc?.fields.find((f) => f.field_id === fieldId) || null;
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

  // 1. Name (Form, Transcript/Marksheet, Proof of Income)
  const formNameField = getField(form, 'name');
  const marksheetNameField = getField(marksheet, 'name');
  const incomeNameField = getField(incomeCert, 'name');

  const nameDocs: DocumentComparisonEntry[] = [
    toDocEntry('application_form', 'Application Form', 'name', formNameField?.value || null),
    toDocEntry('marksheet', 'Academic Transcript', 'name', marksheetNameField?.value || null),
    toDocEntry('income_certificate', 'Proof of Income', 'name', incomeNameField?.value || null),
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

  // 2. Academic Year (Form, Transcript)
  const formYear = getField(form, 'academic_year');
  const marksYear = getField(marksheet, 'academic_year');

  const normYearForm = normalizeAcademicYear(formYear?.value || null);
  const normYearMarks = normalizeAcademicYear(marksYear?.value || null);

  const yearDocs: DocumentComparisonEntry[] = [
    toDocEntry('application_form', 'Application Form', 'academic_year', normYearForm),
    toDocEntry('marksheet', 'Academic Transcript', 'academic_year', normYearMarks),
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
    yearReason = `Academic year "${formYear.value}" matches between Application and Academic Transcript.`;
  } else {
    yearStatus = 'Conflict';
    yearReason = `Academic year mismatch: Application states "${formYear.value}" but Transcript states "${marksYear.value}".`;
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

  // 3. Academic Performance / GPA (Form, Transcript)
  const formMarks = getField(form, 'marks');
  const marksMarks = getField(marksheet, 'marks');

  const normMarksForm = normalizeMarks(formMarks?.value || null);
  const normMarksDoc = normalizeMarks(marksMarks?.value || null);

  const formatMarksDisplay = (m: typeof normMarksForm) => {
    if (m.value === null) return null;
    if (m.scale === 'percentage') return `${m.value}%`;
    return `${m.value} GPA (${m.scale} scale)`;
  };

  const marksDocs: DocumentComparisonEntry[] = [
    toDocEntry('application_form', 'Application Form', 'marks', formatMarksDisplay(normMarksForm)),
    toDocEntry('marksheet', 'Academic Transcript', 'marks', formatMarksDisplay(normMarksDoc)),
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
    marksReason = 'Academic score missing or unreadable on one document.';
  } else if (!marksQuoteOk) {
    marksStatus = 'Needs Review';
    marksReason = 'Extracted academic score could not be confirmed in document quote text.';
  } else if (!marksConfOk) {
    marksStatus = 'Needs Review';
    marksReason = 'Academic score extracted with low OCR confidence.';
  } else if (normMarksForm.scale !== normMarksDoc.scale) {
    marksStatus = 'Needs Review';
    marksReason = `GPA scales differ across documents (${normMarksForm.scale} vs ${normMarksDoc.scale}); requires manual verification.`;
  } else if (normMarksForm.value === normMarksDoc.value) {
    marksStatus = 'Consistent';
    const scaleLabel = normMarksForm.scale === 'percentage' ? '%' : ` GPA (${normMarksForm.scale} scale)`;
    marksReason = `Academic performance ${normMarksForm.value}${scaleLabel} matches across Application and Academic Transcript.`;
  } else {
    marksStatus = 'Conflict';
    const scaleLabel = normMarksForm.scale === 'percentage' ? '%' : ` GPA`;
    const delta = Math.abs((normMarksForm.value || 0) - (normMarksDoc.value || 0)).toFixed(2);
    marksReason = `Academic performance conflict: Application states ${normMarksForm.value}${scaleLabel}, transcript records ${normMarksDoc.value}${scaleLabel} (difference of ${delta}).`;
  }

  const marksDoubleReadErr = checkDoubleReadMismatch(marksDocs);
  if (marksDoubleReadErr) {
    marksStatus = 'Needs Review';
    marksReason = marksDoubleReadErr;
  }

  fields.push({
    field_id: 'marks',
    field_label: 'Academic Performance / GPA',
    status: marksStatus,
    status_reason: marksReason,
    documents: marksDocs,
    diff_explanation: marksReason,
    resolution: 'unresolved',
  });

  // 4. Annual Household Income (Form, Proof of Income)
  const formIncome = getField(form, 'income');
  const certIncome = getField(incomeCert, 'income');

  const normIncomeForm = normalizeIncome(formIncome?.value || null, formIncome?.quote);
  const normIncomeCert = normalizeIncome(certIncome?.value || null, certIncome?.quote);

  const formatIncomeDisplay = (inc: typeof normIncomeForm) => {
    if (inc.value === null) return null;
    const sym = inc.currencySymbol || '$';
    return `${sym}${inc.value.toLocaleString()}/year`;
  };

  const incomeDocs: DocumentComparisonEntry[] = [
    toDocEntry('application_form', 'Application Form', 'income', formatIncomeDisplay(normIncomeForm)),
    toDocEntry('income_certificate', 'Proof of Income', 'income', formatIncomeDisplay(normIncomeCert)),
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
  } else if (
    normIncomeForm.currency !== 'UNKNOWN' &&
    normIncomeCert.currency !== 'UNKNOWN' &&
    normIncomeForm.currency !== normIncomeCert.currency
  ) {
    incomeStatus = 'Needs Review';
    incomeReason = `Different currencies detected across documents (${normIncomeForm.currency} vs ${normIncomeCert.currency}); requires manual exchange rate review.`;
  } else if (!incomeQuoteOk) {
    incomeStatus = 'Needs Review';
    incomeReason = 'Extracted income could not be verified in quoted document excerpt.';
  } else if (!incomeConfOk) {
    incomeStatus = 'Needs Review';
    incomeReason = 'Income figure extracted with low OCR confidence.';
  } else if (normIncomeForm.value === normIncomeCert.value) {
    incomeStatus = 'Consistent';
    const sym = normIncomeForm.currencySymbol || normIncomeCert.currencySymbol || '$';
    let freqNote = '';
    if (normIncomeCert.frequencyFactor > 1) {
      freqNote = ` (annualized from ${certIncome?.value} via x${normIncomeCert.frequencyFactor} factor)`;
    } else if (normIncomeForm.frequencyFactor > 1) {
      freqNote = ` (annualized from ${formIncome?.value} via x${normIncomeForm.frequencyFactor} factor)`;
    }
    incomeReason = `Annual income matches across documents (${sym}${normIncomeForm.value?.toLocaleString()}/year${freqNote}).`;
  } else {
    incomeStatus = 'Conflict';
    const symForm = normIncomeForm.currencySymbol || '$';
    const symCert = normIncomeCert.currencySymbol || '$';
    const formFormatted = `${symForm}${normIncomeForm.value?.toLocaleString()}`;
    const certFormatted = `${symCert}${normIncomeCert.value?.toLocaleString()}`;
    incomeReason = `Income conflict: Application reports ${formFormatted}/year, but Proof of Income verifies ${certFormatted}/year.`;
  }

  const incomeDoubleReadErr = checkDoubleReadMismatch(incomeDocs);
  if (incomeDoubleReadErr) {
    incomeStatus = 'Needs Review';
    incomeReason = incomeDoubleReadErr;
  }

  fields.push({
    field_id: 'income',
    field_label: 'Annual Household Income',
    status: incomeStatus,
    status_reason: incomeReason,
    documents: incomeDocs,
    diff_explanation: incomeReason,
    resolution: 'unresolved',
  });

  // 5. Document Issue Date (Form, Proof of Income)
  const formDate = getField(form, 'issue_date');
  const certDate = getField(incomeCert, 'issue_date');

  const normDateForm = normalizeDate(formDate?.value || null, dateFormatSetting);
  const normDateCert = normalizeDate(certDate?.value || null, dateFormatSetting);

  const dateDocs: DocumentComparisonEntry[] = [
    toDocEntry('application_form', 'Application Form', 'issue_date', normDateForm.iso),
    toDocEntry('income_certificate', 'Proof of Income', 'issue_date', normDateCert.iso),
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
    dateReason = normDateForm.ambiguityReason || normDateCert.ambiguityReason || 'Ambiguous numeric date format (e.g. DD/MM vs MM/DD); requires manual review.';
  } else if (!dateQuoteOk) {
    dateStatus = 'Needs Review';
    dateReason = 'Extracted issue date could not be confirmed in document quote.';
  } else if (!dateConfOk) {
    dateStatus = 'Needs Review';
    dateReason = 'Issue date extracted with low confidence.';
  } else if (normDateForm.iso === normDateCert.iso) {
    dateStatus = 'Consistent';
    dateReason = `Document issue date (${normDateForm.iso}) matches across Application and Proof of Income.`;
  } else {
    dateStatus = 'Conflict';
    dateReason = `Date mismatch: Application states ${formDate.value} (parsed as ${normDateForm.iso}), but Proof of Income shows ${certDate.value} (parsed as ${normDateCert.iso}).`;
  }

  const dateDoubleReadErr = checkDoubleReadMismatch(dateDocs);
  if (dateDoubleReadErr) {
    dateStatus = 'Needs Review';
    dateReason = dateDoubleReadErr;
  }

  fields.push({
    field_id: 'issue_date',
    field_label: 'Document Issue Date',
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
