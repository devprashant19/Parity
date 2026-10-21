import { describe, it, expect } from 'vitest';
import { generateFixPlan } from '@/lib/fixplan/generator';
import { exportToCsv } from '@/lib/fixplan/exporter';
import { FieldComparison } from '@/lib/compare/types';

describe('generateFixPlan', () => {
  const mockFields: FieldComparison[] = [
    {
      field_id: 'marks',
      field_label: 'Marks Percentage',
      status: 'Conflict',
      status_reason: 'Difference of 3.0%',
      diff_explanation: 'Application states 92.4%, marksheet records 89.4%.',
      resolution: 'document_b_correct', // Marksheet is correct
      documents: [
        {
          doc_type: 'application_form',
          doc_label: 'Application Form',
          raw_value: '92.4%',
          normalized_value: '92.4%',
          quote: '92.4%',
          page: 1,
          confidence: 0.95,
          source: 'extracted',
        },
        {
          doc_type: 'marksheet',
          doc_label: 'Marksheet',
          raw_value: '89.4%',
          normalized_value: '89.4%',
          quote: '89.4%',
          page: 1,
          confidence: 0.95,
          source: 'extracted',
        },
      ],
    },
    {
      field_id: 'income',
      field_label: 'Annual Family Income',
      status: 'Conflict',
      status_reason: 'Income conflict',
      diff_explanation: 'Application states ₹2,40,000, income certificate records ₹1,80,000.',
      resolution: 'document_a_correct', // Student claims application is correct, cert is wrong
      documents: [
        {
          doc_type: 'application_form',
          doc_label: 'Application Form',
          raw_value: '₹2,40,000',
          normalized_value: '₹2,40,000',
          quote: '₹2,40,000',
          page: 1,
          confidence: 0.95,
          source: 'extracted',
        },
        {
          doc_type: 'income_certificate',
          doc_label: 'Income Certificate',
          raw_value: '₹1,80,000',
          normalized_value: '₹1,80,000',
          quote: '₹1,80,000',
          page: 1,
          confidence: 0.95,
          source: 'extracted',
        },
      ],
    },
    {
      field_id: 'name',
      field_label: 'Student Name',
      status: 'Needs Review',
      status_reason: 'Possible match with initials',
      diff_explanation: 'Initials detected on income cert',
      resolution: 'unresolved',
      documents: [],
    },
    {
      field_id: 'academic_year',
      field_label: 'Academic Year',
      status: 'Consistent',
      status_reason: 'Matches',
      diff_explanation: 'Session 2024-25 matches',
      resolution: 'unresolved',
      documents: [],
    },
  ];

  it('generates "Update application form" when official document is declared correct', () => {
    const plan = generateFixPlan(mockFields);
    const marksItem = plan.fixBeforeSubmitting.find((i) => i.field_id === 'marks');
    expect(marksItem).toBeDefined();
    expect(marksItem?.instruction).toBe('Update the application form to 89.4%');
  });

  it('generates "Request a corrected document" when official certificate is declared wrong', () => {
    const plan = generateFixPlan(mockFields);
    const incomeItem = plan.fixBeforeSubmitting.find((i) => i.field_id === 'income');
    expect(incomeItem).toBeDefined();
    expect(incomeItem?.instruction).toBe('Request a corrected document from the issuing office');
    expect(incomeItem?.detail).toContain('Official credentials cannot be manually altered');
  });

  it('categorizes Needs Review fields under needs_manual_review', () => {
    const plan = generateFixPlan(mockFields);
    const nameItem = plan.needsManualReview.find((i) => i.field_id === 'name');
    expect(nameItem).toBeDefined();
    expect(nameItem?.category).toBe('needs_manual_review');
  });

  it('categorizes Consistent fields under consistent', () => {
    const plan = generateFixPlan(mockFields);
    const yearItem = plan.consistent.find((i) => i.field_id === 'academic_year');
    expect(yearItem).toBeDefined();
    expect(yearItem?.category).toBe('consistent');
  });

  it('exports valid CSV formatted string', () => {
    const csv = exportToCsv(mockFields);
    expect(csv).toContain('"Category","Field","Status"');
    expect(csv).toContain('"Fix Before Submitting"');
    expect(csv).toContain('"Update the application form to 89.4%"');
    expect(csv).toContain('"Request a corrected document from the issuing office"');
  });
});
