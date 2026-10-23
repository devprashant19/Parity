import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  cropImageToBoundingBox,
  compareDoubleReadValues,
} from '../../src/lib/gemini/doubleRead';
import { runVerification } from '../../src/lib/compare/engine';
import { DocumentExtraction } from '../../src/lib/compare/types';

describe('Slice B: Double-read verification and crop extraction', () => {
  it('crops an image buffer to bounding box bounds cleanly', async () => {
    // Create a 400x300 test image using sharp
    const testImage = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const bbox = { x: 0.1, y: 0.2, width: 0.4, height: 0.15 };
    const cropped = await cropImageToBoundingBox(testImage, bbox);

    expect(Buffer.isBuffer(cropped)).toBe(true);
    const meta = await sharp(cropped).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBeGreaterThan(0);
    expect(meta.height).toBeGreaterThan(0);
  });

  describe('compareDoubleReadValues deterministic rules', () => {
    it('agrees when full-page read and crop read match exactly', () => {
      const res = compareDoubleReadValues('name', 'Suresh Sharma', 'Suresh Sharma');
      expect(res.agreed).toBe(true);
    });

    it('agrees on token subset / token reordering in name', () => {
      const res = compareDoubleReadValues('name', 'Suresh Kumar Sharma', 'Suresh Sharma');
      expect(res.agreed).toBe(true);
    });

    it('disagrees when names are fundamentally different', () => {
      const res = compareDoubleReadValues('name', 'Suresh Sharma', 'Ramesh Verma');
      expect(res.agreed).toBe(false);
      expect(res.reason).toContain('Double-read name mismatch');
    });

    it('disagrees when crop value is empty or null', () => {
      const res = compareDoubleReadValues('marks', '92.4%', null);
      expect(res.agreed).toBe(false);
      expect(res.reason).toContain('Double-read failed');
    });

    it('agrees on normalized marks numbers', () => {
      const res = compareDoubleReadValues('marks', '92.40%', '92.4%');
      expect(res.agreed).toBe(true);
    });

    it('disagrees when marks percentage differs', () => {
      const res = compareDoubleReadValues('marks', '92.4%', '89.4%');
      expect(res.agreed).toBe(false);
      expect(res.reason).toContain('Double-read marks mismatch');
    });

    it('agrees on normalized income amounts', () => {
      const res = compareDoubleReadValues('income', '₹2,40,000 per annum', '240000');
      expect(res.agreed).toBe(true);
    });

    it('disagrees when income figures conflict', () => {
      const res = compareDoubleReadValues('income', '₹2,40,000', '₹1,80,000');
      expect(res.agreed).toBe(false);
      expect(res.reason).toContain('Double-read income mismatch');
    });

    it('agrees on normalized date formats', () => {
      const res = compareDoubleReadValues('issue_date', '15/07/2024', '2024-07-15');
      expect(res.agreed).toBe(true);
    });

    it('disagrees on conflicting dates', () => {
      const res = compareDoubleReadValues('issue_date', '15/07/2024', '12/08/2024');
      expect(res.agreed).toBe(false);
      expect(res.reason).toContain('Double-read date mismatch');
    });
  });

  describe('runVerification deterministic override on double-read mismatch', () => {
    it('overrides field status to Needs Review when a double-read disagrees', () => {
      const mockDocs: DocumentExtraction[] = [
        {
          document_type: 'application_form',
          document_label: 'Application Form',
          fields: [
            {
              field_id: 'name',
              value: 'Suresh Sharma',
              quote: 'Name: Suresh Sharma',
              page: 1,
              confidence: 0.98,
              double_read: {
                agreed: false,
                crop_value: 'Ramesh Verma',
                disagreement_reason: 'Double-read name mismatch: full page read "Suresh Sharma" vs crop read "Ramesh Verma"',
              },
            },
            {
              field_id: 'academic_year',
              value: '2024-25',
              quote: 'Year: 2024-25',
              page: 1,
              confidence: 0.98,
              double_read: { agreed: true, crop_value: '2024-25' },
            },
          ],
        },
        {
          document_type: 'marksheet',
          document_label: 'Academic Transcript',
          fields: [
            {
              field_id: 'name',
              value: 'Suresh Sharma',
              quote: 'Name: Suresh Sharma',
              page: 1,
              confidence: 0.98,
              double_read: { agreed: true, crop_value: 'Suresh Sharma' },
            },
            {
              field_id: 'academic_year',
              value: '2024-25',
              quote: 'Year: 2024-25',
              page: 1,
              confidence: 0.98,
              double_read: { agreed: true, crop_value: '2024-25' },
            },
          ],
        },
        {
          document_type: 'income_certificate',
          document_label: 'Income Certificate',
          fields: [
            {
              field_id: 'name',
              value: 'Suresh Sharma',
              quote: 'Name: Suresh Sharma',
              page: 1,
              confidence: 0.98,
              double_read: { agreed: true, crop_value: 'Suresh Sharma' },
            },
          ],
        },
      ];

      const result = runVerification(mockDocs, 'live');
      const nameField = result.fields.find((f) => f.field_id === 'name');
      expect(nameField).toBeDefined();
      expect(nameField?.status).toBe('Needs Review');
      expect(nameField?.status_reason).toContain('Double-read name mismatch');

      const yearField = result.fields.find((f) => f.field_id === 'academic_year');
      expect(yearField).toBeDefined();
      expect(yearField?.status).toBe('Consistent');
    });
  });
});
