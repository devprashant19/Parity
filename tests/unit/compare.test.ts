import { describe, it, expect } from 'vitest';
import { verifyQuoteContainment } from '@/lib/compare/containment';
import { combineStatuses, evaluateNamePairwise } from '@/lib/compare/name';
import { runVerification } from '@/lib/compare/engine';
import { DocumentExtraction } from '@/lib/compare/types';

describe('verifyQuoteContainment', () => {
  it('passes when value is literally present inside quote', () => {
    const value = '92.4%';
    const quote = 'The candidate scored 92.4% aggregate in class 12.';
    expect(verifyQuoteContainment(value, quote)).toBe(true);
  });

  it('passes for regional currency grouping inside quote', () => {
    const value = '₹2,40,000';
    const quote = 'Annual family income certified as Rs. 2,40,000 only.';
    expect(verifyQuoteContainment(value, quote)).toBe(true);
  });

  it('fails when extracted value does not appear in quote', () => {
    const value = '89.4%';
    const quote = 'The candidate scored 92.4% aggregate in class 12.';
    expect(verifyQuoteContainment(value, quote)).toBe(false);
  });

  it('fails when quote exceeds 200 characters', () => {
    const value = '2024-25';
    const longQuote = 'Academic Year: 2024-25. '.repeat(15); // > 200 chars
    expect(verifyQuoteContainment(value, longQuote)).toBe(false);
  });

  it('fails when value or quote is null or empty', () => {
    expect(verifyQuoteContainment(null, 'Some quote')).toBe(false);
    expect(verifyQuoteContainment('92.4', null)).toBe(false);
  });
});

describe('Status Precedence (Conflict > Needs Review > Consistent)', () => {
  it('Conflict outranks Needs Review', () => {
    expect(combineStatuses('Conflict', 'Needs Review')).toBe('Conflict');
    expect(combineStatuses('Needs Review', 'Conflict')).toBe('Conflict');
  });

  it('Conflict outranks Consistent', () => {
    expect(combineStatuses('Conflict', 'Consistent')).toBe('Conflict');
    expect(combineStatuses('Consistent', 'Conflict')).toBe('Conflict');
  });

  it('Needs Review outranks Consistent', () => {
    expect(combineStatuses('Needs Review', 'Consistent')).toBe('Needs Review');
    expect(combineStatuses('Consistent', 'Needs Review')).toBe('Needs Review');
  });

  it('Consistent only when both are Consistent', () => {
    expect(combineStatuses('Consistent', 'Consistent')).toBe('Consistent');
  });

  it('Pairwise Name evaluation handles mixed precedence', () => {
    // Form vs Transcript: Consistent (Suresh Sharma vs Suresh Sharma)
    // Form vs Income Cert: Needs Review (Suresh Sharma vs S. Sharma)
    const result = evaluateNamePairwise('Suresh Sharma', 'Suresh Sharma', 'S. Sharma');
    expect(result.status).toBe('Needs Review');
    expect(result.pairwise_details[0].status).toBe('Consistent');
    expect(result.pairwise_details[1].status).toBe('Needs Review');
  });

  it('Pairwise Name evaluation marks Conflict if one pair conflicts', () => {
    // Form vs Transcript: Needs Review (S. Sharma)
    // Form vs Income Cert: Conflict (Suresh Verma)
    const result = evaluateNamePairwise('Suresh Sharma', 'S. Sharma', 'Suresh Verma');
    expect(result.status).toBe('Conflict');
  });
});

describe('runVerification Engine', () => {
  const cleanSampleExtractions: DocumentExtraction[] = [
    {
      document_type: 'application_form',
      document_label: 'Application Form',
      fields: [
        { field_id: 'name', value: 'Alex Morgan', quote: 'Applicant Name: Alex Morgan', page: 1, confidence: 0.95 },
        { field_id: 'academic_year', value: '2024-25', quote: 'Academic Year: 2024-25', page: 1, confidence: 0.95 },
        { field_id: 'marks', value: '3.80 GPA', quote: 'Cumulative GPA: 3.80 out of 4.0', page: 1, confidence: 0.95 },
        { field_id: 'income', value: '$65,000', quote: 'Total annual household income: $65,000 per year', page: 1, confidence: 0.95 },
        { field_id: 'issue_date', value: '12 Aug 2024', quote: 'Date of declaration: 12 Aug 2024', page: 1, confidence: 0.95 },
      ],
    },
    {
      document_type: 'marksheet',
      document_label: 'Academic Transcript',
      fields: [
        { field_id: 'name', value: 'Alex Morgan', quote: 'Student Name: Alex Morgan', page: 1, confidence: 0.95 },
        { field_id: 'academic_year', value: '2024-2025', quote: 'Session: 2024-2025', page: 1, confidence: 0.95 },
        { field_id: 'marks', value: '3.50 GPA', quote: 'Grand Total: 3.50 / 4.0 GPA', page: 1, confidence: 0.95 },
      ],
    },
    {
      document_type: 'income_certificate',
      document_label: 'Proof of Income',
      fields: [
        { field_id: 'name', value: 'Alex Morgan', quote: 'Certified that Alex Morgan', page: 1, confidence: 0.95 },
        { field_id: 'income', value: '$48,000', quote: 'Annual income is assessed at $48,000 per annum', page: 1, confidence: 0.95 },
        { field_id: 'issue_date', value: '18 Aug 2024', quote: 'Issued on date: 18 Aug 2024', page: 1, confidence: 0.95 },
      ],
    },
  ];

  it('asserts Clean Sample produces exactly 3 Conflicts, 2 Consistent, 0 Needs Review', () => {
    const result = runVerification(cleanSampleExtractions, 'clean_sample');
    expect(result.conflicts_count).toBe(3);
    expect(result.consistent_count).toBe(2);
    expect(result.needs_review_count).toBe(0);

    const marksField = result.fields.find((f) => f.field_id === 'marks');
    expect(marksField?.status).toBe('Conflict');

    const incomeField = result.fields.find((f) => f.field_id === 'income');
    expect(incomeField?.status).toBe('Conflict');

    const dateField = result.fields.find((f) => f.field_id === 'issue_date');
    expect(dateField?.status).toBe('Conflict');

    const nameField = result.fields.find((f) => f.field_id === 'name');
    expect(nameField?.status).toBe('Consistent');

    const yearField = result.fields.find((f) => f.field_id === 'academic_year');
    expect(yearField?.status).toBe('Consistent');
  });

  it('transitions to Needs Review if confidence is below threshold (< 0.7)', () => {
    const lowConfSample = JSON.parse(JSON.stringify(cleanSampleExtractions));
    lowConfSample[1].fields[2].confidence = 0.55; // Transcript marks confidence = 0.55

    const result = runVerification(lowConfSample, 'live');
    const marksField = result.fields.find((f) => f.field_id === 'marks');
    expect(marksField?.status).toBe('Needs Review');
  });

  it('transitions to Needs Review if quote containment fails', () => {
    const brokenQuoteSample = JSON.parse(JSON.stringify(cleanSampleExtractions));
    brokenQuoteSample[0].fields[1].quote = 'Unrelated text without the year';

    const result = runVerification(brokenQuoteSample, 'live');
    const yearField = result.fields.find((f) => f.field_id === 'academic_year');
    expect(yearField?.status).toBe('Needs Review');
  });

  it('null extraction is never Consistent', () => {
    const nullSample = JSON.parse(JSON.stringify(cleanSampleExtractions));
    nullSample[0].fields[0].value = null;

    const result = runVerification(nullSample, 'live');
    const nameField = result.fields.find((f) => f.field_id === 'name');
    expect(nameField?.status).toBe('Needs Review');
  });
});
