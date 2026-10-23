import { describe, it, expect } from 'vitest';
import { generatePdfReport } from '@/lib/report/pdf';
import { draftIssuingOfficeMessage } from '@/lib/report/messageDrafter';
import { VerificationResult, FieldComparison } from '@/lib/compare/types';

describe('Slice D: Downloadable Report (PDF) & Issuing Office Draft', () => {
  const mockResult: VerificationResult = {
    packet_type: 'clean_sample',
    total_fields: 3,
    fields: [
      {
        field_id: 'name',
        field_label: 'Candidate Name',
        status: 'Consistent',
        status_reason: 'All names match canonical representation',
        diff_explanation: 'All names match canonical representation',
        resolution: 'unresolved',
        documents: [
          {
            doc_type: 'application_form',
            doc_label: 'Application Form',
            raw_value: 'Alex Morgan',
            normalized_value: 'Alex Morgan',
            quote: 'Applicant: Alex Morgan',
            page: 1,
            confidence: 0.98,
            source: 'extracted',
            highlight_bbox: { x: 0.15, y: 0.1, width: 0.25, height: 0.03 },
          },
          {
            doc_type: 'marksheet',
            doc_label: 'Academic Transcript',
            raw_value: 'Alex Morgan',
            normalized_value: 'Alex Morgan',
            quote: 'Student Name: Alex Morgan',
            page: 1,
            confidence: 0.98,
            source: 'extracted',
            highlight_bbox: { x: 0.152, y: 0.105, width: 0.243, height: 0.027 },
          },
        ],
      },
      {
        field_id: 'income',
        field_label: 'Annual Family Income',
        status: 'Conflict',
        status_reason: 'Values differ by $17,000 (exceeds tolerance of $0)',
        diff_explanation: 'Application states $65,000, Proof of Income records $48,000.',
        resolution: 'unresolved',
        documents: [
          {
            doc_type: 'application_form',
            doc_label: 'Application Form',
            raw_value: '$65,000',
            normalized_value: '65000',
            quote: 'Annual Family Income: $65,000',
            page: 1,
            confidence: 0.95,
            source: 'extracted',
            highlight_bbox: { x: 0.2, y: 0.45, width: 0.18, height: 0.03 },
          },
          {
            doc_type: 'income_certificate',
            doc_label: 'Proof of Income',
            raw_value: '$48,000',
            normalized_value: '48000',
            quote: 'Gross annual income certified as $48,000',
            page: 1,
            confidence: 0.92,
            source: 'extracted',
            highlight_bbox: { x: 0.21, y: 0.38, width: 0.21, height: 0.03 },
          },
        ],
      },
      {
        field_id: 'marks',
        field_label: 'Marks Percentage',
        status: 'Needs Review',
        status_reason: 'Crop-level double-read verification disagreement',
        diff_explanation: 'Primary pass extracted "92.4%", but crop verification read "89.4%".',
        resolution: 'unresolved',
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
            doc_label: 'Academic Transcript',
            raw_value: '89.4%',
            normalized_value: '89.4%',
            quote: 'TOTAL PERCENTAGE: 89.4%',
            page: 1,
            confidence: 0.88,
            source: 'extracted',
            double_read: {
              agreed: false,
              crop_value: '89.4%',
              disagreement_reason: 'Mismatch between full page and crop read',
            },
          },
        ],
      },
    ],
    conflicts_count: 1,
    consistent_count: 1,
    needs_review_count: 1,
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
        diff_explanation: `Explanation for field ${i}`,
        resolution: 'unresolved',
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
            doc_type: 'marksheet',
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
        total_fields: 15,
        fields: manyFields,
        conflicts_count: 7,
        consistent_count: 8,
        needs_review_count: 0,
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
        studentName: 'Alex Morgan',
        referenceId: 'INC-2024-9912',
      });

      expect(letter.subject).toContain('Urgent: Request for Clerical Correction in Annual Family Income');
      expect(letter.subject).toContain('[Ref / Roll No: INC-2024-9912]');
      expect(letter.recipient).toContain('Revenue Office');
      expect(letter.body).toContain('Alex Morgan');
      expect(letter.body).toContain('Primary Application Record (Application Form): "$65,000"');
      expect(letter.body).toContain('Issued Certificate Record (Proof of Income): "$48,000"');
      expect(letter.body).toContain('Gross annual income certified as $48,000');
      expect(letter.enclosures.length).toBe(3);
    });

    it('drafts a letter for marks discrepancy targeting Academic Examination Board', () => {
      const marksField = mockResult.fields.find((f) => f.field_id === 'marks')!;
      const letter = draftIssuingOfficeMessage({
        field: marksField,
        studentName: 'Maria Alvarez',
        studentEmail: 'maria.alvarez@example.com',
        studentPhone: '+1 (555) 019-2834',
      });

      expect(letter.recipient).toContain('Examination Board');
      expect(letter.body).toContain('Maria Alvarez');
      expect(letter.body).toContain('Email: maria.alvarez@example.com');
      expect(letter.body).toContain('Phone: +1 (555) 019-2834');
      expect(letter.body).toContain('TOTAL PERCENTAGE: 89.4%');
    });

    it('honors explicitly specified issuing authority override', () => {
      const field = mockResult.fields[0];
      const customOffice = 'Office of the Registrar, Central University';
      const letter = draftIssuingOfficeMessage({
        field,
        issuingAuthority: customOffice,
      });

      expect(letter.recipient).toBe(customOffice);
      expect(letter.body).toContain(`To,\n${customOffice}`);
    });
  });
});
