import { describe, it, expect } from 'vitest';
import { normalizeBBox } from '@/lib/normalize/bbox';
import { BoundingBoxSchema } from '@/lib/gemini/schema';
import { CLEAN_SAMPLE_PACKET, MESSY_SAMPLE_PACKET } from '@/data/samples';

describe('Slice A: Bounding-box Evidence Normalization and Validation', () => {
  it('returns undefined when raw bounding box is missing or null', () => {
    expect(normalizeBBox(undefined)).toBeUndefined();
    expect(normalizeBBox(null)).toBeUndefined();
    expect(normalizeBBox('')).toBeUndefined();
  });

  it('normalizes already normalized 0..1 coordinates', () => {
    const raw = { x: 0.1234, y: 0.4567, width: 0.3, height: 0.05 };
    const bbox = normalizeBBox(raw);
    expect(bbox).toBeDefined();
    expect(bbox?.x).toBe(0.123);
    expect(bbox?.y).toBe(0.457);
    expect(bbox?.width).toBe(0.3);
    expect(bbox?.height).toBe(0.05);
  });

  it('normalizes [ymin, xmin, ymax, xmax] 0..1000 scale array', () => {
    const raw = [346, 67, 423, 934]; // ymin, xmin, ymax, xmax
    const bbox = normalizeBBox(raw);
    expect(bbox).toBeDefined();
    expect(bbox?.x).toBe(0.067);
    expect(bbox?.y).toBe(0.346);
    expect(bbox?.width).toBe(0.867);
    expect(bbox?.height).toBe(0.077);
  });

  it('normalizes pixel coordinates scaled to reference canvas (600x520)', () => {
    const raw = { x: 40, y: 180, width: 520, height: 40 };
    const bbox = normalizeBBox(raw, 600, 520);
    expect(bbox).toBeDefined();
    expect(bbox?.x).toBe(0.067);
    expect(bbox?.y).toBe(0.346);
    expect(bbox?.width).toBe(0.867);
    expect(bbox?.height).toBe(0.077);
  });

  it('clamps coordinates strictly within 0.0 to 1.0 boundary', () => {
    const raw = { x: -0.1, y: 0.05, width: 0.5, height: 0.8 };
    const bbox = normalizeBBox(raw);
    expect(bbox).toBeDefined();
    expect(bbox?.x).toBe(0);
    expect(bbox?.y).toBe(0.05);
    expect(bbox!.width + bbox!.x).toBeLessThanOrEqual(1.0);
  });

  it('validates schema transformation for array and object formats', () => {
    const parsedObj = BoundingBoxSchema.parse({ x: 0.1, y: 0.2, width: 0.5, height: 0.1 });
    expect(parsedObj).toEqual({ x: 0.1, y: 0.2, width: 0.5, height: 0.1 });

    const parsedArr = BoundingBoxSchema.parse([200, 100, 300, 600]);
    expect(parsedArr).toEqual({ x: 0.1, y: 0.2, width: 0.5, height: 0.1 });
  });

  it('confirms every sample packet field has precomputed normalized bounding boxes', () => {
    for (const doc of [...CLEAN_SAMPLE_PACKET, ...MESSY_SAMPLE_PACKET]) {
      for (const field of doc.fields) {
        expect(field.highlight_bbox).toBeDefined();
        const b = field.highlight_bbox!;
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x).toBeLessThanOrEqual(1);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeLessThanOrEqual(1);
        expect(b.width).toBeGreaterThan(0);
        expect(b.height).toBeGreaterThan(0);
        expect(b.x + b.width).toBeLessThanOrEqual(1.001);
        expect(b.y + b.height).toBeLessThanOrEqual(1.001);
      }
    }
  });
});
