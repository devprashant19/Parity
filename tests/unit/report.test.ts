import { describe, it, expect } from 'vitest';
import { generatePdfReport } from '@/lib/report/pdf';
import { draftIssuingOfficeMessage } from '@/lib/report/messageDrafter';
import { VerificationResult, FieldComparison } from '@/lib/compare/types';

describe('Slice D: Downloadable Report (PDF) & Issuing Office Draft', () => {
  const mockResult: VerificationResult = {
    packet_type: 'clean_sample',
    fields: [
      {
        field_id: 'name',
        field_label: 'Candidate Name',
        status: 'Consistent',
        status_reason: 'All names match canonical representation',
        documents: [
          {
            doc_type: 'application_form',
            doc_label: 'Application Form',
            raw_value: 'SURESH SHARMA',
            normalized_value: 'SURESH SHARMA',
            quote: 'SURESH SHARMA',
            page: 1,
            confidence: 0.98,
            source: 'extracted',
            bbox: { ymin: 100, xmin: 150, ymax: 130, xmax: 400 },
          },
          {
            doc_type: 'marksheet',
            doc_label: 'Marksheet',
            raw_value: 'SURESH SHARMA',
            normalized_value: 'SURESH SHARMA',
            quote: 'SURESH SHARMA',
            page: 1,
            confidence: 0.98,
            source: 'extracted',
            bbox: { ymin: 105, xmin: 152, ymax: 132, xmax: 395 },
          },
        ],
      },
      {
        field_id: 'income',
        field_label: 'Annual Family Income',
        status: 'Conflict',
        status_reason: 'Values differ by ₹60,000 (exceeds tolerance of ₹0)',
        diff_explanation: 'Application states ₹2,40,000, income certificate records ₹1,80,000.',
        documents: [
          {
            doc_type: 'application_form',
            doc_label: 'Application Form',
            raw_value: '₹2,40,000',
            normalized_value: '240000',
            quote: 'Annual Family Income: Rs. 2,40,000',
            page: 1,
            confidence: 0.95,
            source: 'extracted',
            bbox: { ymin: 450, xmin: 200, ymax: 480, xmax: 380 },
          },
          {
            doc_type: 'income_certificate',
            doc_label: 'Income Certificate',
            raw_value: '₹1,80,000',
            normalized_value: '180000',
            quote: 'Gross annual income certified as Rs 1,80,000/- only',
            page: 1,
            confidence: 0.92,
            source: 'extracted',
            bbox: { ymin: 380, xmin: 210, ymax: 410, xmax: 420 },
          },
        ],
      },
      {
        field_id: 'marks',
        field_label: 'Marks Percentage',
        status: 'Needs Review',
        status_reason: 'Crop-level double-read verification disagreement',
        diff_explanation: 'Primary pass extracted "92.4%", but crop verification read "89.4%".',
        documents: [
          {
            doc_type: 'application_form',
            doc_label: 'Application Form',
            raw_value: '92.4%',
            normalized_value: '92.4%',
            quote: 'Aggregate Marks: 92.4%',
            page: 1,
            confidence: 0.9,
            source: 'extracted',
          },
          {
            doc_type: 'marksheet',
            doc_label: 'Marksheet',
            raw_value: '89.4%',
            normalized_value: '89.4%',
            quote: 'TOTAL PERCENTAGE: 89.4%',
            page: 1,
            confidence: 0.88,
            source: 'extracted',
            double_read: {
              value: '89.4%',
              matches_primary: false,
              verified_at: '2026-10-23T12:00:00Z',
            },
          },
        ],
      },
    ],
    conflicts_count: 1,
    consistent_count: 1,
    needs_review_count: 1,
    generated_at: '2026-10-23T15:00:00Z',
  };

  describe('generatePdfReport', () => {
    it('produces a valid jsPDF document instance', () => {
      const doc = generatePdfReport(mockResult, 'Scholarship Document Packet');
      expect(doc).toBeDefined();
      expect(doc.internal.pages.length).toBeGreaterThanOrEqual(1);
    });

    it('generates non-empty arrayBuffer output for file saving', () => {
      const doc = generatePdfReport(mockResult, 'College Admission Preset');
      const output = doc.output('arraybuffer');
      expect(output).toBeDefined();
      expect(output.byteLength).toBeGreaterThan(1000);
    });

    it('handles multiple pages if many fields are present', () => {
      const manyFields: FieldComparison[] = Array.from({ length: 15 }, (_, i) => ({
        field_id: `custom_field_${i}`,
        field_label: `Custom Test Field ${i}`,
        status: i % 2 === 0 ? 'Consistent' : 'Conflict',
        status_reason: `Reason for field ${i}`,
        documents: [
          {
            doc_type: 'application_form',
            doc_label: 'Application Form',
            raw_value: `ValA_${i}`,
            normalized_value: `ValA_${i}`,
            quote: `Exemplary quote A ${i}`,
            page: 1,
            confidence: 0.95,
            source: 'extracted',
          },
          {
            doc_type: 'supporting_doc',
            doc_label: 'Supporting Document',
            raw_value: `ValB_${i}`,
            normalized_value: `ValB_${i}`,
            quote: `Exemplary quote B ${i}`,
            page: 1,
            confidence: 0.92,
            source: 'extracted',
          },
        ],
      }));

      const longResult: VerificationResult = {
        packet_type: 'clean_sample',
        fields: manyFields,
        conflicts_count: 7,
        consistent_count: 8,
        needs_review_count: 0,
        generated_at: '2026-10-23T15:00:00Z',
      };

      const doc = generatePdfReport(longResult, 'Multi-page Test Packet');
      expect(doc.internal.pages.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('draftIssuingOfficeMessage', () => {
    it('drafts a formal letter for income certificate discrepancy targeting Revenue Department', () => {
      const incomeField = mockResult.fields.find((f) => f.field_id === 'income')!;
      const letter = draftIssuingOfficeMessage({
        field: incomeField,
        studentName: 'Aarav Patel',
        referenceId: 'INC-2024-9912',
      });

      expect(letter.subject).toContain('Urgent: Request for Clerical Correction in Annual Family Income');
      expect(letter.subject).toContain('[Ref / Roll No: INC-2024-9912]');
      expect(letter.recipient).toContain('Revenue Office');
      expect(letter.body).toContain('Aarav Patel');
      expect(letter.body).toContain('Primary Application Record (Application Form): "₹2,40,000"');
      expect(letter.body).toContain('Issued Certificate Record (Income Certificate): "₹1,80,000"');
      expect(letter.body).toContain('Gross annual income certified as Rs 1,80,000/- only');
      expect(letter.enclosures.length).toBe(3);
    });

    it('drafts a letter for marks discrepancy targeting Academic Examination Board', () => {
      const marksField = mockResult.fields.find((f) => f.field_id === 'marks')!;
      const letter = draftIssuingOfficeMessage({
        field: marksField,
        studentName: 'Priya Nair',
        studentEmail: 'priya@example.com',
        studentPhone: '+91 98765 43210',
      });

      expect(letter.recipient).toContain('Examination Board');
      expect(letter.body).toContain('Priya Nair');
      expect(letter.body).toContain('Email: priya@example.com');
      expect(letter.body).toContain('Phone: +91 98765 43210');
      expect(letter.body).toContain('TOTAL PERCENTAGE: 89.4%');
    });

    it('honors explicitly specified issuing authority override', () => {
      const field = mockResult.fields[0];
      const customOffice = 'Office of the District Collector, Pune District';
      const letter = draftIssuingOfficeMessage({
        field,
        issuingAuthority: customOffice,
      });

      expect(letter.recipient).toBe(customOffice);
      expect(letter.body).toContain(`To,\n${customOffice}`);
    });
  });
});
