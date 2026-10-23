import { describe, it, expect, vi } from 'vitest';
import sharp from 'sharp';
import {
  cropImageToFullWidthBand,
  verifyDocumentCropsBatch,
  runDoubleReadForConsistentFields,
} from '@/lib/gemini/doubleRead';
import { DocumentExtraction } from '@/lib/compare/types';

describe('Batched Full-Width Band Double-Read Verification', () => {
  it('crops full-width horizontal band spanning entire image width with vertical row padding', async () => {
    const testImage = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 4,
        background: { r: 240, g: 240, b: 240, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const bbox = { x: 0.2, y: 0.35, width: 0.4, height: 0.05 };
    const croppedBuffer = await cropImageToFullWidthBand(testImage, bbox);

    expect(Buffer.isBuffer(croppedBuffer)).toBe(true);
    const meta = await sharp(croppedBuffer).metadata();
    expect(meta.width).toBe(800); // Must span full width
    expect(meta.height).toBeGreaterThan(30); // Padded vertical row
  });

  it('runs double-read ONLY for fields that would be Consistent, skipping existing Conflicts', async () => {
    const testImage = await sharp({
      create: {
        width: 600,
        height: 500,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    // Create extractions where:
    // - name: Consistent between doc1 and doc2 (Alex Morgan vs Alex Morgan)
    // - marks: Conflict between doc1 and doc2 (3.80 GPA vs 3.50 GPA)
    const extractions: DocumentExtraction[] = [
      {
        document_type: 'application_form',
        document_label: 'Application Form',
        fields: [
          {
            field_id: 'name',
            value: 'Alex Morgan',
            quote: 'Applicant: Alex Morgan',
            page: 1,
            confidence: 0.98,
            highlight_bbox: { x: 0.1, y: 0.2, width: 0.8, height: 0.05 },
          },
          {
            field_id: 'marks',
            value: '3.80 GPA',
            quote: 'GPA: 3.80',
            page: 1,
            confidence: 0.98,
            highlight_bbox: { x: 0.1, y: 0.3, width: 0.8, height: 0.05 },
          },
        ],
      },
      {
        document_type: 'marksheet',
        document_label: 'Marksheet',
        fields: [
          {
            field_id: 'name',
            value: 'Alex Morgan',
            quote: 'Student: Alex Morgan',
            page: 1,
            confidence: 0.98,
            highlight_bbox: { x: 0.1, y: 0.2, width: 0.8, height: 0.05 },
          },
          {
            field_id: 'marks',
            value: '3.50 GPA',
            quote: 'GPA: 3.50',
            page: 1,
            confidence: 0.98,
            highlight_bbox: { x: 0.1, y: 0.3, width: 0.8, height: 0.05 },
          },
        ],
      },
      {
        document_type: 'income_certificate',
        document_label: 'Proof of Income',
        fields: [
          {
            field_id: 'name',
            value: 'Alex Morgan',
            quote: 'Taxpayer: Alex Morgan',
            page: 1,
            confidence: 0.98,
            highlight_bbox: { x: 0.1, y: 0.2, width: 0.8, height: 0.05 },
          },
        ],
      },
    ];

    const documentBuffers = new Map<string, Buffer>();
    documentBuffers.set('Application Form', testImage);
    documentBuffers.set('Marksheet', testImage);
    documentBuffers.set('Proof of Income', testImage);

    // Run double-read verification (offline mode, no API key provided)
    const result = await runDoubleReadForConsistentFields({
      extractions,
      documentBuffers,
    });

    // Only 'name' was consistent, so double-read should have targeted 'name' across all 3 docs
    expect(result.fieldsChecked).toBe(3); // name in doc1, name in doc2, name in doc3
    expect(result.cropCallsMade).toBe(3); // 1 batched call for each doc containing Consistent fields

    const doc1Name = extractions[0].fields.find((f) => f.field_id === 'name');
    expect(doc1Name?.double_read).toBeDefined();
    expect(doc1Name?.double_read?.agreed).toBe(true);

    const doc1Marks = extractions[0].fields.find((f) => f.field_id === 'marks');
    // Marks was already a Conflict, so double-read was skipped
    expect(doc1Marks?.double_read).toBeUndefined();

  });
});
