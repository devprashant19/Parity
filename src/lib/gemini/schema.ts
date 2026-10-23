import { z } from 'zod';

export const BoundingBoxSchema = z.union([
  z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).transform((b) => {
    if (b.x <= 1.0 && b.y <= 1.0 && b.width <= 1.0 && b.height <= 1.0 && (b.width > 0 || b.height > 0)) {
      return {
        x: Math.round(Math.max(0, Math.min(1, b.x)) * 1000) / 1000,
        y: Math.round(Math.max(0, Math.min(1, b.y)) * 1000) / 1000,
        width: Math.round(Math.max(0.01, Math.min(1 - b.x, b.width)) * 1000) / 1000,
        height: Math.round(Math.max(0.01, Math.min(1 - b.y, b.height)) * 1000) / 1000,
      };
    }
    const baseW = b.x > 100 || b.width > 100 ? (b.x > 600 ? 1000 : 600) : 100;
    const baseH = b.y > 100 || b.height > 100 ? (b.y > 520 ? 1000 : 520) : 100;
    const nx = Math.max(0, Math.min(1, b.x / baseW));
    const ny = Math.max(0, Math.min(1, b.y / baseH));
    return {
      x: Math.round(nx * 1000) / 1000,
      y: Math.round(ny * 1000) / 1000,
      width: Math.round(Math.max(0.01, Math.min(1 - nx, b.width / baseW)) * 1000) / 1000,
      height: Math.round(Math.max(0.01, Math.min(1 - ny, b.height / baseH)) * 1000) / 1000,
    };
  }),
  z.array(z.number()).length(4).transform(([ymin, xmin, ymax, xmax]) => {
    const scale = Math.max(ymin, xmin, ymax, xmax) > 1.0 ? 1000 : 1.0;
    const x0 = Math.max(0, Math.min(1, xmin / scale));
    const y0 = Math.max(0, Math.min(1, ymin / scale));
    const x1 = Math.max(0, Math.min(1, xmax / scale));
    const y1 = Math.max(0, Math.min(1, ymax / scale));
    return {
      x: Math.round(x0 * 1000) / 1000,
      y: Math.round(y0 * 1000) / 1000,
      width: Math.round(Math.max(0.01, x1 - x0) * 1000) / 1000,
      height: Math.round(Math.max(0.01, y1 - y0) * 1000) / 1000,
    };
  }),
]);

export const ExtractedFieldSchema = z.object({
  field_id: z.string(),
  value: z.string().nullable(),
  quote: z.string().nullable(),
  page: z.number().int().default(1),
  confidence: z.number().min(0).max(1),
  highlight_bbox: BoundingBoxSchema.optional().nullable(),
});

export const DocumentExtractionSchema = z.object({
  document_type: z.string(),
  document_label: z.string().default(''),
  fields: z.array(ExtractedFieldSchema),
});

export type ExtractedField = z.infer<typeof ExtractedFieldSchema>;
export type DocumentExtraction = z.infer<typeof DocumentExtractionSchema>;
