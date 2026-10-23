import { describe, it, expect } from 'vitest';
import {
  normalizeIdentifier,
  normalizeGenericText,
  evaluateCustomField,
  PACKET_PRESETS,
} from '../../src/lib/compare/custom';
import { runVerification } from '../../src/lib/compare/engine';
import {
  COLLEGE_ADMISSION_SAMPLE_PACKET,
  FINANCIAL_AID_SAMPLE_PACKET,
} from '../../src/data/samples';
import { CustomFieldDefinition, DocumentExtraction } from '../../src/lib/compare/types';

describe('Slice C: Packet Presets & Custom Field Deterministic Rules', () => {
  describe('normalizeIdentifier', () => {
    it('normalizes alphanumeric IDs by removing delimiters and casing to upper', () => {
      expect(normalizeIdentifier('app-2024-8891')).toBe('APP20248891');
      expect(normalizeIdentifier('APP 2024.8891')).toBe('APP20248891');
      expect(normalizeIdentifier('ABCDE-1234-F')).toBe('ABCDE1234F');
      expect(normalizeIdentifier('  roll/9876_a  ')).toBe('ROLL9876A');
      expect(normalizeIdentifier(null)).toBeNull();
      expect(normalizeIdentifier('   ')).toBeNull();
    });
  });

  describe('normalizeGenericText', () => {
    it('collapses spaces and trims text', () => {
      expect(normalizeGenericText('  EWS   Scheme   A  ')).toBe('EWS Scheme A');
      expect(normalizeGenericText(null)).toBeNull();
      expect(normalizeGenericText('   ')).toBeNull();
    });
  });

  describe('evaluateCustomField for 5 data types', () => {
    it('evaluates "id" type deterministically (Consistent on sanitized match, Conflict on mismatch)', () => {
      const fieldDef: CustomFieldDefinition = {
        id: 'id_number',
        label: 'Roll ID',
        type: 'id',
        target_documents: ['application_form', 'marksheet'],
      };

      const docMapMatch = new Map<string, DocumentExtraction>([
        [
          'application_form',
          {
            document_type: 'application_form',
            document_label: 'Application Form',
            fields: [{ field_id: 'id_number', value: 'APP-2024-001', quote: 'ID: APP-2024-001', confidence: 0.95, page: 1 }],
          },
        ],
        [
          'marksheet',
          {
            document_type: 'marksheet',
            document_label: 'Academic Transcript',
            fields: [{ field_id: 'id_number', value: 'app 2024.001', quote: 'Roll: app 2024.001', confidence: 0.95, page: 1 }],
          },
        ],
      ]);

      const resMatch = evaluateCustomField(fieldDef, docMapMatch);
      expect(resMatch.status).toBe('Consistent');
      expect(resMatch.documents[0].normalized_value).toBe('APP2024001');

      // Conflict test
      const docMapConflict = new Map<string, DocumentExtraction>([
        [
          'application_form',
          {
            document_type: 'application_form',
            document_label: 'Application Form',
            fields: [{ field_id: 'id_number', value: 'APP-2024-001', quote: 'ID: APP-2024-001', confidence: 0.95, page: 1 }],
          },
        ],
        [
          'marksheet',
          {
            document_type: 'marksheet',
            document_label: 'Academic Transcript',
            fields: [{ field_id: 'id_number', value: 'APP-2024-999', quote: 'Roll: APP-2024-999', confidence: 0.95, page: 1 }],
          },
        ],
      ]);

      const resConflict = evaluateCustomField(fieldDef, docMapConflict);
      expect(resConflict.status).toBe('Conflict');
      expect(resConflict.status_reason).toContain('Identifier conflict');
    });

    it('evaluates "date" type deterministically (Consistent on equal calendar date, Conflict on date mismatch)', () => {
      const fieldDef: CustomFieldDefinition = {
        id: 'dob',
        label: 'Date of Birth',
        type: 'date',
        target_documents: ['application_form', 'marksheet'],
      };

      const docMap = new Map<string, DocumentExtraction>([
        [
          'application_form',
          {
            document_type: 'application_form',
            document_label: 'Application Form',
            fields: [{ field_id: 'dob', value: '14/05/2006', quote: 'DOB: 14/05/2006', confidence: 0.95, page: 1 }],
          },
        ],
        [
          'marksheet',
          {
            document_type: 'marksheet',
            document_label: 'Academic Transcript',
            fields: [{ field_id: 'dob', value: '2006-05-14', quote: 'Birth Date: 2006-05-14', confidence: 0.95, page: 1 }],
          },
        ],
      ]);

      const res = evaluateCustomField(fieldDef, docMap);
      expect(res.status).toBe('Consistent');
      expect(res.documents[0].normalized_value).toBe('2006-05-14');
    });

    it('evaluates "amount" type deterministically (handles annual scaling and conflicts)', () => {
      const fieldDef: CustomFieldDefinition = {
        id: 'income',
        label: 'Family Income',
        type: 'amount',
        target_documents: ['application_form', 'income_certificate'],
      };

      const docMap = new Map<string, DocumentExtraction>([
        [
          'application_form',
          {
            document_type: 'application_form',
            document_label: 'Application Form',
            fields: [{ field_id: 'income', value: '₹3,00,000 per annum', quote: 'Total: ₹3,00,000 per annum', confidence: 0.95, page: 1 }],
          },
        ],
        [
          'income_certificate',
          {
            document_type: 'income_certificate',
            document_label: 'Income Certificate',
            fields: [{ field_id: 'income', value: '₹25,000 per month', quote: 'Monthly: ₹25,000 per month', confidence: 0.95, page: 1 }],
          },
        ],
      ]);

      const res = evaluateCustomField(fieldDef, docMap);
      expect(res.status).toBe('Consistent');
    });

    it('evaluates "name" type deterministically (Needs Review on initial variation)', () => {
      const fieldDef: CustomFieldDefinition = {
        id: 'name',
        label: 'Student Name',
        type: 'name',
        target_documents: ['application_form', 'marksheet'],
      };

      const docMap = new Map<string, DocumentExtraction>([
        [
          'application_form',
          {
            document_type: 'application_form',
            document_label: 'Application Form',
            fields: [{ field_id: 'name', value: 'Aman Patel', quote: 'Name: Aman Patel', confidence: 0.95, page: 1 }],
          },
        ],
        [
          'marksheet',
          {
            document_type: 'marksheet',
            document_label: 'Academic Transcript',
            fields: [{ field_id: 'name', value: 'A. Patel', quote: 'Student: A. Patel', confidence: 0.95, page: 1 }],
          },
        ],
      ]);

      const res = evaluateCustomField(fieldDef, docMap);
      expect(res.status).toBe('Needs Review');
      expect(res.status_reason).toContain('Name abbreviation or initial variation');
    });

    it('evaluates "text" type deterministically', () => {
      const fieldDef: CustomFieldDefinition = {
        id: 'category',
        label: 'Aid Category',
        type: 'text',
        target_documents: ['application_form', 'income_certificate'],
      };

      const docMapMatch = new Map<string, DocumentExtraction>([
        [
          'application_form',
          {
            document_type: 'application_form',
            document_label: 'Application Form',
            fields: [{ field_id: 'category', value: 'EWS Scheme A', quote: 'Category: EWS Scheme A', confidence: 0.95, page: 1 }],
          },
        ],
        [
          'income_certificate',
          {
            document_type: 'income_certificate',
            document_label: 'Income Certificate',
            fields: [{ field_id: 'category', value: 'ews scheme a', quote: 'Cat: ews scheme a', confidence: 0.95, page: 1 }],
          },
        ],
      ]);

      const resMatch = evaluateCustomField(fieldDef, docMapMatch);
      expect(resMatch.status).toBe('Consistent');

      // Conflict
      const docMapConflict = new Map<string, DocumentExtraction>([
        [
          'application_form',
          {
            document_type: 'application_form',
            document_label: 'Application Form',
            fields: [{ field_id: 'category', value: 'EWS Scheme A', quote: 'Category: EWS Scheme A', confidence: 0.95, page: 1 }],
          },
        ],
        [
          'income_certificate',
          {
            document_type: 'income_certificate',
            document_label: 'Income Certificate',
            fields: [{ field_id: 'category', value: 'EWS Scheme B', quote: 'Cat: EWS Scheme B', confidence: 0.95, page: 1 }],
          },
        ],
      ]);

      const resConflict = evaluateCustomField(fieldDef, docMapConflict);
      expect(resConflict.status).toBe('Conflict');
    });

    it('flags Needs Review when double-read verification fails on a custom field', () => {
      const fieldDef: CustomFieldDefinition = {
        id: 'id_number',
        label: 'Roll ID',
        type: 'id',
        target_documents: ['application_form', 'marksheet'],
      };

      const docMap = new Map<string, DocumentExtraction>([
        [
          'application_form',
          {
            document_type: 'application_form',
            document_label: 'Application Form',
            fields: [
              {
                field_id: 'id_number',
                value: 'APP-2024-001',
                quote: 'ID: APP-2024-001',
                confidence: 0.95,
                page: 1,
                double_read: {
                  agreed: false,
                  crop_value: 'APP-2024-999',
                  disagreement_reason: 'Double-read mismatch on Application Form: crop disagrees',
                },
              },
            ],
          },
        ],
        [
          'marksheet',
          {
            document_type: 'marksheet',
            document_label: 'Academic Transcript',
            fields: [{ field_id: 'id_number', value: 'APP-2024-001', quote: 'Roll: APP-2024-001', confidence: 0.95, page: 1 }],
          },
        ],
      ]);

      const res = evaluateCustomField(fieldDef, docMap);
      expect(res.status).toBe('Needs Review');
      expect(res.status_reason).toContain('Double-read mismatch');
    });
  });

  describe('Preset Verification execution', () => {
    it('executes college admission preset verification cleanly', () => {
      const admissionPreset = PACKET_PRESETS.find((p) => p.id === 'college_admission')!;
      expect(admissionPreset).toBeDefined();

      const result = runVerification(
        COLLEGE_ADMISSION_SAMPLE_PACKET,
        'clean_sample',
        admissionPreset.fields
      );

      expect(result.total_fields).toBe(5);
      const idField = result.fields.find((f) => f.field_id === 'id_number');
      expect(idField).toBeDefined();
      expect(idField?.status).toBe('Consistent'); // APP-2024-8891 vs APP20248891 normalized match!

      const marksField = result.fields.find((f) => f.field_id === 'marks');
      expect(marksField).toBeDefined();
      expect(marksField?.status).toBe('Conflict'); // 94.2% vs 91.8%
    });

    it('executes financial aid preset verification cleanly', () => {
      const aidPreset = PACKET_PRESETS.find((p) => p.id === 'financial_aid')!;
      expect(aidPreset).toBeDefined();

      const result = runVerification(
        FINANCIAL_AID_SAMPLE_PACKET,
        'clean_sample',
        aidPreset.fields
      );

      expect(result.total_fields).toBe(5);
      const taxField = result.fields.find((f) => f.field_id === 'tax_id');
      expect(taxField).toBeDefined();
      expect(taxField?.status).toBe('Consistent'); // ABCDE1234F vs ABCDE-1234-F

      const nameField = result.fields.find((f) => f.field_id === 'name');
      expect(nameField).toBeDefined();
      expect(nameField?.status).toBe('Needs Review'); // Aman Patel vs A. Patel initial
    });
  });
});
